import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Standalone static site. `npm run build` writes ./dist, which any static host can serve.
// In production the page calls the resume service directly, so set VITE_API_BASE_URL at build time
// (see .env.example) and add this site's origin to CHAT_ALLOWED_ORIGINS on the service.
// `npm run dev` forwards /api to the service so no CORS setup is needed while developing.
const service = process.env.SERVICE_URL || 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: service, changeOrigin: true } }
  }
});
