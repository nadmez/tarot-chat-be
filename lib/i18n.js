// @ts-check
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { join } from 'node:path';

export const SUPPORTED_LANGUAGES = ['tr', 'en'];
export const DEFAULT_LANGUAGE = 'tr';

/**
 * Language precedence: `lang` cookie, then the first Accept-Language entry,
 * then the default. A present-but-unsupported cookie yields the default
 * (it does not fall through to Accept-Language).
 *
 * @param {import('node:http').IncomingHttpHeaders} [headers]
 * @returns {string}
 */
export function getLanguageFromHeaders(headers = {}) {
   const langCookie = headers.cookie
      ?.split('; ')
      .find((c) => c.startsWith('lang='));
   if (langCookie) {
      const lang = langCookie.split('=')[1] ?? '';
      return SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
   }

   const lang = headers['accept-language']?.split(',')[0]?.split('-')[0];
   if (lang && SUPPORTED_LANGUAGES.includes(lang)) {
      return lang;
   }

   return DEFAULT_LANGUAGE;
}

export async function initI18n() {
   await i18next.use(Backend).init({
      lng: DEFAULT_LANGUAGE,
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: SUPPORTED_LANGUAGES,
      preload: SUPPORTED_LANGUAGES,
      defaultNS: 'server',
      ns: ['server'],
      backend: {
         loadPath: join(import.meta.dirname, '../locales/{{lng}}.json'),
      },
      interpolation: { escapeValue: false },
   });

   return i18next;
}

/**
 * Express middleware: attaches a translator bound to this request's language
 * as `res.locals.t`. Unlike `i18next.changeLanguage()` this is safe under
 * concurrent requests.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function i18nMiddleware(req, res, next) {
   res.locals.t = i18next.getFixedT(getLanguageFromHeaders(req.headers));
   next();
}
