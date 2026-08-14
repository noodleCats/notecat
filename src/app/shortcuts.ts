import {
  closeActiveNote,
  createNoteAndFocus,
  toggleMonospace,
  toggleSidebar,
} from "./commands";
import { registerShortcut } from "../lib/keyboard";

export function registerAppShortcuts(): () => void {
  const unregisterShortcuts = [
    registerShortcut({
      key: "b",
      ctrl: true,
      preventDefault: true,
      action: toggleSidebar,
    }),
    registerShortcut({
      key: "m",
      ctrl: true,
      preventDefault: true,
      action: toggleMonospace,
    }),
    registerShortcut({
      key: "n",
      alt: true,
      preventDefault: true,
      action: createNoteAndFocus,
    }),
    registerShortcut({
      key: "w",
      alt: true,
      preventDefault: true,
      action: closeActiveNote,
    }),
  ];

  return () => unregisterShortcuts.forEach((unregister) => unregister());
}
