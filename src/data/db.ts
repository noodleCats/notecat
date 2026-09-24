import { type DBSchema, openDB } from "idb";
import type { Note } from "@/shared/note";
import type { UUIDv4 } from "@/shared/uuid";

export const NOTES_DB_NAME = "NotecatStorage";
export const NOTES_STORE_NAME = "notes";

const DB_VERSION = 1;

export interface NotesDatabase extends DBSchema {
  [NOTES_STORE_NAME]: {
    key: UUIDv4;
    value: Note;
  };
}

export const db = await openDB<NotesDatabase>(NOTES_DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(NOTES_STORE_NAME))
      db.createObjectStore(NOTES_STORE_NAME);
  },
});
