import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";

const CACHE_NAME = "app-cache-v1";

export default defineConfig({
  plugins: [
    tailwindcss(),
    svelte(),
    VitePWA({
      manifest: false,
      injectRegister: false,
      registerType: "autoUpdate",
      workbox: {
        cacheId: CACHE_NAME,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.+/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: CACHE_NAME,
            },
          },
        ],
      },
    }),
  ],
});
