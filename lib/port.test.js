// @ts-check
import { describe, it, expect } from 'vitest';
import { getPort, DEFAULT_PORT } from '@lib/port';

describe('getPort', () => {
   it('defaults to 3001 when PORT is not set', () => {
      expect(DEFAULT_PORT).toBe(3001);
      expect(getPort({})).toBe(3001);
   });

   it('uses PORT from the environment when set', () => {
      expect(getPort({ PORT: '8080' })).toBe(8080);
   });

   it('falls back to 3001 when PORT is empty', () => {
      expect(getPort({ PORT: '' })).toBe(3001);
   });
});
