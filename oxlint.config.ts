import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "unicorn", "oxc", "import"],
  categories: {
    correctness: "error",
    suspicious: "warn",
    perf: "warn",
  },
  rules: {
    // Restriction rules
    "no-var": "warn",
    "typescript/no-non-null-assertion": "warn",
    "typescript/no-explicit-any": "warn",

    // Useful pedantic rules
    eqeqeq: "warn",
    "array-callback-return": "warn",
    "no-fallthrough": "warn",
    "no-self-compare": "warn",
    "no-throw-literal": "warn",
    "prefer-promise-reject-errors": "warn",
    "no-promise-executor-return": "warn",

    // Build-time constants injected by Vite's `define`
    "no-underscore-dangle": [
      "warn",
      { allow: ["__APP_VERSION__", "__BUILD_DATE__", "__APP_COMMIT__"] },
    ],
  },
  env: {
    builtin: true,
  },
});
