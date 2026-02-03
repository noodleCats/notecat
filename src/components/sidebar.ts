import type { Note } from '../types.ts';

/** Callback types for sidebar events */
export type NoteSelectCallback = (noteId: string) => void;
export type NewNoteCallback = () => void;
export type DeleteNoteCallback = (noteId: string) => void;

/** DOM element references */
let noteListElement: HTMLElement | null = null;
let newNoteButton: HTMLButtonElement | null = null;

/** Event callbacks */
let onNoteSelect: NoteSelectCallback | null = null;
let onNewNote: NewNoteCallback | null = null;
let onDeleteNote: DeleteNoteCallback | null = null;

/** Initialize sidebar elements */
export function initSidebar(): void {
  noteListElement = document.getElementById('note-list');
  const btn = document.getElementById('new-note-btn');

  if (!noteListElement) {
    throw new Error('Note list element not found');
  }

  if (!(btn instanceof HTMLButtonElement)) {
    throw new Error('New note button not found');
  }

  newNoteButton = btn;
  newNoteButton.addEventListener('click', () => {
    onNewNote?.();
  });
}

/** Set callback for note selection */
export function setOnNoteSelect(callback: NoteSelectCallback): void {
  onNoteSelect = callback;
}

/** Set callback for new note creation */
export function setOnNewNote(callback: NewNoteCallback): void {
  onNewNote = callback;
}

/** Set callback for note deletion */
export function setOnDeleteNote(callback: DeleteNoteCallback): void {
  onDeleteNote = callback;
}

/** Format a timestamp for display */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/** Create a note list item element */
function createNoteItem(note: Note, isActive: boolean): HTMLElement {
  const item = document.createElement('div');
  item.className = `note-item${isActive ? ' active' : ''}`;
  item.dataset.noteId = note.id;

  const title = document.createElement('p');
  title.className = 'note-item-title';
  title.textContent = note.title || 'Untitled';

  const date = document.createElement('p');
  date.className = 'note-item-date';
  date.textContent = formatDate(note.updatedAt);

  item.appendChild(title);
  item.appendChild(date);

  item.addEventListener('click', () => {
    onNoteSelect?.(note.id);
  });

  // Right-click to delete
  item.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (confirm(`Delete "${note.title || 'Untitled'}"?`)) {
      onDeleteNote?.(note.id);
    }
  });

  return item;
}

/** Render the note list */
export function renderNoteList(notes: Note[], activeNoteId: string | null): void {
  if (!noteListElement) {
    throw new Error('Sidebar not initialized');
  }

  noteListElement.innerHTML = '';

  if (notes.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'note-item-date';
    empty.style.padding = '0.75rem';
    empty.textContent = 'No notes yet';
    noteListElement.appendChild(empty);
    return;
  }

  for (const note of notes) {
    const item = createNoteItem(note, note.id === activeNoteId);
    noteListElement.appendChild(item);
  }
}
