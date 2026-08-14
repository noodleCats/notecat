import { modalState } from "../app/state/modal.svelte";
import { menuState } from "../app/state/menu.svelte";

type ShortcutModifiers = {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
};

type ShortcutDef = ShortcutModifiers & {
  key: string;
  action: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
};

let shortcuts: ShortcutDef[] = [];
let listening = false;

function onKeydown(event: KeyboardEvent) {
  for (const shortcut of shortcuts) {
    if (
      event.key === shortcut.key &&
      !!shortcut.ctrl === event.ctrlKey &&
      !!shortcut.alt === event.altKey &&
      !!shortcut.shift === event.shiftKey
    ) {
      if (shortcut.preventDefault) event.preventDefault();

      if (modalState.modal || menuState.open) return;

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

export function registerShortcut(def: ShortcutDef): () => void {
  shortcuts.push(def);
  startListening();

  return () => {
    shortcuts = shortcuts.filter((shortcut) => shortcut !== def);
    if (shortcuts.length === 0) stopListening();
  };
}
