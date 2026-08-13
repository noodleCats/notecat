import type { Note } from "../types/note";
import { del, entries, get, promisifyRequest, set, values } from "idb-keyval";
import { type Result, ok, err } from "../shared/result";
import { notesStore } from "./db";
import { isValidTimestamp } from "../utils/time";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

type PersistenceStatus = "granted" | "denied" | "unavailable";

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
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
  try {
    if (!navigator.storage?.persist) return ok("unavailable");
    if (await navigator.storage.persisted()) return ok("granted");
    return ok((await navigator.storage.persist()) ? "granted" : "denied");
  } catch (error) {
    return err(toError(error));
  }
}

export async function getAllNotes(): Promise<Result<Note[]>> {
  try {
    const notes = (await values<Note>(notesStore)).sort(
      (left, right) => right.updatedAt - left.updatedAt,
    );
    return ok(notes);
  } catch (error) {
    return err(toError(error));
  }
}

export async function getNote(id: string): Promise<Result<Note | null>> {
  try {
    const note = await get<Note>(id, notesStore);
    return ok(note ?? null);
  } catch (error) {
    return err(toError(error));
  }
}

export async function saveNote(note: Note): Promise<Result<void>> {
  try {
    await set(note.id, note, notesStore);
    return ok();
  } catch (error) {
    return err(toError(error));
  }
}

export async function deleteNote(id: string): Promise<Result<void>> {
  try {
    const noteExists = (await get<Note>(id, notesStore)) !== undefined;
    if (!noteExists) {
      return err(new Error(`deleteNote: note with ID ${id} not found`));
    }

    await del(id, notesStore);
    return ok();
  } catch (error) {
    return err(toError(error));
  }
}

export async function replaceAllNotes(notes: Note[]): Promise<Result<void>> {
  try {
    await notesStore("readwrite", (store) => {
      store.clear();
      for (const note of notes) store.put(note, note.id);
      return promisifyRequest(store.transaction);
    });

    return ok();
  } catch (error) {
    return err(toError(error));
  }
}

export async function getStorageUsedBytes(): Promise<Result<number>> {
  try {
    const notes = await entries<string, Note>(notesStore);
    let totalSize = 0;
    for (const [id, note] of notes) {
      totalSize += new Blob([JSON.stringify([id, note])]).size;
    }
    return ok(totalSize);
  } catch (error) {
    return err(toError(error));
  }
}
