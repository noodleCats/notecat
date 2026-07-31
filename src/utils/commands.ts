import type { Note } from "../types/note";
import { notekeeper } from "../core/notekeeper.svelte";
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
      input.removeEventListener("cancel", handleCancel);
      input.remove();
      resolve(file);
    };

    const handleCancel = () => {
      finalize(null);
    };

    input.addEventListener(
      "change",
      () => {
        finalize(input.files?.[0] ?? null);
      },
      { once: true },
    );

    input.addEventListener("cancel", handleCancel, { once: true });
    input.click();

    cancelFallbackId = window.setTimeout(() => {
      finalize(input.files?.[0] ?? null);
    }, 60000);
  });
}

export async function createNoteAndFocus() {
  const result = await notekeeper.createNote();
  if (!result.ok) return;

  document.dispatchEvent(new CustomEvent("newNote", { detail: result.value }));
}

export async function closeActiveNote() {
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

export async function exportActiveNoteAsText() {
  const saveResult = await notekeeper.saveActiveNote();
  if (!saveResult.ok) return;

  const note = notekeeper.activeNote;
  if (note === null) return;

  const noteText = `${note.title}\n\n${note.content}`;
  const filename = `${sanitizeFilenamePart(note.title)}.txt`;
  downloadFile(
    new Blob([noteText], { type: "text/plain;charset=utf-8" }),
    filename,
  );
}

export async function exportAllNotesAsJson() {
  const saveResult = await notekeeper.saveActiveNote();
  if (!saveResult.ok) return;

  const file = new Blob([JSON.stringify(notekeeper.notes, null, 2)], {
    type: "application/json;charset=utf-8",
  });

  downloadFile(file, "notecat-notes.json");
}

function dispatchImportError(message: string) {
  document.dispatchEvent(
    new CustomEvent("showDialog", {
      detail: {
        title: "Import failed",
        content: message,
      },
    }),
  );
}

function dispatchImportRequest(notes: Note[], fileName: string) {
  document.dispatchEvent(
    new CustomEvent("requestImportNotes", {
      detail: {
        notes,
        fileName,
      },
    }),
  );
}

export async function importAllNotesFromJson() {
  const file = await pickFile("application/json,.json");
  if (file === null) return;

  let contents: string;
  try {
    contents = await file.text();
  } catch {
    dispatchImportError("The selected file could not be read.");
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    dispatchImportError("The selected file is not valid JSON.");
    return;
  }

  if (!isNoteArray(parsed)) {
    dispatchImportError(
      "The selected JSON file does not contain a valid note export.",
    );
    return;
  }

  dispatchImportRequest(parsed, file.name);
}

export async function importNoteFromText() {
  const file = await pickFile("text/plain,.txt");
  if (file === null) return;

  let content: string;
  try {
    content = await file.text();
  } catch {
    dispatchImportError("The selected file could not be read.");
    return;
  }

  const result = await notekeeper.createNote(
    titleFromFilename(file.name),
    content,
  );
  if (!result.ok) {
    dispatchImportError("The selected file could not be imported.");
    return;
  }

  document.dispatchEvent(new CustomEvent("newNote", { detail: result.value }));
}

export function openRepo() {
  window.open(
    "https://github.com/noodleCats/notecat",
    "_blank",
    "noopener,noreferrer",
  );
}
