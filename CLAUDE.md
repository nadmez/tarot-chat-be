# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                  # install dependencies (Node >=20.11)
npm run dev                  # dev server with --watch and .env loading (port 3001 by default)
npm start                    # production start; does not read .env
npm test                     # vitest run (all tests, one pass)
npx vitest run features/chat/history.test.js   # single test file
npx vitest run -t "saveMessage"                # tests matching a name
npm run test:watch           # vitest in watch mode
npm run test:coverage        # coverage report (text + html)
npm run typecheck            # tsc --noEmit over JSDoc-annotated JS (strict)
```

`npm run dev` loads `.env` via `--env-file=.env`, so the file must exist (copy `.env.example`). `npm start` reads no `.env`; the host provides the variables. Tests need no `.env`: `vitest.setup.js` fills in dummy `OPENAI_API_KEY`, `SUPABASE_URL` and `SUPABASE_KEY`.

## Architecture

**Pure JavaScript (ESM) with JSDoc types.** There is no build step; `// @ts-check` plus `npm run typecheck` is the type check.

**Entry and app wiring.** `index.js` calls `initI18n()` and listens on `getPort()`. `app.js` exports `createApp()`, which builds the Express app without listening so tests can import it. All routes mount under `/api` on a single router that runs `i18nMiddleware` first. Each feature's `register(router)` adds its routes; a new feature must be registered in `app.js`.

**Path aliases must be registered in two places.** `@features/<name>` and `@lib/<name>` resolve through `aliases.js`, the single source of truth. It is consumed by three things:
- `alias-hooks.js` (Node ESM resolve hook, loaded by `register-aliases.js` via `node --import`). Every Node invocation of server code must include `--import ./register-aliases.js`; the `dev` and `start` scripts already do.
- `vitest.config.js` (Vite aliases).
- `jsconfig.json` `paths`, which must match `aliases.js`. `aliases.test.js` fails if they drift.

When adding an alias, update `aliases.js` and `jsconfig.json` together.

**Feature modules** (`features/<name>/index.js`) hold the route, input validation (zod), and logic together. Tests sit next to them (`*.test.js`). The chat feature is the largest and shows the pattern:
- `features/chat/index.js`: `POST /api/chat` validates the body with a zod schema built per request (so error messages use the request language), draws 3 cards from `features/cards`, fills the `tarot.txt` template, and calls OpenAI Responses API (`gpt-4o-mini`, `previous_response_id` for continuity).
- Conversation continuity: `history.js` keeps a `conversationId -> last response id` in-memory `Map`. This is what chat uses today.
- `history.js` also exports Supabase functions (`saveConversation`, `getConversation`, `getMessages`, `saveMessage`) for the `conversations` and `messages` tables (schema in `features/chat/tables.txt`). **Nothing in chat calls them yet**; they are the planned persistent replacement for the Map.

**Shared clients** (`lib/`) are lazy singletons so importing a module never requires env vars: `lib/openai.js` (`getOpenAI()`), `lib/supabase.js` (`getSupabase()`, throws if `SUPABASE_URL`/`SUPABASE_KEY` are missing). Tests mock these modules with `vi.mock('@lib/openai', ...)` etc. rather than contacting real services.

**i18n.** `lib/i18n.js` picks the language per request: the `lang` cookie first (an unsupported cookie falls back to the default, not to `Accept-Language`), then the first `Accept-Language` entry, then the default `tr`. `i18nMiddleware` sets `res.locals.t` as a request-bound translator. Route code should use `res.locals.t('server.<key>')` and never a hard-coded string. Translation keys live in `locales/tr.json` and `locales/en.json` (namespace `server`); add a key to both.

**Tarot data.** `features/cards/tarot-cards.json` is the deck (78 cards); `getRandomCards(n)` shuffles and slices it. `GET /api/cards/random?n=` returns `[]` for invalid or out-of-range `n`.

## Conventions and gotchas

- `prompts/` and `features/chat/tarot.txt` contain the LLM prompt text; `{{cardInfo}}` and `{{today}}` are placeholders filled in `sendMessage`.
- Tests reset all mocks after each test (`vitest.setup.js` uses `vi.resetAllMocks()`), so mock implementations do not carry over between tests.
- `Todo.md` and the README are in Turkish. Keep existing comments and user-facing messages consistent with the language they already use.
