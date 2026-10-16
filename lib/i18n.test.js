// @ts-check
import { describe, expect, it } from 'vitest';
import {
   DEFAULT_LANGUAGE,
   SUPPORTED_LANGUAGES,
   getLanguageFromHeaders,
} from '@lib/i18n';

describe('getLanguageFromHeaders', () => {
   it('defaults to Turkish with no headers', () => {
      expect(getLanguageFromHeaders()).toBe('tr');
      expect(getLanguageFromHeaders({})).toBe(DEFAULT_LANGUAGE);
      expect(DEFAULT_LANGUAGE).toBe('tr');
   });

   it('supports exactly tr and en', () => {
      expect(SUPPORTED_LANGUAGES).toEqual(['tr', 'en']);
   });

   it.each([
      ['en-US,en;q=0.9', 'en'],
      ['tr-TR,tr;q=0.9', 'tr'],
      ['en', 'en'],
   ])('reads Accept-Language %j as %s', (header, expected) => {
      expect(getLanguageFromHeaders({ 'accept-language': header })).toBe(
         expected
      );
   });

   it('uses only the first Accept-Language entry', () => {
      expect(
         getLanguageFromHeaders({ 'accept-language': 'fr-FR,en;q=0.8' })
      ).toBe('tr');
   });

   it.each([
      ['lang=en', 'en'],
      ['theme=dark; lang=en', 'en'],
      ['lang=tr; theme=dark', 'tr'],
   ])('reads the lang cookie from %j as %s', (cookie, expected) => {
      expect(getLanguageFromHeaders({ cookie })).toBe(expected);
   });

   it('lets the cookie win over Accept-Language', () => {
      expect(
         getLanguageFromHeaders({
            cookie: 'lang=en',
            'accept-language': 'tr-TR',
         })
      ).toBe('en');
   });

   it.each(['lang=fr', 'lang=', 'lang=EN'])(
      'falls back to Turkish for unsupported cookie %j, even if Accept-Language is English',
      (cookie) => {
         expect(
            getLanguageFromHeaders({ cookie, 'accept-language': 'en' })
         ).toBe('tr');
      }
   );
});
