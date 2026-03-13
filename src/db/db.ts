import Dexie from "dexie";
import type { EntityTable } from "dexie";
import type { Note } from "../types/note";

const db = new Dexie("NoteDB") as Dexie & {
  notes: EntityTable<Note, "id">;
};

db.version(1).stores({
  notes: "id, title, createdAt, updatedAt",
});

export default db;
