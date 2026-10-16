// @ts-check
import { resolveAliasPath } from './aliases.js';

const root = new URL('./', import.meta.url);

/** @type {import('node:module').ResolveHook} */
export async function resolve(specifier, context, nextResolve) {
   const aliasPath = resolveAliasPath(specifier);
   if (aliasPath) {
      return nextResolve(new URL(aliasPath, root).href, context);
   }
   return nextResolve(specifier, context);
}
