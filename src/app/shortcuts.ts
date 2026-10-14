import {
  closeActiveNote,
  createNoteAndFocus,
  toggleMonospace,
  toggleSidebar,
} from "./commands";
import { modalState } from "./state/modal.svelte";
import { menuState } from "./state/menu.svelte";
import type { Shortcut } from "@/types/shortcut";

let shortcuts: Shortcut[] = [];
let listening = false;

function onKeydown(event: KeyboardEvent) {
  for (const shortcut of shortcuts) {
    if (
      event.key === shortcut.key &&
      !!shortcut.ctrl === event.ctrlKey &&
      !!shortcut.alt === event.altKey &&
      !!shortcut.shift === event.shiftKey
    ) {
      if (shortcut.preventDefault !== false) event.preventDefault();

      if (modalState.modal !== null || menuState.open !== null) return;

      shortcut.action(event);
      return;
    }
  }
}

function startListening() {
  if (listening) return;
  document.addEventListener("keydown", onKeydown);
  listening = true;
}

function stopListening() {
  document.removeEventListener("keydown", onKeydown);
  listening = false;
}

function registerShortcut(def: Shortcut): () => void {
  shortcuts.push(def);
  startListening();

  return () => {
    shortcuts = shortcuts.filter((shortcut) => shortcut !== def);
    if (shortcuts.length === 0) stopListening();
  };
}

export function registerAppShortcuts(): () => void {
  const unregisterShortcuts = [
    registerShortcut({
      key: "b",
      ctrl: true,
      action: toggleSidebar,
    }),
    registerShortcut({
      key: "m",
      ctrl: true,
      action: toggleMonospace,
    }),
    registerShortcut({
      key: "n",
      alt: true,
      action: createNoteAndFocus,
    }),
    registerShortcut({
      key: "w",
      alt: true,
      action: closeActiveNote,
    }),
  ];

  return () => unregisterShortcuts.forEach((unregister) => unregister());
}
