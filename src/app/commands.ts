import type { Note } from "../types/note";
import { notekeeper } from "./notekeeper.svelte";
import { showModal } from "./state/modal.svelte";
import { requestTitleFocus, toggleEditorFont } from "./state/editor.svelte";
import { toggleSidebarVisibility } from "./state/sidebar.svelte";
import { isNoteArray } from "../data/storage";

function sanitizeFilenamePart(value: string): string {
  const sanitized = Array.from(value.trim())
    .filter((character) => character >= " " && !/[<>:"/\\|?*]/.test(character))
    .join("")
    .replace(/\s+/g, " ")
    .slice(0, 64);

  return sanitized || "untitled";
}

function titleFromFilename(filename: string): string {
  const title = filename.replace(/\.txt$/i, "").trim();
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

    let settled = false;
    let cancelFallbackId: number | undefined;

    const finalize = (file: File | null) => {
      if (settled) return;
      settled = true;
      if (cancelFallbackId !== undefined) {
        clearTimeout(cancelFallbackId);
      }
      input.removeEventListener("cancel", onCancel);
      input.remove();
      resolve(file);
    };

    const onCancel = () => {
      finalize(null);
    };

    input.addEventListener(
      "change",
      () => {
        finalize(input.files?.[0] ?? null);
      },
      { once: true },
    );

    input.addEventListener("cancel", onCancel, { once: true });
    input.click();

    cancelFallbackId = window.setTimeout(() => {
      finalize(input.files?.[0] ?? null);
    }, 60000);
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

  requestTitleFocus();
}

export async function closeActiveNote() {
  await notekeeper.closeActiveNote();
}

export async function requestDeleteActiveNote() {
  const note = notekeeper.activeNote;
  if (note === null) return;

  await requestDeleteNote(note);
}

export async function requestDeleteNote(
  note: Note,
  options?: { immediate: boolean },
) {
  const deleteNote = async () => {
    const result = await notekeeper.deleteNote(note.id);
    if (!result.ok)
      await showError(
        "Deletion failed",
        "Failed to delete note. Please try again.",
      );
  };

  if (options?.immediate) {
    await deleteNote();
    return;
  }

  const result = await showModal({
    title: "Delete note?",
    content: `Are you sure you want to delete '${note.title || "Untitled"}'? This action cannot be undone.`,
    buttons: [
      {
        id: "cancel",
        label: "Cancel",
      },
      {
        id: "delete",
        label: "Delete",
        variant: "danger",
      },
    ],
  });

  if (result === "delete") {
    await deleteNote();
  }
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

  const file = new Blob([JSON.stringify(notekeeper.notes, null, 2)], {
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

  requestTitleFocus();
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
