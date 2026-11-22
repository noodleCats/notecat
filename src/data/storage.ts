import { db, NOTES_STORE_NAME } from "./db";
import { notifyNotesChanged } from "./channel";
import { isNote, isNoteArray, isTrashed, type Note } from "@/shared/note";
import { type Result, tryResult } from "@/shared/result";
import { type Timestamp } from "@/shared/timestamp";
import { type UUIDv4 } from "@/shared/uuid";

type PersistenceStatus = "granted" | "denied" | "unavailable";

export function requestPersistentStorage(): Promise<Result<PersistenceStatus>> {
  return tryResult(async () => {
    if (!navigator.storage || !navigator.storage.persist) return "unavailable";
    if (await navigator.storage.persisted()) return "granted";
    return (await navigator.storage.persist()) ? "granted" : "denied";
  });
}

export function getAllNotes(): Promise<Result<Note[]>> {
  return tryResult(async () => {
    const notes = (await db.getAll(NOTES_STORE_NAME)).toSorted(
      (left, right) => right.updatedAt - left.updatedAt,
    );
    if (!isNoteArray(notes))
      throw new Error("Note storage contains malformed notes");
    return notes;
  });
}

export function getNote(noteId: UUIDv4): Promise<Result<Note | null>> {
  return tryResult(async () => {
    const note = await db.get(NOTES_STORE_NAME, noteId);
    if (!note) return null;
    if (!isNote(note)) throw new Error(`Requested note is malformed`);
    return note;
  });
}

export function saveNote(note: Note): Promise<Result<void>> {
  return tryResult(async () => {
    await db.put(NOTES_STORE_NAME, note, note.id);
    notifyNotesChanged();
  });
}

/**
 * Reads a note and writes back `update(note)` in one transaction, so the
 * change applies to the stored copy rather than a stale in-memory one.
 * Skips the write if the note is gone or `update` returns null.
 * Resolves to whether the note was written.
 */
function updateStoredNote(
  noteId: UUIDv4,
  update: (note: Note) => Note | null,
): Promise<Result<boolean>> {
  return tryResult(async () => {
    const transaction = db.transaction(NOTES_STORE_NAME, "readwrite");
    const stored = await transaction.store.get(noteId);
    const updated = stored && isNote(stored) ? update(stored) : null;
    if (updated) await transaction.store.put(updated, noteId);
    await transaction.done;
    if (updated) notifyNotesChanged();
    return updated !== null;
  });
}

/** Moves a note to the trash, unless it's gone or already trashed */
export function trashStoredNote(
  noteId: UUIDv4,
  deletedAt: Timestamp,
): Promise<Result<boolean>> {
  return updateStoredNote(noteId, (note) =>
    isTrashed(note) ? null : { ...note, deletedAt },
  );
}

/**
 * Takes a note out of the trash, unless it's gone (e.g. deleted forever by
 * another tab) or no longer trashed
 */
export function restoreStoredNote(
  noteId: UUIDv4,
  updatedAt: Timestamp,
): Promise<Result<boolean>> {
  return updateStoredNote(noteId, (note) => {
    if (!isTrashed(note)) return null;
    const { deletedAt: _, ...restored } = note;
    return { ...restored, updatedAt };
  });
}

/**
 * Permanently deletes the given notes, skipping any that are no longer in
 * the trash (e.g. restored by another tab). The check and the delete share
 * one transaction, so a concurrent restore can't slip in between them.
 * Resolves to the number of notes deleted.
 */
export function deleteTrashedNotes(noteIds: UUIDv4[]): Promise<Result<number>> {
  return tryResult(async () => {
    const transaction = db.transaction(NOTES_STORE_NAME, "readwrite");
    const stored = await Promise.all(
      noteIds.map((noteId) => transaction.store.get(noteId)),
    );
    const trashedIds = noteIds.filter((_, index) => {
      const note = stored[index];
      return note !== undefined && isNote(note) && isTrashed(note);
    });
    await Promise.all(
      trashedIds.map((noteId) => transaction.store.delete(noteId)),
    );
    await transaction.done;
    if (trashedIds.length > 0) notifyNotesChanged();
    return trashedIds.length;
  });
}

export function replaceAllNotes(notes: Note[]): Promise<Result<void>> {
  return tryResult(async () => {
    const transaction = db.transaction(NOTES_STORE_NAME, "readwrite");
    await Promise.all([
      transaction.store.clear(),
      ...notes.map((note) => transaction.store.put(note, note.id)),
    ]);
    await transaction.done;
    notifyNotesChanged();
  });
}
