// @ts-check
import { afterEach, describe, expect, it, vi } from 'vitest';

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient }));

afterEach(() => {
   vi.unstubAllEnvs();
   vi.resetModules();
});

describe('getSupabase', () => {
   it('can be imported without SUPABASE_* set and only throws when used', async () => {
      vi.stubEnv('SUPABASE_URL', '');
      vi.stubEnv('SUPABASE_KEY', '');

      const { getSupabase } = await import('./supabase.js');

      expect(() => getSupabase()).toThrow(
         'Missing SUPABASE_URL or SUPABASE_KEY in environment'
      );
      expect(createClient).not.toHaveBeenCalled();
   });

   it('creates the client once from the environment and reuses it', async () => {
      vi.stubEnv('SUPABASE_URL', 'http://localhost:1');
      vi.stubEnv('SUPABASE_KEY', 'service-key');
      createClient.mockReturnValue({ marker: 'client' });

      const { getSupabase } = await import('./supabase.js');
      const first = getSupabase();
      const second = getSupabase();

      expect(first).toBe(second);
      expect(createClient).toHaveBeenCalledTimes(1);
      expect(createClient).toHaveBeenCalledWith(
         'http://localhost:1',
         'service-key'
      );
   });
});
