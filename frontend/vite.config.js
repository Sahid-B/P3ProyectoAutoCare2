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
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
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
          // Catalogo de repuestos: NetworkFirst, para poder consultarlo sin
          // conexion. Solo se cachean lecturas del catalogo; los pedidos y los
          // pagos (/api/compras) nunca se cachean, para que una compra no pueda
          // confirmarse con datos obsoletos ni sin conexion.
          {
            urlPattern: ({ url, request }) =>
              request.method === 'GET' && url.pathname.startsWith('/api/productos/catalogo'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'autocare-catalogo-repuestos',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
  preview: {
    host: true,
    port: 5173,
  },
});
