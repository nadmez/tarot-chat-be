// @ts-check
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
   aliases,
   resolveAliasPath,
   toJsconfigPaths,
   toViteAliases,
} from './aliases.js';

const root = import.meta.dirname;

describe('alias table', () => {
   it('maps @features/<name> to features/<name>/index.js', () => {
      expect(resolveAliasPath('@features/chat')).toBe('features/chat/index.js');
   });

   it('maps @lib/<name> to lib/<name>.js', () => {
      expect(resolveAliasPath('@lib/openai')).toBe('lib/openai.js');
   });

   it('ignores specifiers that are not aliases', () => {
      expect(resolveAliasPath('express')).toBeNull();
      expect(resolveAliasPath('@supabase/supabase-js')).toBeNull();
      expect(resolveAliasPath('./app.js')).toBeNull();
   });

   it('produces one Vite alias per entry that matches only single-segment names', () => {
      const vite = toViteAliases(root);
      expect(vite).toHaveLength(aliases.length);
      const features = /** @type {NonNullable<(typeof vite)[number]>} */ (
         vite[0]
      );
      expect(
         '@features/chat'.replace(features.find, features.replacement)
      ).toBe(`${root.replaceAll('\\', '/')}/features/chat/index.js`);
      expect(features.find.test('@features/chat/extra')).toBe(false);
   });
});

describe('jsconfig.json', () => {
   it('has paths identical to the alias table', () => {
      const jsconfig = JSON.parse(
         readFileSync(join(root, 'jsconfig.json'), 'utf-8')
      );
      expect(jsconfig.compilerOptions.paths).toEqual(toJsconfigPaths());
   });
});

describe('node resolve hook', () => {
   /** @param {string} code */
   const runWithHook = (code) =>
      execFileSync(
         process.execPath,
         ['--import', './register-aliases.js', '-e', code],
         { cwd: root, encoding: 'utf-8' }
      ).trim();

   it('resolves @features/* and @lib/* under plain node', () => {
      const out = runWithHook(
         "Promise.all([import('@features/hello'), import('@lib/i18n')]).then(([h, i]) => console.log(typeof h.default, typeof i.initI18n))"
      );
      expect(out).toBe('function function');
   });

   it('works regardless of the current working directory', () => {
      const out = execFileSync(
         process.execPath,
         [
            '--import',
            // absolute --import paths must be file:// URLs on Windows
            pathToFileURL(join(root, 'register-aliases.js')).href,
            '-e',
            "import('@features/hello').then((h) => console.log(typeof h.default))",
         ],
         { cwd: join(root, '..'), encoding: 'utf-8' }
      ).trim();
      expect(out).toBe('function');
   });
});
