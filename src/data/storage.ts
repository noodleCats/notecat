import { db, NOTES_STORE_NAME } from "./db";
import { notifyNotesChanged } from "./channel";
import { isNote, isNoteArray, type Note } from "@/shared/note";
import { type UUIDv4 } from "@/shared/uuid";
import { ResultAsync } from "neverthrow";

type PersistenceStatus = "granted" | "denied" | "unavailable";

export function requestPersistentStorage(): ResultAsync<
  PersistenceStatus,
  Error
> {
  return ResultAsync.fromThrowable(
    async () => {
      if (!navigator.storage || !navigator.storage.persist)
        return "unavailable";
      if (await navigator.storage.persisted()) return "granted";
      return (await navigator.storage.persist()) ? "granted" : "denied";
    },
    (error) => new Error(`Failed to request persistent storage: ${error}`),
  )();
}

export function getAllNotes(): ResultAsync<Note[], Error> {
  return ResultAsync.fromThrowable(
    async () => {
      const notes = (await db.getAll(NOTES_STORE_NAME)).toSorted(
        (left, right) => right.updatedAt - left.updatedAt,
      );
      if (!isNoteArray(notes))
        throw new Error("Note storage contains malformed notes");
      return notes;
    },
    (error) => new Error(`Failed to get all notes: ${error}`),
  )();
}

export function getNote(noteId: UUIDv4): ResultAsync<Note | null, Error> {
  return ResultAsync.fromThrowable(
    async () => {
      const note = await db.get(NOTES_STORE_NAME, noteId);
      if (!note) return null;
      if (!isNote(note)) throw new Error(`Requested note is malformed`);
      return note;
    },
    (error) => new Error(`Failed to get note: ${error}`),
  )();
}

export function saveNote(note: Note): ResultAsync<void, Error> {
  return ResultAsync.fromThrowable(
    async () => {
      await db.put(NOTES_STORE_NAME, note, note.id);
      notifyNotesChanged();
    },
    (error) => new Error(`Failed to save note: ${error}`),
  )();
}

export function deleteNote(noteId: UUIDv4): ResultAsync<void, Error> {
  return ResultAsync.fromThrowable(
    async () => {
      await db.delete(NOTES_STORE_NAME, noteId);
      notifyNotesChanged();
    },
    (error) => new Error(`Failed to delete note: ${error}`),
  )();
}

export function replaceAllNotes(notes: Note[]): ResultAsync<void, Error> {
  return ResultAsync.fromThrowable(
    async () => {
      const transaction = db.transaction(NOTES_STORE_NAME, "readwrite");
      await Promise.all([
        transaction.store.clear(),
        ...notes.map((note) => transaction.store.put(note, note.id)),
      ]);
      await transaction.done;
      notifyNotesChanged();
    },
    (error) => new Error(`Failed to replace all notes: ${error}`),
  )();
}
