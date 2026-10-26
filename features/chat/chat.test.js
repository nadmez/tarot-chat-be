// @ts-check
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('@lib/openai', () => ({
   getOpenAI: () => ({ responses: { create } }),
}));

import { createApp } from '../../app.js';

const app = createApp();

/** @param {string} [id] */
const openaiReply = (id = 'resp_1') => ({
   id,
   output_text: 'The cards say hello',
});

/**
 * @param {string | object} body
 * @param {string} [lang]
 */
const postChat = (body, lang = 'en') =>
   request(app).post('/api/chat').set('Accept-Language', lang).send(body);

afterEach(() => {
   vi.useRealTimers();
});

describe('POST /api/chat', () => {
   it('returns the reply, response id and 3 cards', async () => {
      create.mockResolvedValue(openaiReply());

      const res = await postChat({
         prompt: '  Will I travel?  ',
         conversationId: randomUUID(),
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('The cards say hello');
      expect(res.body.id).toBe('resp_1');
      expect(res.body.cards).toHaveLength(3);
      expect(create).toHaveBeenCalledWith(
         expect.objectContaining({
            model: 'gpt-4o-mini',
            input: 'Will I travel?',
            temperature: 0.5,
            previous_response_id: undefined,
         })
      );
   });

   it("puts the drawn cards and today's date in the instructions", async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      const today = new Date(2026, 9, 3, 12, 0, 0);
      vi.setSystemTime(today);
      create.mockResolvedValue(openaiReply());

      const res = await postChat({
         prompt: 'Hello',
         conversationId: randomUUID(),
      });

      const { instructions } = create.mock.calls[0][0];
      expect(instructions).toContain(today.toDateString());
      expect(instructions).not.toContain('{{');
      for (const card of res.body.cards) {
         expect(instructions).toContain(card.name);
      }
   });

   it('chains follow-ups of the same conversation via previous_response_id', async () => {
      const conversationId = randomUUID();
      create
         .mockResolvedValueOnce(openaiReply('resp_a'))
         .mockResolvedValueOnce(openaiReply('resp_b'));

      await postChat({ prompt: 'First', conversationId });
      await postChat({ prompt: 'Second', conversationId });

      expect(create.mock.calls[0][0].previous_response_id).toBeUndefined();
      expect(create.mock.calls[1][0].previous_response_id).toBe('resp_a');
   });

   it('keeps conversations separate', async () => {
      create.mockResolvedValue(openaiReply('resp_x'));

      await postChat({ prompt: 'One', conversationId: randomUUID() });
      await postChat({ prompt: 'Two', conversationId: randomUUID() });

      expect(create.mock.calls[1][0].previous_response_id).toBeUndefined();
   });

   it('answers 500 in the request language when OpenAI fails', async () => {
      create.mockRejectedValue(new Error('boom'));

      const en = await postChat({ prompt: 'Hi', conversationId: randomUUID() });
      expect(en.status).toBe(500);
      expect(en.body).toEqual({ error: 'Failed to generate a response' });

      const tr = await postChat(
         { prompt: 'Hi', conversationId: randomUUID() },
         'tr'
      );
      expect(tr.status).toBe(500);
      expect(tr.body).toEqual({ error: 'Yanıt oluşturulamadı' });
   });

   it('does not poison the conversation chain after a failed call', async () => {
      const conversationId = randomUUID();
      create
         .mockResolvedValueOnce(openaiReply('resp_ok'))
         .mockRejectedValueOnce(new Error('boom'))
         .mockResolvedValueOnce(openaiReply('resp_after'));

      await postChat({ prompt: 'One', conversationId });
      const failed = await postChat({ prompt: 'Two', conversationId });
      expect(failed.status).toBe(500);
      await postChat({ prompt: 'Three', conversationId });

      // the failed call still chained from resp_ok, and the next one too
      expect(create.mock.calls[2][0].previous_response_id).toBe('resp_ok');
   });
});

describe('POST /api/chat validation', () => {
   const valid = () => ({ prompt: 'Hi', conversationId: randomUUID() });

   it.each([
      ['an empty prompt', { prompt: '' }],
      ['a whitespace-only prompt', { prompt: '   ' }],
   ])('rejects %s with the English message', async (_label, override) => {
      const res = await postChat({ ...valid(), ...override });
      expect(res.status).toBe(400);
      expect(res.body.properties.prompt.errors).toContain(
         'Prompt cannot be empty'
      );
      expect(create).not.toHaveBeenCalled();
   });

   it('rejects a prompt longer than 1000 characters (Turkish message)', async () => {
      const res = await postChat(
         { ...valid(), prompt: 'a'.repeat(1001) },
         'tr'
      );
      expect(res.status).toBe(400);
      expect(res.body.properties.prompt.errors).toContain(
         'İstem çok uzun (maksimum 1000 karakter)'
      );
   });

   it('accepts a prompt of exactly 1000 characters', async () => {
      create.mockResolvedValue(openaiReply());
      const res = await postChat({ ...valid(), prompt: 'a'.repeat(1000) });
      expect(res.status).toBe(200);
   });

   it('translates messages into real text, never raw keys', async () => {
      const res = await postChat({ ...valid(), prompt: '' });
      const messages = JSON.stringify(res.body);
      expect(messages).not.toContain('server.errors');
   });

   it.each([
      ['a missing prompt', { conversationId: randomUUID() }],
      ['a missing conversationId', { prompt: 'Hi' }],
      ['a non-UUID conversationId', { prompt: 'Hi', conversationId: 'nope' }],
      ['a numeric prompt', { prompt: 42, conversationId: randomUUID() }],
   ])('rejects %s', async (_label, body) => {
      const res = await postChat(body);
      expect(res.status).toBe(400);
      expect(create).not.toHaveBeenCalled();
   });

   it('rejects a request without a body', async () => {
      const res = await request(app).post('/api/chat');
      expect(res.status).toBe(400);
   });

   it('rejects malformed JSON with 400 and keeps serving', async () => {
      const res = await request(app)
         .post('/api/chat')
         .set('Content-Type', 'application/json')
         .send('{bad');
      expect(res.status).toBe(400);

      const next = await request(app).get('/api/hello');
      expect(next.status).toBe(200);
   });
});

describe('language handling under concurrency', () => {
   it('keeps each request in its own language while another request is in flight', async () => {
      /** @type {(reason: Error) => void} */
      let failSlowRequest = () => {};
      create.mockImplementationOnce(
         () =>
            new Promise((_resolve, reject) => {
               failSlowRequest = reject;
            })
      );

      // English request waits on OpenAI...
      const slow = postChat(
         { prompt: 'Hi', conversationId: randomUUID() },
         'en'
      ).then((res) => res);
      await vi.waitFor(() => expect(create).toHaveBeenCalledTimes(1));

      // ...while a Turkish request is handled completely
      const other = await request(app)
         .get('/api/hello')
         .set('Accept-Language', 'tr');
      expect(other.body.message).toBe('Sunucudan Yeniden Merhaba');

      failSlowRequest(new Error('boom'));
      const res = await slow;
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to generate a response' });
   });
});
