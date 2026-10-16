// @ts-check
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';

const app = createApp();

describe('GET /api/hello', () => {
   it('answers in Turkish by default', async () => {
      const res = await request(app).get('/api/hello');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Sunucudan Yeniden Merhaba' });
   });

   it('answers in English for Accept-Language: en', async () => {
      const res = await request(app)
         .get('/api/hello')
         .set('Accept-Language', 'en-US,en;q=0.9');
      expect(res.body).toEqual({ message: 'Hello from the server!' });
   });

   it('answers in English for the lang=en cookie', async () => {
      const res = await request(app).get('/api/hello').set('Cookie', 'lang=en');
      expect(res.body).toEqual({ message: 'Hello from the server!' });
   });
});

describe('unknown routes', () => {
   it('returns 404 under /api', async () => {
      const res = await request(app).get('/api/nope');
      expect(res.status).toBe(404);
   });
});
