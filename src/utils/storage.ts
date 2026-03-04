import type { Note } from "types/note";

type Result<T, E = Error> = { ok: true; value?: T } | { ok: false; error: E };

function Ok<T>(value?: T): Result<T, never> {
  return { ok: true, value };
}

function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

const ACTIVE_NOTE_ID_STORAGE_KEY = "notecat:active-note-id";

export function getActiveNoteId(): string | null {
  const activeNoteId = localStorage.getItem(ACTIVE_NOTE_ID_STORAGE_KEY);
  if (activeNoteId) {
    return activeNoteId;
  }
  return null;
}

export function setActiveNoteId(id: string): void {
  localStorage.setItem(ACTIVE_NOTE_ID_STORAGE_KEY, id);
}

export function clearActiveNoteId(): void {
  localStorage.setItem(ACTIVE_NOTE_ID_STORAGE_KEY, "");
}

function isNote(object: unknown): object is Note {
  const isObject = typeof object === "object" && object !== null;
  if (!isObject) return false;

  const isNote =
    typeof (object as any).id === "string" &&
    typeof (object as any).title === "string" &&
    typeof (object as any).content === "string" &&
    typeof (object as any).createdAt === "number" &&
    typeof (object as any).updatedAt === "number";
  if (!isNote) return false;

  return true;
}

export function getAllNotes(): Result<Note[]> {
  let notes: Note[] = [];

  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (!key.startsWith("note:")) continue;

    const noteJSON = localStorage.getItem(key)!;
    const note = JSON.parse(noteJSON);
    if (!isNote(note)) {
      return Err(
        new Error(
          `getAllNotes: non-Note object found in localStorage at key ${key}`,
        ),
      );
    } else {
      notes.push(note);
    }
  }

  const sortedNotes = notes.sort((a, b) => b.updatedAt - a.updatedAt);
  return Ok(sortedNotes);
}

export function getNote(id: string): Result<Note | null> {
  const noteJSON = localStorage.getItem(`note:${id}`);
  if (noteJSON === null) return Ok(null);

  const note = JSON.parse(noteJSON);
  if (!isNote(note)) {
    return Err(
      new Error(
        `getNote: non-Note object found in localStorage at key note:${id}`,
      ),
    );
  }
  return Ok(note);
}

export function newNote(title?: string): Note {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: title ?? "Untitled",
    content: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function saveNote(note: Note): Result<void> {
  const storageKey = `note:${note.id}`;

  try {
    localStorage.setItem(storageKey, JSON.stringify(note));
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      return Err(new Error("saveNote: storage is full", { cause: e }));
    } else return Err(e as Error);
  }
  return Ok();
}

export function deleteNote(id: string): Result<void> {
  const noteToDelete = localStorage.getItem(`note:${id}`);
  if (noteToDelete === null)
    return Err(new Error(`deleteNote: note with ID ${id} not found`));

  localStorage.removeItem(`note:${id}`);
  return Ok();
}

export function getStorageUsedBytes(): number {
  let totalSize = 0;
  for (const [key, value] of Object.entries(localStorage)) {
    if (key.startsWith("note:")) {
      totalSize += new Blob([key, value]).size;
    }
  }
  return totalSize;
}
