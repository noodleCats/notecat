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

class Shortcuts {
  private shortcuts = $state<ShortcutDef[]>([]);
  private listening = false;

  private handleKeydown = (event: KeyboardEvent) => {
    for (const shortcut of this.shortcuts) {
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
  };

  private startListening() {
    if (this.listening) return;
    document.addEventListener("keydown", this.handleKeydown);
    this.listening = true;
  }

  private stopListening() {
    document.removeEventListener("keydown", this.handleKeydown);
    this.listening = false;
  }

  register(def: ShortcutDef): () => void {
    this.shortcuts.push(def);
    this.startListening();

    return () => {
      this.shortcuts = this.shortcuts.filter((s) => s !== def);
      if (this.shortcuts.length === 0) this.stopListening();
    };
  }
}

const shortcuts = new Shortcuts();
export default shortcuts;
