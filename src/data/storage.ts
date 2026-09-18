import { del, entries, get, promisifyRequest, set, values } from "idb-keyval";
import { NOTES_DB_NAME, notesStore } from "./db";
import type { Note } from "@/types/note";
import { type Result, tryResult } from "@/shared/result";
import { getCurrentTime, isValidTimestamp } from "@/shared/time";
import { getRandomUUID, isValidUUID } from "@/shared/uuid";
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

  const isValidNote =
    typeof object.id === "string" &&
    typeof object.title === "string" &&
    typeof object.content === "string" &&
    typeof object.createdAt === "number" &&
    typeof object.updatedAt === "number";
  if (!isValidNote) return false;

  const hasValidUUID = isValidUUID(object.id);
  if (!hasValidUUID) return false;

  const hasValidTimestamps =
    isValidTimestamp(object.createdAt) && isValidTimestamp(object.updatedAt);
  if (!hasValidTimestamps) return false;

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
    if (!navigator.storage?.persist) return "unavailable";
    if (await navigator.storage.persisted()) return "granted";
    return (await navigator.storage.persist()) ? "granted" : "denied";
  });
}

export function getAllNotes(): Promise<Result<Note[]>> {
  return tryResult(async () => {
    // In-place sorting is appropriate here
    // oxlint-disable-next-line unicorn/no-array-sort
    const notes = (await values<Note>(notesStore)).sort(
      (left, right) => right.updatedAt - left.updatedAt,
    );
    if (!isNoteArray(notes))
      throw new Error("Note storage contains malformed notes");
    return notes;
  });
}

export function getNote(id: string): Promise<Result<Note | null>> {
  return tryResult(async () => {
    const note = await get<Note>(id, notesStore);
    if (!note) return null;
    if (!isNote(note)) throw new Error(`Requested note is malformed`);
    return note;
  });
}

export function saveNote(note: Note): Promise<Result<void>> {
  return tryResult(async () => {
    await set(note.id, note, notesStore);
    notifyNotesChanged();
  });
}

export function deleteNote(id: string): Promise<Result<void>> {
  return tryResult(async () => {
    await del(id, notesStore);
    notifyNotesChanged();
  });
}

export function replaceAllNotes(notes: Note[]): Promise<Result<void>> {
  return tryResult(async () => {
    await notesStore("readwrite", (store) => {
      store.clear();
      for (const note of notes) store.put(note, note.id);
      return promisifyRequest(store.transaction);
    });
    notifyNotesChanged();
  });
}

export function getByteSize(): Promise<Result<FiniteNumber>> {
  return tryResult(async () => {
    const notes = await entries<string, Note>(notesStore);
    let totalSize = 0;
    for (const [id, note] of notes) {
      totalSize += new Blob([JSON.stringify([id, note])]).size;
    }
    return totalSize as FiniteNumber;
  });
}
