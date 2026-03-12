import type { Note } from "../types/note";
import {
  getAllNotes,
  getNote,
  newNote,
  saveNote,
  deleteNote,
  getStorageUsedBytes,
  runMigrations,
  requestPersistentStorage,
} from "../utils/storage";
import variables from "./variables.svelte";

const ACTIVE_NOTE_ID_VARIABLE_NAME = "active-note-id";

export function getActiveNoteId(): string | null {
  return variables.local.get(ACTIVE_NOTE_ID_VARIABLE_NAME);
}

export function setActiveNoteId(id: string): void {
  variables.local.set({ name: ACTIVE_NOTE_ID_VARIABLE_NAME, value: id });
}

export function clearActiveNoteId(): void {
  variables.local.set({ name: ACTIVE_NOTE_ID_VARIABLE_NAME, value: "" });
}

class Notekeeper {
  private activeNoteId = $state<string | null>(null);

  private saveTimeoutFastId: number | undefined;
  private saveTimeoutSlowId: number | undefined;
  private isSaving = false;

  public notes = $state<Note[]>([]);
  public activeNote = $derived<Note | null>(
    this.notes.find((n) => n.id === this.activeNoteId) ?? null,
  );
  public unsavedEditsPresent = $state(false);
  public storageUsedBytes = $state<number>(0);

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    await this.runMigrations();
    await this.loadNotes();

    if ((await requestPersistentStorage()) === false) {
      console.warn(
        "Persistent storage was not granted - using best-effort storage " +
          "allows browser evictions, which can result in data loss.",
      );
    }

    const savedActiveNoteId = getActiveNoteId();

    if (savedActiveNoteId) {
      getNote(savedActiveNoteId).then((result) => {
        if (result.ok && result.value) {
          this.selectNote(savedActiveNoteId);
        }
      });
    }
  }

  private async runMigrations(): Promise<void> {
    const result = await runMigrations();
    if (result && result.migrated > 0) {
      console.log(`Migrated ${result.migrated} notes from localStorage`);
    }
  }

  async selectNote(noteId: string): Promise<void> {
    const result = await getNote(noteId);
    if (!result.ok || result.value === null) return;

    this.activeNoteId = noteId;
    setActiveNoteId(noteId);
  }

  async createNote(): Promise<string> {
    const note = newNote();
    await saveNote(note);
    await this.loadNotes();
    await this.selectNote(note.id);
    return note.id;
  }

  async deleteNote(noteId: string): Promise<void> {
    await deleteNote(noteId);
    await this.loadNotes();

    if (this.activeNoteId === noteId) {
      if (this.notes.length > 0) {
        await this.selectNote(this.notes[0].id);
      } else {
        this.activeNoteId = null;
        clearActiveNoteId();
      }
    }
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

    this.unsavedEditsPresent = true;
    this.debouncedSave();
  }

  async saveActiveNote(): Promise<void> {
    if (this.isSaving || this.activeNote === null) return;
    this.isSaving = true;

    const note = this.activeNote;
    // $state is a proxy which cannot be cloned,
    // so it must be turned into a plain object first
    const unproxiedNote: Note = { ...note };
    const result = await saveNote(unproxiedNote);
    if (!result.ok) {
      console.error("Failed to save note:", result.error);
    }

    this.isSaving = false;
    this.unsavedEditsPresent = false;
  }

  async closeActiveNote(): Promise<void> {
    this.eagerSave();
    this.activeNoteId = null;
    clearActiveNoteId();
  }

  private debouncedSave() {
    if (this.saveTimeoutFastId !== undefined) {
      clearTimeout(this.saveTimeoutFastId);
    }

    this.saveTimeoutFastId = setTimeout(async () => {
      clearTimeout(this.saveTimeoutSlowId);
      this.saveTimeoutFastId = undefined;
      this.saveTimeoutSlowId = undefined;

      await this.saveActiveNote();
    }, 1000);

    this.saveTimeoutSlowId ??= setTimeout(async () => {
      clearTimeout(this.saveTimeoutFastId);
      this.saveTimeoutFastId = undefined;
      this.saveTimeoutSlowId = undefined;

      await this.saveActiveNote();
    }, 5000);
  }

  private async eagerSave() {
    if (
      this.saveTimeoutFastId !== undefined ||
      this.saveTimeoutSlowId !== undefined
    ) {
      clearTimeout(this.saveTimeoutFastId);
      clearTimeout(this.saveTimeoutSlowId);
      this.saveTimeoutFastId = undefined;
      this.saveTimeoutSlowId = undefined;
      await this.saveActiveNote();
    }
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

const notekeeper = new Notekeeper();
export default notekeeper;
