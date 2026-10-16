// @ts-check
// Loaded with `node --import ./register-aliases.js` so Node understands the
// `@features/*` and `@lib/*` import aliases (see aliases.js).
import { register } from 'node:module';

register('./alias-hooks.js', import.meta.url);
