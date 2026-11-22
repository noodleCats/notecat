import type { Note } from "@/shared/note";
import { isNoteArray } from "@/shared/note";
import { notekeeper } from "./notekeeper.svelte";
import { showModal } from "./state/modal.svelte";
import { requestFocusTitle, toggleEditorFont } from "./state/editor.svelte";
import {
  setSidebarView,
  toggleSidebarVisibility,
} from "./state/sidebar.svelte";

function sanitizeFilenamePart(value: string): string {
  const sanitized = Array.from(value.trim())
    .filter((character) => character >= " " && !/[<>:"/\\|?*]/u.test(character))
    .join("")
    .replaceAll(/\s+/gu, " ")
    .slice(0, 64);

  return sanitized || "untitled";
}

function titleFromFilename(filename: string): string {
  const title = filename.replace(/\.txt$/iu, "").trim();
  return title || "Untitled";
}

function downloadFile(file: Blob, filename: string) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.append(input);

    const finalize = (file: File | null) => {
      input.remove();
      resolve(file);
    };

    input.addEventListener("change", () => finalize(input.files?.[0] ?? null), {
      once: true,
    });
    input.addEventListener("cancel", () => finalize(null), { once: true });
    input.click();
  });
}

async function showError(title: string, message: string) {
  await showModal({
    title: title,
    content: message,
    buttons: [{ id: "close", label: "Close" }],
  });
}

export async function createNoteAndFocus() {
  const result = await notekeeper.createNote();
  if (!result.ok) return;

  setSidebarView("notes");
  requestFocusTitle();
}

export async function closeActiveNote() {
  await notekeeper.closeActiveNote();
}

function noteName(note: Note): string {
  return `'${note.title || "Untitled"}'`;
}

export async function trashActiveNote() {
  const note = notekeeper.activeNote;
  if (note === null) return;

  await trashNote(note);
}

// Trashing is reversible, so it doesn't ask for confirmation
export async function trashNote(note: Note) {
  const result = await notekeeper.trashNote(note.id);
  if (!result.ok)
    await showError(
      "Couldn't move to trash",
      "Failed to move note to trash. Please try again.",
    );
}

export async function restoreNote(note: Note) {
  const result = await notekeeper.restoreNote(note.id);
  if (!result.ok)
    await showError(
      "Restore failed",
      "Failed to restore note. Please try again.",
    );
}

export async function requestDeleteNote(note: Note) {
  const choice = await showModal({
    title: "Delete note forever?",
    content: `${noteName(note)} will be permanently deleted. This action cannot be undone.`,
    buttons: [
      { id: "cancel", label: "Cancel" },
      { id: "delete", label: "Delete forever", variant: "danger" },
    ],
  });
  if (choice !== "delete") return;

  const result = await notekeeper.deleteNote(note.id);
  if (!result.ok)
    await showError(
      "Deletion failed",
      "Failed to delete note. Please try again.",
    );
}

export async function requestEmptyTrash() {
  // Snapshot what the dialog describes, so only those notes get deleted
  const noteIds = notekeeper.trash.map(({ id }) => id);
  const count = noteIds.length;
  if (count === 0) return;

  const choice = await showModal({
    title: "Empty trash?",
    content: `${count === 1 ? "1 note" : `${count} notes`} will be permanently deleted. This action cannot be undone.`,
    buttons: [
      { id: "cancel", label: "Cancel" },
      { id: "empty", label: "Empty trash", variant: "danger" },
    ],
  });
  if (choice !== "empty") return;

  const result = await notekeeper.emptyTrash(noteIds);
  if (!result.ok)
    await showError(
      "Couldn't empty trash",
      "Failed to empty trash. Please try again.",
    );
}

export async function exportActiveNoteAsText() {
  const saveResult = await notekeeper.saveActiveNote();
  if (!saveResult.ok) {
    await showError(
      "Export failed",
      "Failed to save current note. Please try again.",
    );
    return;
  }

  const note = notekeeper.activeNote;
  // The menu item for this command is disabled when there is no active note
  // so there's mostly no need for showError
  if (note === null) return;

  const noteText = `${note.content}`;
  const filename = `${sanitizeFilenamePart(note.title)}.txt`;
  downloadFile(
    new Blob([noteText], { type: "text/plain;charset=utf-8" }),
    filename,
  );
}

export async function exportAllNotesAsJson() {
  const saveResult = await notekeeper.saveActiveNote();
  if (!saveResult.ok) {
    await showError(
      "Export failed",
      "Failed to save current note. Please try again.",
    );
    return;
  }

  const file = new Blob([JSON.stringify(notekeeper.allNotes, null, 2)], {
    type: "application/json;charset=utf-8",
  });

  downloadFile(file, "notecat-notes.json");
}

async function confirmImportNotes(notes: Note[], fileName: string) {
  const result = await showModal({
    title: "Import notes?",
    content: `Import ${notes.length} ${notes.length === 1 ? "note" : "notes"} from '${fileName}'? This will replace all existing notes.`,
    buttons: [
      { id: "cancel", label: "Cancel" },
      { id: "replace", label: "Replace all", variant: "danger" },
    ],
  });

  if (result === "replace") await notekeeper.importNotes(notes);
}

export async function importAllNotesFromJson() {
  const file = await pickFile("application/json,.json");
  if (file === null) return;

  let contents: string;
  try {
    contents = await file.text();
  } catch {
    await showError("Import failed", "The selected file could not be read.");
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    await showError("Import failed", "The selected file is not valid JSON.");
    return;
  }

  if (!isNoteArray(parsed)) {
    await showError(
      "Import failed",
      "The selected JSON file does not contain a valid note export.",
    );
    return;
  }

  await confirmImportNotes(parsed, file.name);
}

export async function importNoteFromText() {
  const file = await pickFile("text/plain,.txt");
  if (file === null) return;

  let content: string;
  try {
    content = await file.text();
  } catch {
    await showError("Import failed", "The selected file could not be read.");
    return;
  }

  const result = await notekeeper.createNote(
    titleFromFilename(file.name),
    content,
  );
  if (!result.ok) {
    await showError(
      "Import failed",
      "The selected file could not be imported.",
    );
    return;
  }

  requestFocusTitle();
}

export function toggleSidebar() {
  toggleSidebarVisibility();
}

export function toggleMonospace() {
  toggleEditorFont();
}

export function openRepo() {
  window.open(
    "https://github.com/noodleCats/notecat",
    "_blank",
    "noopener,noreferrer",
  );
}
