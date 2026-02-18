import type { Note } from "../types/note";
import type { TextStats } from "../types/stats";
import { noteStorage } from "../utils/noteStorage";
import { getTextStats } from "../utils/stats";

class Notekeeper {
  public noteState: {
    notes: Note[];
    activeNoteId: string | null;
  };
  activeNote: Note | null;

  constructor() {
    this.noteState = $state({
      notes: [] as Note[],
      activeNoteId: null as string | null,
    });

    this.loadNotes();
    const savedActiveNoteId = noteStorage.getActiveNoteId();

    if (savedActiveNoteId && noteStorage.getNote(savedActiveNoteId)) {
      this.selectNote(savedActiveNoteId);
    } else if (this.noteState.notes.length > 0) {
      this.selectNote(this.noteState.notes[0].id);
    }
    // else: no notes, activeNoteId stays null

    this.activeNote = $derived(
      this.noteState.notes.find((n) => n.id === this.noteState.activeNoteId) ??
        null,
    );
  }

  // Getter: the currently active note object
  getActiveNote() {
    return this.activeNote;
  }

  // Select a note by ID and persist the selection
  selectNote(noteId: string): void {
    const note = noteStorage.getNote(noteId);
    if (note === null) return;

    this.noteState.activeNoteId = noteId;
    noteStorage.setActiveNoteId(noteId);
  }

  // Create a new note, save it, refresh the list, and select it
  createNote(): string {
    const note = noteStorage.newNote();
    noteStorage.saveNote(note);
    this.loadNotes();
    this.selectNote(note.id);
    return note.id;
  }

  // Delete a note by ID
  deleteNote(noteId: string): void {
    noteStorage.deleteNote(noteId);
    this.loadNotes();

    // If the deleted note was active
    if (this.noteState.activeNoteId === noteId) {
      if (this.noteState.notes.length > 0) {
        // Select the first (most recently updated) note
        this.selectNote(this.noteState.notes[0].id);
      } else {
        // No notes left, clear active
        this.noteState.activeNoteId = null;
        noteStorage.clearActiveNoteId();
      }
    }
  }

  // Update the active note's title or content and mark it as modified
  updateActiveNote(field: "title" | "content", value: string): void {
    const note = this.getActiveNote();
    if (note === null) return;

    note[field] = value;
    note.updatedAt = Date.now();
  }

  // Persist the active note to localStorage
  saveActiveNote(): void {
    const note = this.getActiveNote();
    if (note === null) return;

    noteStorage.saveNote(note);
  }

  // Get stats for the active note (used by StatusBar)
  getActiveNoteStats(): TextStats {
    const note = this.getActiveNote();
    if (note === null) {
      return getTextStats("");
    }
    return getTextStats(note.content);
  }

  // Load all notes from localStorage and refresh the list
  private loadNotes(): void {
    const result = noteStorage.getAllNotes();
    if (!result.ok) {
      console.error("Failed to load notes:", result.error);
      return;
    }
    this.noteState.notes = result.value;
  }
}

export const notekeeper = new Notekeeper();
