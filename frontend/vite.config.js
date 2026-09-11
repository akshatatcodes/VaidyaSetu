import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    port: 5173,
    // host: true binds to 0.0.0.0 (all network interfaces) instead of only
    // loopback, so phones on the same WiFi can reach the dev server. Vite then
    // prints a "Network: http://192.168.x.x:5173/" line on startup — that is
    // the URL to open on the phone.
    host: true,
    strictPort: true
  },
  preview: {
    port: 4173,
    host: true
  }
});
