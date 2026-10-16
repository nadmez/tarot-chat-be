// @ts-check

/**
 * @typedef {object} Alias
 * @property {string} prefix  import prefix, e.g. '@features/'
 * @property {string} dir     directory under the server root
 * @property {string} suffix  appended after the name, e.g. '/index.js'
 */

/**
 * Single source of truth for `@` import aliases. Consumed by:
 * - alias-hooks.js (Node runtime)
 * - vitest.config.js (tests)
 * - jsconfig.json `paths` (editor / tsc), kept in sync by aliases.test.js
 *
 * @type {Alias[]}
 */
export const aliases = [
   { prefix: '@features/', dir: 'features', suffix: '/index.js' },
   { prefix: '@lib/', dir: 'lib', suffix: '.js' },
];

/**
 * @param {string} specifier
 * @returns {string | null} path relative to the server root, or null when
 *   the specifier is not an alias
 */
export function resolveAliasPath(specifier) {
   const alias = aliases.find((a) => specifier.startsWith(a.prefix));
   if (!alias) return null;
   const name = specifier.slice(alias.prefix.length);
   return `${alias.dir}/${name}${alias.suffix}`;
}

/** @returns {Record<string, string[]>} the `paths` object for jsconfig.json */
export function toJsconfigPaths() {
   return Object.fromEntries(
      aliases.map((a) => [`${a.prefix}*`, [`./${a.dir}/*${a.suffix}`]])
   );
}

/**
 * @param {string} rootDir absolute path of the server root
 * @returns {{ find: RegExp, replacement: string }[]}
 */
export function toViteAliases(rootDir) {
   const root = rootDir.replaceAll('\\', '/');
   return aliases.map((a) => ({
      find: new RegExp(`^${a.prefix}([^/]+)$`),
      replacement: `${root}/${a.dir}/$1${a.suffix}`,
   }));
}
