import { variables } from "@/data/variables";

const EDITOR_FONT_STORAGE_KEY = "editor-font";
const DEFAULT_FONT = "system-ui";

export const editorFonts = [
  { value: "system-ui", label: "System" },
  { value: "sans", label: "Sans" },
  { value: "serif", label: "Serif" },
  { value: "monospace", label: "Monospace" },
] as const;

export type EditorFont = (typeof editorFonts)[number]["value"];

export function isEditorFont(value: string | null): value is EditorFont {
  return editorFonts.some((font) => font.value === value);
}

function convertToValidFont(value: string | null): EditorFont {
  return isEditorFont(value) ? value : DEFAULT_FONT;
}

export const editorState = $state({
  shouldFocusTitle: false,
  font: convertToValidFont(variables.local.get(EDITOR_FONT_STORAGE_KEY)),
});

export function requestFocusTitle() {
  setShouldFocusTitle(true);
}

export function setShouldFocusTitle(value: boolean) {
  editorState.shouldFocusTitle = value;
}

export function setEditorFont(font: EditorFont) {
  editorState.font = font;
  variables.local.set(EDITOR_FONT_STORAGE_KEY, font);
}

export function toggleEditorFont() {
  setEditorFont(editorState.font === "monospace" ? "system-ui" : "monospace");
}
