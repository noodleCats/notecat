import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [
    // Exercise browser reactivity even though the tests run without a DOM.
    svelte({ dynamicCompileOptions: () => ({ generate: "client" }) }),
  ],
  resolve: {
    conditions: ["browser"],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
  },
});
