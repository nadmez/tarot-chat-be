// @ts-check
import { describe, expect, it, vi } from 'vitest';
import { createLoggingFetch } from './logging-fetch.js';

describe('createLoggingFetch', () => {
   it('logs the request and the response, and returns the response untouched', async () => {
      const baseFetch = vi.fn().mockResolvedValue(
         new Response('{"id":"resp_1"}', { status: 200 })
      );
      const log = vi.fn();
      const loggingFetch = createLoggingFetch(baseFetch, log);

      const res = await loggingFetch('https://api.example.com/v1/responses', {
         method: 'POST',
         body: '{"model":"gpt-4o-mini"}',
         headers: { Authorization: 'Bearer secret' },
      });

      expect(await res.json()).toEqual({ id: 'resp_1' });
      expect(baseFetch).toHaveBeenCalledWith(
         'https://api.example.com/v1/responses',
         expect.objectContaining({ method: 'POST' })
      );
      expect(log).toHaveBeenCalledTimes(1);
      const entry = log.mock.calls[0][0];
      expect(entry).toMatchObject({
         method: 'POST',
         url: 'https://api.example.com/v1/responses',
         requestBody: { model: 'gpt-4o-mini' },
         status: 200,
         responseBody: { id: 'resp_1' },
      });
      expect(entry.durationMs).toEqual(expect.any(Number));
      expect(JSON.stringify(entry)).not.toContain('secret');
   });

   it('defaults to GET and keeps non-JSON bodies as text', async () => {
      const baseFetch = vi
         .fn()
         .mockResolvedValue(new Response('plain text', { status: 404 }));
      const log = vi.fn();

      await createLoggingFetch(baseFetch, log)('https://example.com/x');

      expect(log.mock.calls[0][0]).toMatchObject({
         method: 'GET',
         url: 'https://example.com/x',
         status: 404,
         responseBody: 'plain text',
      });
   });

   it('logs the error and rethrows when the request fails', async () => {
      const baseFetch = vi.fn().mockRejectedValue(new Error('network down'));
      const log = vi.fn();

      await expect(
         createLoggingFetch(baseFetch, log)('https://example.com/x')
      ).rejects.toThrow('network down');
      expect(log.mock.calls[0][0]).toMatchObject({
         url: 'https://example.com/x',
         error: 'network down',
      });
   });
});
