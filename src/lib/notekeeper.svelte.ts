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
  const activeNoteId = variables.local.get(ACTIVE_NOTE_ID_VARIABLE_NAME);
  if (activeNoteId) {
    return activeNoteId;
  }
  return null;
}

export function setActiveNoteId(id: string): void {
  variables.local.set({ name: ACTIVE_NOTE_ID_VARIABLE_NAME, value: id });
}

export function clearActiveNoteId(): void {
  variables.local.set({ name: ACTIVE_NOTE_ID_VARIABLE_NAME, value: "" });
}

class Notekeeper {
  private activeNoteId = $state<string | null>(null);
  public notes = $state<Note[]>([]);
  public activeNote = $derived<Note | null>(
    this.notes.find((n) => n.id === this.activeNoteId) ?? null,
  );
  public storageUsedBytes = $state<number>(0);

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    await this.runMigrations();
    await this.loadNotes();

    const ALERT_DISMISSED_NAME = "persistent-storage-alert-dismissed";

    if ((await requestPersistentStorage()) === true) {
      // cool, you may even log it
      // console.log("Persistent storage granted successfully.");
    } else {
      console.warn(
        "Persistent storage was not granted - using best-effort storage " +
          "allows browser evictions, which can result in data loss.",
      );
      if (variables.session.get(ALERT_DISMISSED_NAME) !== "true") {
        const event = new CustomEvent("persistentStorageDenied");
        document.dispatchEvent(event);
        variables.session.set({ name: ALERT_DISMISSED_NAME, value: "true" });
      }
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

  // Select a note by ID and persist the selection
  async selectNote(noteId: string): Promise<void> {
    const result = await getNote(noteId);
    if (!result.ok || result.value === null) return;

    this.activeNoteId = noteId;
    setActiveNoteId(noteId);
  }

  // Create a new note, save it, refresh the list, and select it
  async createNote(): Promise<string> {
    const note = newNote();
    await saveNote(note);
    await this.loadNotes();
    await this.selectNote(note.id);
    return note.id;
  }

  // Delete a note by ID
  async deleteNote(noteId: string): Promise<void> {
    await deleteNote(noteId);
    await this.loadNotes();

    // If the deleted note was active
    if (this.activeNoteId === noteId) {
      if (this.notes.length > 0) {
        // Select the first (most recently updated) note
        await this.selectNote(this.notes[0].id);
      } else {
        // No notes left, clear active
        this.activeNoteId = null;
        clearActiveNoteId();
      }
    }
  }

  // Update the active note's title or content and mark it as modified
  updateActiveNote(field: "title" | "content", value: string): void {
    const note = this.activeNote;
    if (note === null) return;

    note[field] = value;
    note.updatedAt = Date.now();
  }

  // Persist the active note to localStorage
  async saveActiveNote(): Promise<void> {
    const note = this.activeNote;
    if (note === null) return;

    // $state is a proxy which cannot be cloned,
    // so it must be turned into a plain object first
    const plainNote: Note = {
      id: note.id,
      title: note.title,
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
    const result = await saveNote(plainNote);
    if (!result.ok) {
      console.error("Failed to save note:", result.error);
      return;
    }

    const noteIndex = this.notes.findIndex((n) => n.id === plainNote.id);
    if (noteIndex !== -1) {
      this.notes[noteIndex] = plainNote;
      this.notes.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  }

  // Close the active note and clear it from the UI
  async closeActiveNote(): Promise<void> {
    await this.saveActiveNote();
    this.activeNoteId = null;
    clearActiveNoteId();
  }

  // Load all notes from localStorage and refresh the list
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
