// @ts-check
import { describe, expect, it, vi } from 'vitest';

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@lib/supabase', () => ({ getSupabase: () => ({ from }) }));

import {
   getConversation,
   getLastConversationId,
   getMessages,
   saveConversation,
   saveMessage,
   setLastConversationId,
} from './history.js';

/**
 * A chainable stand-in for the Supabase query builder: every builder method
 * returns the same object and the terminal calls resolve to `result`.
 * @param {{ data?: unknown, error?: unknown }} result
 */
function queryBuilder(result) {
   /** @type {Record<string, import('vitest').Mock>} */
   const q = {};
   for (const name of ['select', 'eq']) q[name] = vi.fn(() => q);
   for (const name of ['order', 'maybeSingle', 'upsert', 'insert']) {
      q[name] = vi.fn(() => Promise.resolve(result));
   }
   from.mockReturnValue(q);
   return q;
}

describe('in-memory conversation ids', () => {
   it('returns undefined for an unknown conversation', () => {
      expect(getLastConversationId('unknown-conversation')).toBeUndefined();
   });

   it('stores and returns the last response id per conversation', () => {
      setLastConversationId('c1', 'resp_1');
      setLastConversationId('c2', 'resp_2');
      setLastConversationId('c1', 'resp_3');
      expect(getLastConversationId('c1')).toBe('resp_3');
      expect(getLastConversationId('c2')).toBe('resp_2');
   });
});

describe('saveConversation', () => {
   it('upserts on conversation_id', async () => {
      const q = queryBuilder({ error: null });
      await saveConversation('c1', 'payload');
      expect(from).toHaveBeenCalledWith('conversations');
      expect(q.upsert).toHaveBeenCalledWith(
         { conversation_id: 'c1', last_response_id: 'payload' },
         { onConflict: 'conversation_id' }
      );
   });

   it('throws the Supabase error', async () => {
      queryBuilder({ error: new Error('db down') });
      await expect(saveConversation('c1', 'x')).rejects.toThrow('db down');
   });
});

describe('getConversation', () => {
   it('returns the stored last_response_id', async () => {
      const q = queryBuilder({
         data: { last_response_id: 'resp_9' },
         error: null,
      });
      expect(await getConversation('c1')).toBe('resp_9');
      expect(q.eq).toHaveBeenCalledWith('conversation_id', 'c1');
   });

   it('returns null when the conversation does not exist', async () => {
      queryBuilder({ data: null, error: null });
      expect(await getConversation('missing')).toBeNull();
   });

   it('throws the Supabase error', async () => {
      queryBuilder({ error: new Error('db down') });
      await expect(getConversation('c1')).rejects.toThrow('db down');
   });
});

describe('getMessages', () => {
   it('returns rows ordered by created_at ascending', async () => {
      const rows = [{ id: 'm1' }, { id: 'm2' }];
      const q = queryBuilder({ data: rows, error: null });
      expect(await getMessages('c1')).toEqual(rows);
      expect(q.order).toHaveBeenCalledWith('created_at', { ascending: true });
   });

   it('normalizes null data to an empty array', async () => {
      queryBuilder({ data: null, error: null });
      expect(await getMessages('c1')).toEqual([]);
   });

   it('throws the Supabase error', async () => {
      queryBuilder({ error: new Error('db down') });
      await expect(getMessages('c1')).rejects.toThrow('db down');
   });
});

describe('saveMessage', () => {
   it('parses a JSON payload into columns', async () => {
      const q = queryBuilder({ error: null });
      await saveMessage(
         'c1',
         'm1',
         JSON.stringify({ user_prompt: 'Q', ai_response: 'A', cards: '[]' }),
         'u1'
      );
      expect(q.insert).toHaveBeenCalledWith({
         id: 'm1',
         conversation_id: 'c1',
         user_prompt: 'Q',
         ai_response: 'A',
         cards: '[]',
      });
   });

   it('stores plain text as the AI response with an empty prompt', async () => {
      const q = queryBuilder({ error: null });
      await saveMessage('c1', 'm2', 'just text', 'u1');
      expect(q.insert).toHaveBeenCalledWith({
         id: 'm2',
         conversation_id: 'c1',
         user_prompt: '',
         ai_response: 'just text',
         cards: null,
      });
   });

   it('throws the Supabase error', async () => {
      queryBuilder({ error: new Error('db down') });
      await expect(saveMessage('c1', 'm3', '{}', 'u1')).rejects.toThrow(
         'db down'
      );
   });
});
