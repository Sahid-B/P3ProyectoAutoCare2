import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Configuracion de Vite para AutoCare.
// La PWA registra un Service Worker que precarga los archivos estaticos de la
// aplicacion y define un fallback de navegacion para cuando no hay conexion.
// La sincronizacion completa y las notificaciones push se implementaran mas adelante.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Se usa el archivo public/manifest.webmanifest ya enlazado en index.html.
      manifest: false,
      injectRegister: 'auto',
      workbox: {
        // Precarga de recursos estaticos (cache basico).
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        cleanupOutdatedCaches: true,
        // Fallback offline: cualquier navegacion sin conexion sirve index.html
        // (la SPA se encarga del enrutado). Las llamadas al API quedan excluidas.
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
        // Cache en tiempo de ejecucion para las imagenes de vehiculos (URLs externas).
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'autocare-imagenes',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
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
