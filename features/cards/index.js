// @ts-check
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * @typedef {object} TarotCard
 * @property {'major' | 'minor'} type
 * @property {string} name_short
 * @property {string} name
 * @property {string} value
 * @property {number} value_int
 * @property {string} meaning_up
 * @property {string} meaning_rev
 * @property {string} desc
 * @property {string} image_url
 * @property {'wands' | 'cups' | 'pentacles' | 'swords'} [suit]
 */

/** @type {TarotCard[]} */
const allCards = JSON.parse(
   readFileSync(join(import.meta.dirname, 'tarot-cards.json'), 'utf-8')
);

/**
 * @param {number} n
 * @returns {TarotCard[]} up to n cards (at most the whole deck), shuffled
 */
export function getRandomCards(n) {
   const count = Math.min(n, allCards.length);
   const shuffled = [...allCards].sort(() => 0.5 - Math.random());
   return shuffled.slice(0, count);
}

/** @param {import('express').Router} router */
export default function register(router) {
   router.get('/cards/random', (req, res) => {
      try {
         const n = parseInt(String(req.query.n), 10);

         // Not a number, <= 0, or more than the 78-card deck: empty array
         if (Number.isNaN(n) || n <= 0 || n > 78) {
            return res.json([]);
         }

         res.json(getRandomCards(n));
      } catch (error) {
         console.error('Random cards error:', error);
         res.status(500).json({
            error: res.locals.t('server.errors.failedResponse'),
         });
      }
   });
}
