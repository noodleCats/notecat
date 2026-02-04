/** Editor textarea reference */
let editorElement: HTMLTextAreaElement | null = null;

/** Callback type for editor input events */
export type EditorInputCallback = (content: string) => void;

/** Initialize editor and return the textarea element */
export function initEditor(): HTMLTextAreaElement {
  const editor = document.getElementById("editor");

  if (!(editor instanceof HTMLTextAreaElement)) {
    throw new Error("Editor element not found or not a textarea");
  }

  editorElement = editor;
  return editor;
}

/** Get the editor element (must be initialized first) */
export function getEditor(): HTMLTextAreaElement {
  if (!editorElement) {
    throw new Error("Editor not initialized");
  }
  return editorElement;
}

/** Set editor content */
export function setEditorContent(content: string): void {
  const editor = getEditor();
  editor.value = content;
  autoResize();
}

/** Get editor content */
export function getEditorContent(): string {
  return getEditor().value;
}

/** Auto-resize textarea to fit content */
export function autoResize(): void {
  const editor = getEditor();
  const wrapper = editor.parentElement;
  const scrollTop = wrapper?.scrollTop ?? 0;
  editor.style.height = "auto";
  editor.style.height = `${editor.scrollHeight}px`;
  if (wrapper) {
    wrapper.scrollTop = scrollTop;
  }
}

/** Set up input event listener with debouncing */
export function onEditorInput(
  callback: EditorInputCallback,
  debounceMs: number = 300,
): void {
  const editor = getEditor();
  let timeoutId: number | undefined;

  editor.addEventListener("input", () => {
    autoResize();

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(editor.value);
    }, debounceMs);
  });
}

/** Set up instant input event listener (no debounce) */
export function onEditorInputInstant(callback: EditorInputCallback): void {
  const editor = getEditor();

  editor.addEventListener("input", () => {
    callback(editor.value);
  });
}

/** Focus the editor */
export function focusEditor(): void {
  getEditor().focus();
}

/** Show or hide the editor */
export function setEditorVisible(visible: boolean): void {
  const editor = getEditor();
  editor.style.display = visible ? "block" : "none";
}
