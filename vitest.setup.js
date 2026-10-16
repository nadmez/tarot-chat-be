// @ts-check
import { afterEach, vi } from 'vitest';
import { initI18n } from '@lib/i18n';

// No test may reach a real service; these only satisfy "is it set" checks.
process.env.OPENAI_API_KEY ??= 'test-openai-key';
process.env.SUPABASE_URL ??= 'http://localhost:54321';
process.env.SUPABASE_KEY ??= 'test-supabase-key';

await initI18n();

// resetAllMocks (not clearAllMocks): also drops leftover mockResolvedValue /
// mockRejectedValue implementations so tests cannot leak into each other.
afterEach(() => {
   vi.resetAllMocks();
});
