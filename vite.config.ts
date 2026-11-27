import { execSync } from "node:child_process";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json" with { type: "json" };

/** Commit hash of the build: Vercel's env var first, then local git if available */
function getCommitHash(): string | null {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA;
  }
  try {
    return execSync("git rev-parse HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __APP_COMMIT__: JSON.stringify(getCommitHash()),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    tailwindcss(),
    svelte(),
    VitePWA({
      manifest: false,
      injectRegister: false,
      registerType: "autoUpdate",
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ["**/*.{js,css,html,svg,json}"],
      },
    }),
  ],
});
