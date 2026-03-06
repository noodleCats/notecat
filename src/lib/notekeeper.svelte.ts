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
  public storageUsedBytes = $derived.by(() => {
    void this.notes;
    return getStorageUsedBytes();
  });

  constructor() {
    this.loadNotes();
    const savedActiveNoteId = getActiveNoteId();

    if (savedActiveNoteId && getNote(savedActiveNoteId)) {
      this.selectNote(savedActiveNoteId);
    }
    // else: no notes, activeNoteId stays null
  }

  // Select a note by ID and persist the selection
  selectNote(noteId: string): void {
    const note = getNote(noteId);
    if (note === null) return;

    this.activeNoteId = noteId;
    setActiveNoteId(noteId);
  }

  // Create a new note, save it, refresh the list, and select it
  createNote(): string {
    const note = newNote();
    saveNote(note);
    this.loadNotes();
    this.selectNote(note.id);
    return note.id;
  }

  // Delete a note by ID
  deleteNote(noteId: string): void {
    deleteNote(noteId);
    this.loadNotes();

    // If the deleted note was active
    if (this.activeNoteId === noteId) {
      if (this.notes.length > 0) {
        // Select the first (most recently updated) note
        this.selectNote(this.notes[0].id);
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
  saveActiveNote(): void {
    const note = this.activeNote;
    if (note === null) return;

    saveNote(note);
  }

  // Close the active note and clear it from the UI
  closeActiveNote(): void {
    this.saveActiveNote();
    this.activeNoteId = null;
    clearActiveNoteId();
  }

  // Load all notes from localStorage and refresh the list
  private loadNotes(): void {
    const result = getAllNotes();
    if (!result.ok) {
      console.error("Failed to load notes:", result.error);
      return;
    }
    this.notes = result.value!;
  }
}

const notekeeper = new Notekeeper();
export default notekeeper;
