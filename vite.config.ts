import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VK Mini App должен открываться по HTTPS.
// Для локальной разработки удобно использовать `npm run dev -- --host`
// и туннель (ngrok / cloudpub), либо VK Tunnel.
//
// Приложение опубликовано по адресу https://quidditch.aurorhq.ru/worldmenu,
// поэтому все ссылки на ассеты в сборке должны начинаться с /worldmenu/.
export default defineConfig({
  base: '/worldmenu/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
