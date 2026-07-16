import type { Note } from "../types/note";
import {
  getAllNotes,
  getNote,
  newNote,
  deleteNote,
  getStorageUsedBytes,
  replaceAllNotes,
  requestPersistentStorage,
  saveNote,
} from "../data/storage";
import variables from "../data/variables";

const ACTIVE_NOTE_ID_VARIABLE_NAME = "active-note-id";

class Notekeeper {
  private static instance: Notekeeper | null = null;
  private static initPromise: Promise<Notekeeper> | null = null;

  private _activeNoteId = $state<string | null>(null);

  private saveTimeoutFastId: number | undefined;
  private saveTimeoutSlowId: number | undefined;
  private saveInFlight: Promise<void> | null = null;
  private saveQueued = false;
  private activeNoteEditRevision = 0;
  private selectionRequestId = 0;

  public notes = $state<Note[]>([]);
  public activeNote = $derived<Note | null>(
    this.notes.find((n) => n.id === this.activeNoteId) ?? null,
  );
  public unsavedEditsPresent = $state(false);
  public storageUsedBytes = $state<number>(0);

  private constructor() {}

  private static getSavedActiveNoteId(): string | null {
    return variables.local.get(ACTIVE_NOTE_ID_VARIABLE_NAME);
  }

  private get activeNoteId(): string | null {
    return this._activeNoteId;
  }

  private set activeNoteId(noteId: string | null) {
    this._activeNoteId = noteId;
    variables.local.set({ name: ACTIVE_NOTE_ID_VARIABLE_NAME, value: noteId });
  }

  private static async init(): Promise<Notekeeper> {
    const instance = new Notekeeper();

    await instance.loadNotes();

    if ((await requestPersistentStorage()) === false) {
      console.warn(
        "Persistent storage was not granted - using best-effort storage " +
          "allows browser evictions, which can result in data loss.",
      );
    }

    const savedActiveNoteId = Notekeeper.getSavedActiveNoteId();

    if (savedActiveNoteId !== null) {
      const result = await getNote(savedActiveNoteId);
      if (result.ok && result.value) {
        await instance.selectNote(savedActiveNoteId);
      }
    }

    window.addEventListener("beforeunload", (event) => {
      if (instance.unsavedEditsPresent) event.preventDefault();
    });

    return instance;
  }

  static async getInstance(): Promise<Notekeeper> {
    if (this.instance) return Promise.resolve(this.instance);

    if (!this.initPromise) {
      this.initPromise = this.init().then((instance) => {
        this.instance = instance;
        return instance;
      });
    }

    return this.initPromise;
  }

  async createNote(): Promise<string> {
    const note = newNote();
    await saveNote(note);
    await this.loadNotes();
    await this.selectNote(note.id);
    return note.id;
  }

  async deleteNote(noteId: string): Promise<void> {
    if (this.activeNoteId === noteId) {
      await this.eagerSave();
    }

    await deleteNote(noteId);
    await this.loadNotes();

    if (this.activeNoteId === noteId) {
      this.activeNoteId = null;
      this.unsavedEditsPresent = false;
      this.activeNoteEditRevision = 0;
    }
  }

  async importNotes(notes: Note[]): Promise<void> {
    const importedNotes = notes.map((note) => ({ ...note }));

    await this.eagerSave();

    const previousActiveNoteId = this.activeNoteId;
    const result = await replaceAllNotes(importedNotes);
    if (!result.ok) {
      return;
    }

    await this.loadNotes();

    const nextActiveNoteId =
      (previousActiveNoteId !== null &&
      this.notes.some((note) => note.id === previousActiveNoteId)
        ? previousActiveNoteId
        : this.notes[0]?.id) ?? null;

    if (nextActiveNoteId === null) {
      this.selectionRequestId++;
      this.activeNoteId = null;
      this.unsavedEditsPresent = false;
      this.activeNoteEditRevision = 0;
      return;
    }

    await this.selectNote(nextActiveNoteId);
  }

  updateActiveNote(field: "title" | "content", value: string): void {
    const note = this.activeNote;
    if (note === null) return;

    note[field] = value;
    note.updatedAt = Date.now();

    const noteIndex = this.notes.findIndex((n) => n.id === note.id);
    if (noteIndex === -1) return;

    if (noteIndex !== 0) {
      this.notes.splice(noteIndex, 1);
      this.notes.unshift(note);
    }

    this.activeNoteEditRevision++;
    this.unsavedEditsPresent = true;
    this.debouncedSave();
  }

  async saveActiveNote(): Promise<void> {
    this.clearPendingSaveTimers();

    if (this.activeNote === null) return;

    if (this.saveInFlight !== null) {
      this.saveQueued = true;

      while (this.saveInFlight !== null) {
        await this.saveInFlight;
      }

      return;
    }

    do {
      const note = this.activeNote;
      if (note === null) return;

      this.saveQueued = false;

      const noteId = note.id;
      const savedRevision = this.activeNoteEditRevision;
      // $state is a proxy which cannot be cloned,
      // so it must be turned into a plain object first
      const unproxiedNote: Note = { ...note };

      this.saveInFlight = (async () => {
        const result = await saveNote(unproxiedNote);
        if (!result.ok) {
          console.error("Failed to save note:", result.error);
          return;
        }

        if (
          this.activeNote?.id === noteId &&
          this.activeNoteEditRevision === savedRevision
        ) {
          this.unsavedEditsPresent = false;
        }
      })();

      await this.saveInFlight;
      this.saveInFlight = null;
    } while (this.saveQueued);
  }

  async closeActiveNote(): Promise<void> {
    await this.eagerSave();
    this.selectionRequestId++;
    this.activeNoteId = null;
    this.unsavedEditsPresent = false;
    this.activeNoteEditRevision = 0;
  }

  private clearPendingSaveTimers() {
    clearTimeout(this.saveTimeoutFastId);
    clearTimeout(this.saveTimeoutSlowId);
    this.saveTimeoutFastId = undefined;
    this.saveTimeoutSlowId = undefined;
  }

  private debouncedSave() {
    if (this.saveTimeoutFastId !== undefined) {
      clearTimeout(this.saveTimeoutFastId);
    }

    this.saveTimeoutFastId = setTimeout(() => {
      void this.saveActiveNote().catch((error) => {
        console.error("Failed to save note:", error);
      });
    }, 1000);

    this.saveTimeoutSlowId ??= setTimeout(() => {
      void this.saveActiveNote().catch((error) => {
        console.error("Failed to save note:", error);
      });
    }, 5000);
  }

  private async eagerSave() {
    if (this.unsavedEditsPresent) {
      await this.saveActiveNote();
    }
  }

  async selectNote(noteId: string): Promise<void> {
    await this.eagerSave();

    const requestId = ++this.selectionRequestId;
    const result = await getNote(noteId);
    if (requestId !== this.selectionRequestId) return;
    if (!result.ok || result.value === null) return;

    this.activeNoteId = noteId;
    this.unsavedEditsPresent = false;
    this.activeNoteEditRevision = 0;
  }

  private async loadNotes(): Promise<void> {
    const result = await getAllNotes();
    if (!result.ok) {
      console.error("Failed to load notes:", result.error);
      return;
    }
    this.notes = result.value!;

    this.storageUsedBytes = await getStorageUsedBytes();
  }
}

let notekeeper!: Notekeeper;
export async function init() {
  notekeeper = await Notekeeper.getInstance();
}

export { notekeeper };
