import type { Note } from '../types.ts';

const STORAGE_KEY = 'notecat_notes';

/** Retrieve all notes from localStorage */
export function getAllNotes(): Note[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];

  try {
    const notes = JSON.parse(data) as Note[];
    // Sort by updatedAt descending (most recent first)
    return notes.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    console.error('Failed to parse notes from localStorage');
    return [];
  }
}

/** Get a single note by ID */
export function getNote(id: string): Note | null {
  const notes = getAllNotes();
  return notes.find((note) => note.id === id) ?? null;
}

/** Save or update a note */
export function saveNote(note: Note): void {
  const notes = getAllNotes();
  const existingIndex = notes.findIndex((n) => n.id === note.id);

  if (existingIndex >= 0) {
    notes[existingIndex] = note;
  } else {
    notes.push(note);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
      throw new Error('Storage is full. Please delete some notes.');
    }
    throw e;
  }
}

/** Delete a note by ID */
export function deleteNote(id: string): void {
  const notes = getAllNotes();
  const filtered = notes.filter((note) => note.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/** Create a new note with default values */
export function createNote(title?: string): Note {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: title ?? 'Untitled',
    content: '',
    createdAt: now,
    updatedAt: now,
  };
}

/** Get the total storage used by notes in bytes */
export function getStorageUsedBytes(): number {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? new Blob([data]).size : 0;
}
