// @ts-check
import express from 'express';
import { i18nMiddleware } from '@lib/i18n';
import registerHello from '@features/hello';
import registerCards from '@features/cards';
import registerChat from '@features/chat';

/** Builds the Express app without listening, so tests can import it. */
export function createApp() {
   const app = express();
   app.use(express.json());

   const api = express.Router();
   api.use(i18nMiddleware);
   registerHello(api);
   registerCards(api);
   registerChat(api);

   app.use('/api', api);
   return app;
}
