// @ts-check

/** @param {unknown} text */
function parseBody(text) {
   if (typeof text !== 'string') return text;
   try {
      return JSON.parse(text);
   } catch {
      return text;
   }
}

/** @param {object} entry */
function defaultLog(entry) {
   console.log('[dış istek]', JSON.stringify(entry, null, 2));
}

/**
 * Wraps fetch so every outgoing request is logged with its method, url, body,
 * status, duration and response body. Headers are not logged (API keys).
 *
 * @param {typeof fetch} [baseFetch]
 * @param {(entry: object) => void} [log]
 * @returns {typeof fetch}
 */
export function createLoggingFetch(baseFetch = fetch, log = defaultLog) {
   return async (input, init) => {
      const url = String(input instanceof Request ? input.url : input);
      const method = init?.method ?? 'GET';
      const requestBody = parseBody(init?.body);
      const start = Date.now();

      try {
         const response = await baseFetch(input, init);
         const responseBody = parseBody(await response.clone().text());
         log({
            method,
            url,
            requestBody,
            status: response.status,
            durationMs: Date.now() - start,
            responseBody,
         });
         return response;
      } catch (error) {
         log({
            method,
            url,
            requestBody,
            durationMs: Date.now() - start,
            error: error instanceof Error ? error.message : String(error),
         });
         throw error;
      }
   };
}
