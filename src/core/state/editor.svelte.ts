import { variables } from "../../data/variables";

const EDITOR_FONT_STORAGE_KEY = "editor-font";
const DEFAULT_FONT = "system-ui";

type EditorFont = "system-ui" | "monospace";

function convertToValidFont(value: string | null): EditorFont {
  return value === "system-ui" || value === "monospace" ? value : DEFAULT_FONT;
}

export const editorState = $state({
  titleFocusRequest: 0,
  font: convertToValidFont(variables.local.get(EDITOR_FONT_STORAGE_KEY)),
});

export function requestTitleFocus() {
  editorState.titleFocusRequest += 1;
}

export function setEditorFont(font: EditorFont) {
  editorState.font = font;
  variables.local.set({ name: EDITOR_FONT_STORAGE_KEY, value: font });
}

export function toggleEditorFont() {
  setEditorFont(editorState.font === "system-ui" ? "monospace" : "system-ui");
}
