import { del, entries, get, promisifyRequest, set, values } from "idb-keyval";
import { notesStore } from "./db";
import type { Note } from "../types/note";
import { type Result, tryResult } from "../shared/result";
import { isValidTimestamp } from "../lib/time";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

type PersistenceStatus = "granted" | "denied" | "unavailable";

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

  const hasValidID = UUID_V4_REGEX.test(object.id as string);
  if (!hasValidID) return false;

  const hasValidTimestamps =
    isValidTimestamp(object.createdAt as number) &&
    isValidTimestamp(object.updatedAt as number);
  if (!hasValidTimestamps) return false;

  return true;
}

export function isNoteArray(value: unknown): value is Note[] {
  return Array.isArray(value) && value.every(isNote);
}

export function newNote(title = "Untitled", content = ""): Note {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };
}

export async function requestPersistentStorage(): Promise<
  Result<PersistenceStatus>
> {
  return tryResult(async () => {
    if (!navigator.storage?.persist) return "unavailable";
    if (await navigator.storage.persisted()) return "granted";
    return (await navigator.storage.persist()) ? "granted" : "denied";
  });
}

export async function getAllNotes(): Promise<Result<Note[]>> {
  return tryResult(async () => {
    const notes = (await values<Note>(notesStore)).sort(
      (left, right) => right.updatedAt - left.updatedAt,
    );
    return notes;
  });
}

export async function getNote(id: string): Promise<Result<Note | null>> {
  return tryResult(async () => {
    const note = await get<Note>(id, notesStore);
    return note ?? null;
  });
}

export async function saveNote(note: Note): Promise<Result<void>> {
  return tryResult(async () => {
    await set(note.id, note, notesStore);
  });
}

export async function deleteNote(id: string): Promise<Result<void>> {
  return tryResult(async () => {
    await del(id, notesStore);
  });
}

export async function replaceAllNotes(notes: Note[]): Promise<Result<void>> {
  return tryResult(async () => {
    await notesStore("readwrite", (store) => {
      store.clear();
      for (const note of notes) store.put(note, note.id);
      return promisifyRequest(store.transaction);
    });
  });
}

export async function getStorageUsedBytes(): Promise<Result<number>> {
  return tryResult(async () => {
    const notes = await entries<string, Note>(notesStore);
    let totalSize = 0;
    for (const [id, note] of notes) {
      totalSize += new Blob([JSON.stringify([id, note])]).size;
    }
    return totalSize;
  });
}
