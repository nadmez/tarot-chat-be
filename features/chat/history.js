// @ts-check
import { getSupabase } from '@lib/supabase';

/**
 * @typedef {object} MessageRow
 * @property {string} id
 * @property {string} conversation_id
 * @property {string} user_prompt
 * @property {string} ai_response
 * @property {string | null} cards
 * @property {string} created_at
 */

// In-memory map of conversationId -> last OpenAI response id. This is what
// chat uses today; the Supabase functions below are the planned replacement.
/** @type {Map<string, string>} */
const conversations = new Map();

/** @param {string} conversationId */
export function getLastConversationId(conversationId) {
   return conversations.get(conversationId);
}

/**
 * @param {string} conversationId
 * @param {string} lastResponseId
 */
export function setLastConversationId(conversationId, lastResponseId) {
   conversations.set(conversationId, lastResponseId);
}

/**
 * Persist the latest conversation data in the `conversations` table (see
 * tables.txt). `last_response_id` stores the opaque payload passed by callers;
 * an existing row for `conversationId` is upserted.
 *
 * @param {string} conversationId
 * @param {string} conversationData
 * @returns {Promise<void>}
 */
export async function saveConversation(conversationId, conversationData) {
   const { error } = await getSupabase().from('conversations').upsert(
      {
         conversation_id: conversationId,
         last_response_id: conversationData,
      },
      { onConflict: 'conversation_id' }
   );

   if (error) {
      // bubble up so callers can handle/log as needed
      throw error;
   }
}

/**
 * Retrieve the stored `last_response_id` for a conversation, or `null` when
 * the conversation cannot be found.
 *
 * @param {string} conversationId
 * @returns {Promise<string | null>}
 */
export async function getConversation(conversationId) {
   const { data, error } = await getSupabase()
      .from('conversations')
      .select('last_response_id')
      .eq('conversation_id', conversationId)
      .maybeSingle();

   if (error) {
      throw error;
   }

   return data?.last_response_id ?? null;
}

/**
 * All message rows for a conversation, ordered by creation time.
 *
 * @param {string} conversationId
 * @returns {Promise<MessageRow[]>}
 */
export async function getMessages(conversationId) {
   const { data, error } = await getSupabase()
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

   if (error) {
      throw error;
   }

   // supabase returns null when there are no rows, normalize to empty
   return data || [];
}

/**
 * Save a single exchange in the `messages` table. `messageData` is expected
 * to be a JSON string with `user_prompt`, `ai_response` and optionally
 * `cards`; if it is not valid JSON the whole string is stored as the AI
 * response. `messageId` is used as the primary key. `userId` is currently
 * unused and kept for future multi-user conversations.
 *
 * @param {string} conversationId
 * @param {string} messageId
 * @param {string} messageData
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function saveMessage(
   conversationId,
   messageId,
   messageData,
   userId
) {
   /** @type {{ user_prompt: string, ai_response: string, cards?: string }} */
   let payload;

   try {
      payload = JSON.parse(messageData);
   } catch {
      // not JSON: treat the whole string as the AI response and stash an
      // empty user_prompt placeholder
      payload = { user_prompt: '', ai_response: messageData };
   }

   const { error } = await getSupabase()
      .from('messages')
      .insert({
         id: messageId,
         conversation_id: conversationId,
         user_prompt: payload.user_prompt,
         ai_response: payload.ai_response,
         cards: payload.cards ?? null,
      });

   if (error) {
      throw error;
   }
}
