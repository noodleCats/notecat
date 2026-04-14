import variables from "./variables";
import db from "./db";
import { isNote } from "./storage";

const MIGRATION_NAME = "migrated";

export async function runMigrations(): Promise<{ migrated: number } | null> {
  if (variables.local.get(MIGRATION_NAME) === "true") {
    return null;
  }

  const result = await migrateFromLocalStorage();
  variables.local.set({ name: MIGRATION_NAME, value: "true" });
  return result;
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
