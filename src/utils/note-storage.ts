import type { Note } from "../types/note.ts";

class NoteStorage {
  private static readonly ACTIVE_NOTE_ID_STORAGE_KEY = "notecat:active-note-id";

  getActiveNoteId(): string | null {
    const activeNoteId = localStorage.getItem(
      NoteStorage.ACTIVE_NOTE_ID_STORAGE_KEY,
    );
    if (activeNoteId) {
      return activeNoteId;
    } else return null;
  }

  setActiveNoteId(id: string): void {
    localStorage.setItem(NoteStorage.ACTIVE_NOTE_ID_STORAGE_KEY, id);
  }

  clearActiveNoteId(): void {
    localStorage.setItem(NoteStorage.ACTIVE_NOTE_ID_STORAGE_KEY, "");
  }

  getAllNotes(): Note[] {
    let notes: Note[] = [];

    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (!key.startsWith("note:")) continue;

      const noteJSON = localStorage.getItem(key)!;
      const note = JSON.parse(noteJSON);
      if (!this.isNote(note)) {
        throw new Error(
          `getAllNotes: non-Note object found in localStorage at key ${key}`,
        );
      } else {
        notes.push(note);
      }
    }

    return notes.toSorted((a, b) => b.updatedAt - a.updatedAt);
  }

  getNote(id: string): Note | null {
    const noteJSON = localStorage.getItem(`note:${id}`);
    if (noteJSON === null) return null;

    const note = JSON.parse(noteJSON);
    if (!this.isNote(note)) {
      throw new Error(
        `getNote: non-Note object found in localStorage at key note:${id}`,
      );
    } else {
      return note;
    }
  }

  newNote(title?: string): Note {
    const now = Date.now();
    return {
      id: crypto.randomUUID(),
      title: title ?? "Untitled",
      content: "",
      createdAt: now,
      updatedAt: now,
    };
  }

  saveNote(note: Note): void {
    const storageKey = `note:${note.id}`;

    try {
      localStorage.setItem(storageKey, JSON.stringify(note));
    } catch (e) {
      if (e instanceof DOMException && e.name === "QuotaExceededError") {
        throw new Error("saveNote: storage is full", { cause: e });
      } else throw e;
    }
  }

  deleteNote(id: string): void {
    const noteToDelete = localStorage.getItem(`note:${id}`);
    if (noteToDelete === null)
      throw new Error(`deleteNote: note with ID ${id} not found`);

    localStorage.removeItem(`note:${id}`);
  }

  getStorageUsedBytes(): number {
    let totalSize = 0;
    for (const [key, value] of Object.entries(localStorage)) {
      if (key.startsWith("note:")) {
        totalSize += new Blob([key, value]).size;
      }
    }
    return totalSize;
  }

  private isNote(object: unknown): object is Note {
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
}

export const noteStorage = new NoteStorage();
