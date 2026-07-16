import type { Note } from "../types/note";
import { clear, del, entries, get, set, values } from "idb-keyval";
import { type Result, ok, err } from "../shared/result";
import { notesStore } from "./db";

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

export function isNoteArray(value: unknown): value is Note[] {
  return Array.isArray(value) && value.every(isNote);
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
    const notes = (await values<Note>(notesStore)).sort(
      (left, right) => right.updatedAt - left.updatedAt,
    );
    return ok(notes);
  } catch (e) {
    return err(e as Error);
  }
}

export async function getNote(id: string): Promise<Result<Note | null>> {
  try {
    const note = await get<Note>(id, notesStore);
    return ok(note ?? null);
  } catch (e) {
    return err(e as Error);
  }
}

export async function saveNote(note: Note): Promise<Result<void>> {
  try {
    await set(note.id, note, notesStore);
    return ok();
  } catch (e) {
    return err(e as Error);
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
  } catch (e) {
    return err(e as Error);
  }
}

export async function replaceAllNotes(notes: Note[]): Promise<Result<void>> {
  try {
    await clear(notesStore);

    for (const note of notes) {
      await set(note.id, note, notesStore);
    }

    return ok();
  } catch (e) {
    return err(e as Error);
  }
}

export async function getStorageUsedBytes(): Promise<number> {
  const notes = await entries<string, Note>(notesStore);
  let totalSize = 0;
  for (const [id, note] of notes) {
    totalSize += new Blob([JSON.stringify([id, note])]).size;
  }
  return totalSize;
}
