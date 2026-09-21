import { db, NOTES_DB_NAME, NOTES_STORE_NAME } from "./db";
import type { Note } from "@/types/note";
import { type Result, tryResult } from "@/shared/result";
import { getCurrentTime, isValidTimestamp } from "@/shared/time";
import { getRandomUUID, isValidUUID, type UUIDv4 } from "@/shared/uuid";
import type { FiniteNumber } from "@/types/finite";

type PersistenceStatus = "granted" | "denied" | "unavailable";

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

function notifyNotesChanged(): void {
  try {
    // BroadcastChannel is already scoped to the origin
    // oxlint-disable-next-line unicorn/require-post-message-target-origin
    notesChannel?.postMessage("notes-changed");
  } catch (error) {
    console.warn("Could not notify other contexts of note changes:", error);
  }
}

export function isNote(object: unknown): object is Note {
  const isObject = typeof object === "object" && object !== null;
  if (!isObject) return false;

  const hasNoteProperties =
    "id" in object &&
    "title" in object &&
    "content" in object &&
    "createdAt" in object &&
    "updatedAt" in object;
  if (!hasNoteProperties) return false;

  const hasValidTypes =
    typeof object.id === "string" &&
    typeof object.title === "string" &&
    typeof object.content === "string" &&
    typeof object.createdAt === "number" &&
    typeof object.updatedAt === "number";
  if (!hasValidTypes) return false;

  const hasValidTimestamps =
    isValidTimestamp(object.createdAt) && isValidTimestamp(object.updatedAt);
  if (!hasValidTimestamps) return false;

  const hasValidUUID = isValidUUID(object.id);
  if (!hasValidUUID) return false;

  return true;
}

export function isNoteArray(value: unknown): value is Note[] {
  return Array.isArray(value) && value.every((note) => isNote(note));
}

export function newNote(title = "Untitled", content = ""): Note {
  const now = getCurrentTime();
  return {
    id: getRandomUUID(),
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };
}

export function requestPersistentStorage(): Promise<Result<PersistenceStatus>> {
  return tryResult(async () => {
    if (!navigator.storage || !navigator.storage.persist) return "unavailable";
    if (await navigator.storage.persisted()) return "granted";
    return (await navigator.storage.persist()) ? "granted" : "denied";
  });
}

export function getAllNotes(): Promise<Result<Note[]>> {
  return tryResult(async () => {
    // In-place sorting is appropriate here
    // oxlint-disable-next-line unicorn/no-array-sort
    const notes = (await db.getAll(NOTES_STORE_NAME)).sort(
      (left, right) => right.updatedAt - left.updatedAt,
    );
    if (!isNoteArray(notes))
      throw new Error("Note storage contains malformed notes");
    return notes;
  });
}

export function getNote(noteId: UUIDv4): Promise<Result<Note | null>> {
  return tryResult(async () => {
    const note = await db.get(NOTES_STORE_NAME, noteId);
    if (!note) return null;
    if (!isNote(note)) throw new Error(`Requested note is malformed`);
    return note;
  });
}

export function saveNote(note: Note): Promise<Result<void>> {
  return tryResult(async () => {
    await db.put(NOTES_STORE_NAME, note, note.id);
    notifyNotesChanged();
  });
}

export function deleteNote(noteId: UUIDv4): Promise<Result<void>> {
  return tryResult(async () => {
    await db.delete(NOTES_STORE_NAME, noteId);
    notifyNotesChanged();
  });
}

export function replaceAllNotes(notes: Note[]): Promise<Result<void>> {
  return tryResult(async () => {
    const transaction = db.transaction(NOTES_STORE_NAME, "readwrite");
    await Promise.all([
      transaction.store.clear(),
      ...notes.map((note) => transaction.store.put(note, note.id)),
    ]);
    await transaction.done;
    notifyNotesChanged();
  });
}

export function getByteSize(): Promise<Result<FiniteNumber>> {
  return tryResult(async () => {
    const notes = await db.getAll(NOTES_STORE_NAME);
    return new Blob([JSON.stringify(notes)]).size as FiniteNumber;
  });
}
