import Dexie, { type Table } from "dexie";
import type { Note } from "types/note";

class NotesDatabase extends Dexie {
  notes!: Table<Note, string>;

  constructor() {
    super("NotesDB");
    this.version(1).stores({
      notes: "id, updatedAt",
    });
  }
}

const db = new NotesDatabase();

type Result<T, E = Error> = { ok: true; value?: T } | { ok: false; error: E };

function Ok<T>(value?: T): Result<T, never> {
  return { ok: true, value };
}

function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
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
    const exists = await db.notes.get(id);
    if (!exists) {
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
