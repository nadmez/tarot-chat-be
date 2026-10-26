// @ts-check
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { getOpenAI } from "@lib/openai";
import { getRandomCards } from "@features/cards";
import { getLastConversationId, setLastConversationId } from "./history.js";

/** @import { TarotCard } from '@features/cards' */

/**
 * @typedef {object} ChatResponse
 * @property {string} message
 * @property {string} id
 * @property {TarotCard[]} cards
 */

const template = readFileSync(join(import.meta.dirname, "tarot.txt"), "utf-8");

const model_temperature = 0.5;

/**
 * Built per request so the messages use the request's language.
 * @param {(key: string) => string} translate
 */
function buildChatSchema(translate) {
  return z.object({
    prompt: z
      .string()
      .trim()
      .min(1, translate("server.errors.emptyPrompt"))
      .max(1000, translate("server.errors.promptTooLong")),
    conversationId: z.uuid(),
  });
}

/**
 * @param {string} prompt
 * @param {string} conversationId
 * @returns {Promise<ChatResponse>}
 */
export async function sendMessage(prompt, conversationId) {
  // Draw 3 random cards and format them as JSON for the prompt
  const cards = getRandomCards(3);
  const cardInfo = JSON.stringify(cards, null, 2);

  const instructions = template
    .replace("{{cardInfo}}", cardInfo)
    .replace("{{today}}", new Date().toDateString());

  const response = await getOpenAI().responses.create({
    model: "gpt-4o-mini",
    input: prompt,
    instructions,
    temperature: model_temperature,
    previous_response_id: getLastConversationId(conversationId),
  });

  setLastConversationId(conversationId, response.id);

  return {
    message: response.output_text,
    id: response.id,
    cards,
  };
}

/** @param {import('express').Router} router */
export default function register(router) {
  router.post("/chat", async (req, res) => {
    const translate = res.locals.t;
    try {
      const parsed = buildChatSchema(translate).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(z.treeifyError(parsed.error));
      }
      const { prompt, conversationId } = parsed.data;
      res.json(await sendMessage(prompt, conversationId));
    } catch {
      res
        .status(500)
        .json({ error: translate("server.errors.failedResponse") });
    }
  });
}
