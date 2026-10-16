import { variables } from "@/data/variables";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";

export const themeState = $state<{ theme: Theme }>({
  theme: variables.local.get(THEME_STORAGE_KEY) === "light" ? "light" : "dark",
});

export function setTheme(theme: Theme) {
  themeState.theme = theme;
  document.documentElement.dataset.theme = theme;
  variables.local.set(THEME_STORAGE_KEY, theme);
}
