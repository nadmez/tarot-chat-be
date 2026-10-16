// @ts-check
import { createClient } from '@supabase/supabase-js';

/** @type {import('@supabase/supabase-js').SupabaseClient | undefined} */
let client;

/**
 * Lazy singleton so importing this module never needs SUPABASE_* to be set.
 * Throws on first use when the variables are missing.
 */
export function getSupabase() {
   if (!client) {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_KEY;
      if (!url || !key) {
         throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in environment');
      }
      client = createClient(url, key);
   }
   return client;
}
