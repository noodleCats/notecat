import { NOTES_DB_NAME } from "./db";

const notesChannel =
  typeof BroadcastChannel === "undefined"
    ? undefined
    : new BroadcastChannel(`${NOTES_DB_NAME}:notes`);

import.meta.hot?.dispose(() => notesChannel?.close());

export function subscribeToNotesChanges(onChange: () => void): () => void {
  const onMessage = (event: MessageEvent<unknown>) => {
    if (event.data === "notes-changed") onChange();
  };
  notesChannel?.addEventListener("message", onMessage);
  return () => notesChannel?.removeEventListener("message", onMessage);
}

export function notifyNotesChanged(): void {
  try {
    // BroadcastChannel is already scoped to the origin
    // oxlint-disable-next-line unicorn/require-post-message-target-origin
    notesChannel?.postMessage("notes-changed");
  } catch (error) {
    console.warn("Could not notify other contexts of note changes:", error);
  }
}
