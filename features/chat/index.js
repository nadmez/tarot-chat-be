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

const CARD_COUNT = 3;

// The model writes one text per card but never the card names; the server
// adds the names, so the reply always matches the drawn cards.
/** @param {number} count */
function buildReadingFormat(count) {
  return {
    type: /** @type {const} */ ("json_schema"),
    name: "tarot_reading",
    strict: true,
    schema: {
      type: "object",
      properties: {
        opening: { type: "string" },
        card_readings: {
          type: "array",
          items: { type: "string" },
          minItems: count,
          maxItems: count,
        },
        closing: { type: "string" },
      },
      required: ["opening", "card_readings", "closing"],
      additionalProperties: false,
    },
  };
}

/** @param {number} count */
function buildReadingSchema(count) {
  return z.object({
    opening: z.string(),
    card_readings: z.array(z.string()).length(count),
    closing: z.string(),
  });
}

/** @param {TarotCard[]} cards */
function formatCardInfo(cards) {
  return cards
    .map((card, i) => `Card ${i + 1}: ${card.name}\nMeaning: ${card.meaning_up}`)
    .join("\n\n");
}

/**
 * @param {{ opening: string, card_readings: string[], closing: string }} reading
 * @param {TarotCard[]} cards
 */
function formatReading(reading, cards) {
  return [
    reading.opening,
    ...cards.map(
      (card, i) => `**${i + 1}. ${card.name}**\n${reading.card_readings[i]}`
    ),
    reading.closing,
  ].join("\n\n");
}

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
  // Draw the cards and list them as numbered slots for the prompt
  const cards = getRandomCards(CARD_COUNT);
  const cardInfo = formatCardInfo(cards);

  const instructions = template
    .replace("{{cardInfo}}", cardInfo)
    .replaceAll("{{cardCount}}", String(cards.length))
    .replace("{{today}}", new Date().toDateString());

  const response = await getOpenAI().responses.create({
    model: "gpt-4o-mini",
    input: prompt,
    instructions,
    temperature: model_temperature,
    previous_response_id: getLastConversationId(conversationId),
    text: { format: buildReadingFormat(cards.length) },
  });

  // Throws (-> 500) when the output is not a valid reading
  const reading = buildReadingSchema(cards.length).parse(
    JSON.parse(response.output_text)
  );

  setLastConversationId(conversationId, response.id);

  return {
    message: formatReading(reading, cards),
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
