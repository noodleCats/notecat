import { type Note } from '../types/note.ts';
import { noteStorage } from '../utils/note-storage.ts';
import { stats } from '../utils/stats.ts';

// Wrap state in an object so we can mutate properties without reassigning the export
export const noteState = $state({
  notes: [] as Note[],
  activeNoteId: null as string | null,
});

// Getter: the currently active note object
export function getActiveNote() {
  return noteState.notes.find(n => n.id === noteState.activeNoteId) ?? null;
}

// Load all notes from localStorage and refresh the list
export function loadNotes(): void {
  noteState.notes = noteStorage.getAllNotes();
}

// Select a note by ID and persist the selection
export function selectNote(noteId: string): void {
  const note = noteStorage.getNote(noteId);
  if (note === null) return;

  noteState.activeNoteId = noteId;
  noteStorage.setActiveNoteId(noteId);
}

// Create a new note, save it, refresh the list, and select it
export function createNote(): string {
  const note = noteStorage.newNote();
  noteStorage.saveNote(note);
  loadNotes();
  selectNote(note.id);
  return note.id;
}

// Delete a note by ID
export function deleteNote(noteId: string): void {
  noteStorage.deleteNote(noteId);
  loadNotes();

  // If the deleted note was active
  if (noteState.activeNoteId === noteId) {
    if (noteState.notes.length > 0) {
      // Select the first (most recently updated) note
      selectNote(noteState.notes[0].id);
    } else {
      // No notes left, clear active
      noteState.activeNoteId = null;
      noteStorage.clearActiveNoteId();
    }
  }
}

// Update the active note's title or content and mark it as modified
export function updateActiveNote(
  field: 'title' | 'content',
  value: string,
): void {
  const note = getActiveNote();
  if (note === null) return;

  note[field] = value;
  note.updatedAt = Date.now();
}

// Persist the active note to localStorage
export function saveActiveNote(): void {
  const note = getActiveNote();
  if (note === null) return;

  noteStorage.saveNote(note);
}

// Get stats for the active note (used by StatusBar)
export function getActiveNoteStats() {
  const note = getActiveNote();
  if (note === null) {
    return stats.getTextStats('');
  }
  return stats.getTextStats(note.content);
}

// Initialize: load notes and restore the previously active note
export function initializeNotes(): void {
  loadNotes();
  const savedActiveNoteId = noteStorage.getActiveNoteId();
  
  if (savedActiveNoteId && noteStorage.getNote(savedActiveNoteId)) {
    selectNote(savedActiveNoteId);
  } else if (noteState.notes.length > 0) {
    selectNote(noteState.notes[0].id);
  }
  // else: no notes, activeNoteId stays null
}
