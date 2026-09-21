import { defineConfig } from "oxfmt";

export default defineConfig({
  singleQuote: false,
  printWidth: 80,
  sortPackageJson: false,
  sortTailwindcss: {
    stylesheet: "./src/app.css",
  },
  svelte: {},
  ignorePatterns: [
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "bun.lock",
    "bun.lockb",
    "/static/",
  ],
});
