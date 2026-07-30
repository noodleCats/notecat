type ShortcutModifiers = {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
};

type ShortcutDef = ShortcutModifiers & {
  key: string;
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
};

let shortcuts: ShortcutDef[] = [];
let listening = false;

function handleKeydown(event: KeyboardEvent) {
  for (const shortcut of shortcuts) {
    if (
      event.key === shortcut.key &&
      !!shortcut.ctrl === event.ctrlKey &&
      !!shortcut.alt === event.altKey &&
      !!shortcut.shift === event.shiftKey
    ) {
      if (shortcut.preventDefault) event.preventDefault();
      shortcut.handler(event);
      return;
    }
  }
}

function startListening() {
  if (listening) return;
  document.addEventListener("keydown", handleKeydown);
  listening = true;
}

function stopListening() {
  document.removeEventListener("keydown", handleKeydown);
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
