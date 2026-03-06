import type { Note } from "../types/note";
import {
  getAllNotes,
  getNote,
  newNote,
  saveNote,
  deleteNote,
  getStorageUsedBytes,
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
    this.loadNotes();
    const savedActiveNoteId = getActiveNoteId();

    if (savedActiveNoteId) {
      getNote(savedActiveNoteId).then((result) => {
        if (result.ok && result.value) {
          this.selectNote(savedActiveNoteId);
        }
      });
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

    await saveNote(note);
  }

  // Close the active note and clear it from the UI
  async closeActiveNote(): Promise<void> {
    await this.saveActiveNote();
    this.activeNoteId = null;
    clearActiveNoteId();
  }

  // Load all notes from localStorage and refresh the list
  async loadNotes(): Promise<void> {
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
