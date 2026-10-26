// @ts-check
import OpenAI from 'openai';
import { createLoggingFetch } from './logging-fetch.js';

/** @type {OpenAI | undefined} */
let client;

/** Lazy singleton so importing this module never needs OPENAI_API_KEY. */
export function getOpenAI() {
   client ??= new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      fetch: createLoggingFetch(),
   });
   return client;
}
