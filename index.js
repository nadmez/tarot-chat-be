// @ts-check
import { createApp } from './app.js';
import { initI18n } from '@lib/i18n';
import { getPort } from '@lib/port';

const port = getPort(process.env);

await initI18n();

createApp().listen(port, () => {
   console.log(`Sunucu dinleme durumunda: http://localhost:${port}`);
});
