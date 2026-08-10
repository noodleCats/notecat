import { closeActiveNote, createNoteAndFocus, toggleSidebar } from "./commands";
import { registerShortcut } from "./keyboard";

export function registerAppShortcuts(): () => void {
  const unregisterShortcuts = [
    registerShortcut({
      key: "b",
      ctrl: true,
      preventDefault: true,
      action: toggleSidebar,
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
