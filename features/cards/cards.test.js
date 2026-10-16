// @ts-check
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { getRandomCards } from '@features/cards';
import { createApp } from '../../app.js';

const app = createApp();
const DECK_SIZE = 78;

/** @param {{ name_short: string }[]} cards */
const uniqueCount = (cards) => new Set(cards.map((c) => c.name_short)).size;

describe('getRandomCards', () => {
   it('returns the requested number of distinct cards', () => {
      const cards = getRandomCards(3);
      expect(cards).toHaveLength(3);
      expect(uniqueCount(cards)).toBe(3);
   });

   it('returns the whole deck when asked for more cards than exist', () => {
      const cards = getRandomCards(1000);
      expect(cards).toHaveLength(DECK_SIZE);
      expect(uniqueCount(cards)).toBe(DECK_SIZE);
   });

   it('returns well-formed cards', () => {
      const [card] = getRandomCards(1);
      expect(card).toEqual(
         expect.objectContaining({
            name_short: expect.any(String),
            name: expect.any(String),
            image_url: expect.any(String),
            meaning_up: expect.any(String),
            meaning_rev: expect.any(String),
         })
      );
   });
});

describe('GET /api/cards/random', () => {
   it('returns n distinct cards', async () => {
      const res = await request(app).get('/api/cards/random?n=3');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      expect(uniqueCount(res.body)).toBe(3);
   });

   it('returns the full deck for n=78', async () => {
      const res = await request(app).get('/api/cards/random?n=78');
      expect(res.status).toBe(200);
      expect(uniqueCount(res.body)).toBe(DECK_SIZE);
   });

   it.each(['0', '-1', '79', 'abc', ''])(
      'returns an empty array for n=%j',
      async (n) => {
         const res = await request(app).get(`/api/cards/random?n=${n}`);
         expect(res.status).toBe(200);
         expect(res.body).toEqual([]);
      }
   );

   it('returns an empty array when n is missing', async () => {
      const res = await request(app).get('/api/cards/random');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
   });

   it.each([
      ['2.9', 2],
      ['3abc', 3],
   ])('parses n=%s as the integer prefix (%i cards)', async (n, expected) => {
      const res = await request(app).get(`/api/cards/random?n=${n}`);
      expect(res.body).toHaveLength(expected);
   });
});
