import { get, setMany } from "idb-keyval";
import type { Note } from "../types/note";
import { NOTES_DB_NAME, notesStore } from "./db";
import variables from "./variables";
import { isNote } from "./storage";

const STORAGE_MIGRATION_VERSION_NAME = "storage-migration-version";
const CURRENT_STORAGE_MIGRATION_VERSION = "1";
const LEGACY_LOCALSTORAGE_MIGRATION_NAME = "migrated";
const LEGACY_DEXIE_DB_NAME = "NoteDB";
const LEGACY_DEXIE_STORE_NAME = "notes";

export async function runMigrations(): Promise<{ migrated: number } | null> {
  if (
    variables.local.get(STORAGE_MIGRATION_VERSION_NAME) ===
    CURRENT_STORAGE_MIGRATION_VERSION
  ) {
    return null;
  }

  const migratedFromDexie = await migrateFromLegacyDexieDatabase();
  const migratedFromLocalStorage = await migrateFromLegacyLocalStorage();

  variables.local.set({
    name: STORAGE_MIGRATION_VERSION_NAME,
    value: CURRENT_STORAGE_MIGRATION_VERSION,
  });
  variables.local.set({
    name: LEGACY_LOCALSTORAGE_MIGRATION_NAME,
    value: null,
  });

  return { migrated: migratedFromDexie + migratedFromLocalStorage };
}

async function migrateFromLegacyDexieDatabase(): Promise<number> {
  const notes = await readLegacyDexieNotes();
  const migrated = await migrateNotes(notes);

  if (notes.length > 0) {
    await deleteDatabase(LEGACY_DEXIE_DB_NAME);
  }

  return migrated;
}

async function migrateFromLegacyLocalStorage(): Promise<number> {
  const pendingEntries: Array<{ storageKey: string; note: Note }> = [];
  const keys = Object.keys(localStorage);

  for (const key of keys) {
    if (!key.startsWith("note:")) continue;

    const noteJSON = localStorage.getItem(key);
    if (noteJSON === null) continue;

    const note = tryParseNote(noteJSON);
    if (note === null) continue;

    pendingEntries.push({ storageKey: key, note });
  }

  const migrated = await migrateNotes(pendingEntries.map(({ note }) => note));

  for (const { storageKey } of pendingEntries) {
    localStorage.removeItem(storageKey);
  }

  return migrated;
}

async function migrateNotes(notes: Note[]): Promise<number> {
  const pendingEntries: [string, Note][] = [];

  for (const note of notes) {
    const existingNote = await get<Note>(note.id, notesStore);
    if (existingNote !== undefined) continue;

    pendingEntries.push([note.id, note]);
  }

  if (pendingEntries.length === 0) {
    return 0;
  }

  await setMany(pendingEntries, notesStore);
  return pendingEntries.length;
}

async function readLegacyDexieNotes(): Promise<Note[]> {
  const database = await openExistingDatabase(LEGACY_DEXIE_DB_NAME);
  if (database === null) return [];

  if (!database.objectStoreNames.contains(LEGACY_DEXIE_STORE_NAME)) {
    database.close();
    return [];
  }

  try {
    const notes = await new Promise<Note[]>((resolve, reject) => {
      const transaction = database.transaction(
        LEGACY_DEXIE_STORE_NAME,
        "readonly",
      );
      const store = transaction.objectStore(LEGACY_DEXIE_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const values = request.result.filter(isNote);
        resolve(values);
      };
      request.onerror = () => {
        reject(request.error ?? new Error("Failed to read legacy Dexie notes"));
      };
    });

    return notes;
  } finally {
    database.close();
  }
}

async function openExistingDatabase(name: string): Promise<IDBDatabase | null> {
  const request = indexedDB.open(name);

  return await new Promise<IDBDatabase | null>((resolve, reject) => {
    let created = false;

    request.onupgradeneeded = () => {
      created = true;
    };

    request.onsuccess = () => {
      const database = request.result;

      if (created) {
        database.close();
        void deleteDatabase(name);
        resolve(null);
        return;
      }

      if (database.name === NOTES_DB_NAME) {
        database.close();
        resolve(null);
        return;
      }

      resolve(database);
    };

    request.onerror = () => {
      reject(
        request.error ?? new Error(`Failed to open IndexedDB database ${name}`),
      );
    };
  });
}

async function deleteDatabase(name: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);

    request.onsuccess = () => resolve();
    request.onblocked = () => resolve();
    request.onerror = () => {
      reject(
        request.error ??
          new Error(`Failed to delete IndexedDB database ${name}`),
      );
    };
  });
}

function tryParseNote(noteJSON: string): Note | null {
  try {
    const parsed = JSON.parse(noteJSON);
    return isNote(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
