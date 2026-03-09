import Dexie from "dexie";
import type { EntityTable } from "dexie";
import type { Note } from "types/note";
import variables from "../lib/variables.svelte";

type Result<T, E = Error> = { ok: true; value?: T } | { ok: false; error: E };

function Ok<T>(value?: T): Result<T, never> {
  return { ok: true, value };
}

function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
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

async function migrateFromLocalStorage(): Promise<{ migrated: number }> {
  let migrated = 0;
  const keys = Object.keys(localStorage);

  for (const key of keys) {
    if (!key.startsWith("note:")) continue;

    const noteJSON = localStorage.getItem(key)!;
    const note = JSON.parse(noteJSON);

    if (isNote(note)) {
      await db.notes.put(note);
      localStorage.removeItem(key);
      migrated++;
    }
  }

  return { migrated };
}

const MIGRATION_KEY = "migrated";

export async function runMigrations(): Promise<{ migrated: number } | null> {
  if (variables.local.get(MIGRATION_KEY) === "true") {
    return null;
  }

  const result = await migrateFromLocalStorage();
  variables.local.set({ name: MIGRATION_KEY, value: "true" });
  return result;
}

const db = new Dexie("NoteDB") as Dexie & {
  notes: EntityTable<Note, "id">;
};

db.version(1).stores({
  notes: "id, title, createdAt, updatedAt",
});

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
    const noteExists = (await db.notes.get(id)) !== undefined;
    if (noteExists) {
      await db.notes.delete(id);
      return Ok();
    } else {
      return Err(new Error(`deleteNote: note with ID ${id} not found`));
    }
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
