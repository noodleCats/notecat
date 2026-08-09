import { variables } from "../../data/variables";

type SidebarVisibility = "visible" | "hidden";

const SIDEBAR_WIDTH_STORAGE_KEY = "sidebar-width";
const SIDEBAR_VISIBILITY_STORAGE_KEY = "sidebar-visibility";

const DEFAULT_SIDEBAR_WIDTH = 240;

function convertToWidth(value: string | null): number {
  if (value === null) return DEFAULT_SIDEBAR_WIDTH;
  const parsedWidth = Number(value);
  if (!Number.isFinite(parsedWidth) || parsedWidth <= 0)
    return DEFAULT_SIDEBAR_WIDTH;
  return parsedWidth;
}

function convertToVisibility(value: string | null): SidebarVisibility {
  if (value !== "hidden") return "visible";
  return "hidden";
}

export const sidebarState = $state({
  width: convertToWidth(variables.local.get(SIDEBAR_WIDTH_STORAGE_KEY)),
  visibility: convertToVisibility(
    variables.session.get(SIDEBAR_VISIBILITY_STORAGE_KEY),
  ),
});

export function setSidebarWidth(value: number) {
  sidebarState.width = value;
  variables.local.set({
    name: SIDEBAR_WIDTH_STORAGE_KEY,
    value: sidebarState.width.toString(),
  });
}

export function setSidebarVisibility(value: SidebarVisibility) {
  sidebarState.visibility = value;
  variables.session.set({
    name: SIDEBAR_VISIBILITY_STORAGE_KEY,
    value: sidebarState.visibility,
  });
}

export function toggleSidebarVisibility() {
  setSidebarVisibility(
    sidebarState.visibility === "visible" ? "hidden" : "visible",
  );
}
