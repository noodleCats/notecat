import { MediaQuery } from "svelte/reactivity";
import { variables } from "@/data/variables";

// index.html reads this key too, to apply the theme before first paint
const THEME_STORAGE_KEY = "theme";

export type ThemePreference = "system" | "light" | "dark";
export type Theme = "light" | "dark";

function convertToPreference(value: string | null): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

const prefersLight = new MediaQuery("(prefers-color-scheme: light)");

export const themeState = $state({
  preference: convertToPreference(variables.local.get(THEME_STORAGE_KEY)),
});

export function resolveTheme(): Theme {
  if (themeState.preference !== "system") return themeState.preference;
  return prefersLight.current ? "light" : "dark";
}

/**
 * Switches the page to `theme` in one step.
 *
 * Without this, every control with a color transition would fade from
 * the old theme's colors while the rest switch colors instantly
 */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (root.dataset.theme === theme) return;

  root.classList.add("theme-switching");
  root.dataset.theme = theme;
  // Resolve the new colors now, while transitions are off. Turning them
  // back on afterwards doesn't animate values that have already changed
  void root.offsetHeight;
  root.classList.remove("theme-switching");
}

export function setThemePreference(value: ThemePreference) {
  themeState.preference = value;
  variables.local.set(THEME_STORAGE_KEY, value === "system" ? null : value);
}
