import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "unicorn", "oxc", "import"],
  categories: {
    correctness: "error",
    suspicious: "warn",
    pedantic: "warn",
    perf: "warn",
  },
  rules: {
    "no-var": "warn",
    "typescript/no-non-null-assertion": "warn",
    "typescript/no-explicit-any": "warn",
    "no-inline-comments": "off",
    "no-negated-condition": "off",
    "no-shadow": "off",
    "unicorn/no-negated-condition": "off",
  },
  env: {
    builtin: true,
  },
});
