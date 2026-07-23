import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Configuracion de Vite para AutoCare.
// La PWA se mantiene en su configuracion base: registra un Service Worker
// que precarga los archivos de la aplicacion. La logica offline completa
// (IndexedDB, sincronizacion y notificaciones push) se implementara mas adelante.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Se usa el archivo public/manifest.webmanifest ya enlazado en index.html.
      manifest: false,
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 5173,
  },
});
