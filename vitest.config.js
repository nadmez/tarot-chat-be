// @ts-check
import { defineConfig } from 'vitest/config';
import { toViteAliases } from './aliases.js';

export default defineConfig({
   resolve: {
      alias: toViteAliases(import.meta.dirname),
   },
   test: {
      environment: 'node',
      setupFiles: ['./vitest.setup.js'],
      include: ['**/*.test.js'],
      coverage: {
         provider: 'v8',
         reporter: ['text', 'html'],
         include: ['app.js', 'lib/**/*.js', 'features/**/*.js'],
         exclude: ['**/*.test.js'],
      },
   },
});
