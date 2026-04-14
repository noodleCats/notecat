import { notekeeper } from "./notekeeper.svelte";

export async function createNoteAndFocus() {
  const newNoteId = await notekeeper.createNote();
  document.dispatchEvent(new CustomEvent("newNote", { detail: newNoteId }));
}

export async function closeActiveNote() {
  await notekeeper.saveActiveNote();
  await notekeeper.closeActiveNote();
}

export function requestDeleteActiveNote() {
  const note = notekeeper.activeNote;
  if (note === null) return;

  document.dispatchEvent(
    new CustomEvent("requestDelete", {
      detail: {
        noteId: note.id,
        noteTitle: note.title || "Untitled",
      },
    }),
  );
}

export function dispatchSidebarToggle() {
  document.dispatchEvent(new CustomEvent("toggleSidebar"));
}

export function openRepo() {
  window.open(
    "https://github.com/noodleCats/notecat",
    "_blank",
    "noopener,noreferrer",
  );
}
