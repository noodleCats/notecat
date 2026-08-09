import { closeActiveNote, createNoteAndFocus, toggleSidebar } from "./commands";
import { registerShortcut } from "./keyboard";

export function registerAppShortcuts(): () => void {
  const unregisterShortcuts = [
    registerShortcut({
      key: "b",
      ctrl: true,
      preventDefault: true,
      handler: toggleSidebar,
    }),
    registerShortcut({
      key: "n",
      alt: true,
      preventDefault: true,
      handler: createNoteAndFocus,
    }),
    registerShortcut({
      key: "w",
      alt: true,
      preventDefault: true,
      handler: closeActiveNote,
    }),
  ];

  return () => unregisterShortcuts.forEach((unregister) => unregister());
}
