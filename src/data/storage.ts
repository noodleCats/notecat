import type { Note } from "../types/note";
import { type Result, Ok, Err } from "../shared/result";
import db from "./db";

export function isNote(object: unknown): object is Note {
  const isObject = typeof object === "object" && object !== null;
  if (!isObject) return false;

  const isValidNote =
    typeof (object as any).id === "string" &&
    typeof (object as any).title === "string" &&
    typeof (object as any).content === "string" &&
    typeof (object as any).createdAt === "number" &&
    typeof (object as any).updatedAt === "number";
  if (!isValidNote) return false;

  return true;
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

export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  }
  return false;
}

export async function getAllNotes(): Promise<Result<Note[]>> {
  try {
    const notes = await db.notes.orderBy("updatedAt").reverse().toArray();
    return Ok(notes);
  } catch (e) {
    return Err(e as Error);
  }
}

export async function getNote(id: string): Promise<Result<Note | null>> {
  try {
    const note = await db.notes.get(id);
    return Ok(note ?? null);
  } catch (e) {
    return Err(e as Error);
  }
}

export async function saveNote(note: Note): Promise<Result<void>> {
  try {
    await db.notes.put(note);
    return Ok();
  } catch (e) {
    return Err(e as Error);
  }
}

export async function deleteNote(id: string): Promise<Result<void>> {
  try {
    const noteExists = (await db.notes.get(id)) !== undefined;
    if (!noteExists) {
      return Err(new Error(`deleteNote: note with ID ${id} not found`));
    }

    await db.notes.delete(id);
    return Ok();
  } catch (e) {
    return Err(e as Error);
  }
}

export async function getStorageUsedBytes(): Promise<number> {
  const notes = await db.notes.toArray();
  let totalSize = 0;
  for (const note of notes) {
    totalSize += new Blob([JSON.stringify(note)]).size;
  }
  return totalSize;
}
