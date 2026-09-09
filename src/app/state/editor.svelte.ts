import { variables } from "../../data/variables";

const EDITOR_FONT_STORAGE_KEY = "editor-font";
const DEFAULT_FONT = "system-ui";

type EditorFont = "system-ui" | "monospace";

function convertToValidFont(value: string | null): EditorFont {
  return value === "system-ui" || value === "monospace" ? value : DEFAULT_FONT;
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
  setEditorFont(editorState.font === "system-ui" ? "monospace" : "system-ui");
}
