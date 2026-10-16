// @ts-check
import { afterEach, describe, expect, it, vi } from 'vitest';

const { OpenAI } = vi.hoisted(() => ({ OpenAI: vi.fn() }));
vi.mock('openai', () => ({ default: OpenAI }));

afterEach(() => {
   vi.unstubAllEnvs();
   vi.resetModules();
});

describe('getOpenAI', () => {
   it('does not construct a client just by importing the module', async () => {
      await import('./openai.js');
      expect(OpenAI).not.toHaveBeenCalled();
   });

   it('creates one client with OPENAI_API_KEY and reuses it', async () => {
      vi.stubEnv('OPENAI_API_KEY', 'sk-test');

      const { getOpenAI } = await import('./openai.js');
      const first = getOpenAI();
      const second = getOpenAI();

      expect(first).toBe(second);
      expect(OpenAI).toHaveBeenCalledTimes(1);
      expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'sk-test' });
   });
});
