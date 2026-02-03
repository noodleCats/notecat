import './style.css';
import type { Note } from './types.ts';
import {
  getAllNotes,
  getNote,
  saveNote,
  deleteNote,
  createNote,
} from './storage/noteStorage.ts';
import { calculateTextStats } from './utils/textStats.ts';
import { initStatusBar, updateStatusBar } from './components/statusBar.ts';
import {
  initEditor,
  setEditorContent,
  getEditorContent,
  onEditorInput,
  autoResize,
  focusEditor,
} from './components/editor.ts';
import {
  initSidebar,
  renderNoteList,
  setOnNoteSelect,
  setOnNewNote,
  setOnDeleteNote,
} from './components/sidebar.ts';

/** Current application state */
let notes: Note[] = [];
let activeNoteId: string | null = null;

/** Get the currently active note */
function getActiveNote(): Note | null {
  if (!activeNoteId) return null;
  return notes.find((n) => n.id === activeNoteId) ?? null;
}

/** Update the status bar with current editor content */
function refreshStatusBar(): void {
  const content = getEditorContent();
  const stats = calculateTextStats(content);
  updateStatusBar(stats);
}

/** Refresh the sidebar note list */
function refreshSidebar(): void {
  renderNoteList(notes, activeNoteId);
}

/** Select a note and load it into the editor */
function selectNote(noteId: string): void {
  const note = getNote(noteId);
  if (!note) return;

  activeNoteId = noteId;
  setEditorContent(note.content);
  refreshStatusBar();
  refreshSidebar();
  focusEditor();
}

/** Handle editor input - save the current note */
function handleEditorInput(content: string): void {
  const note = getActiveNote();
  if (!note) return;

  note.content = content;
  note.updatedAt = Date.now();

  // Update title from first line if content exists
  const firstLine = content.split('\n')[0].trim();
  note.title = firstLine.slice(0, 50) || 'Untitled';

  saveNote(note);

  // Refresh notes list to update order and title
  notes = getAllNotes();
  refreshSidebar();
  refreshStatusBar();
}

/** Create a new note and select it */
function handleNewNote(): void {
  const note = createNote();
  saveNote(note);
  notes = getAllNotes();
  selectNote(note.id);
}

/** Delete a note */
function handleDeleteNote(noteId: string): void {
  deleteNote(noteId);
  notes = getAllNotes();

  // If we deleted the active note, select another one
  if (activeNoteId === noteId) {
    if (notes.length > 0) {
      selectNote(notes[0].id);
    } else {
      activeNoteId = null;
      setEditorContent('');
      refreshStatusBar();
      refreshSidebar();
    }
  } else {
    refreshSidebar();
  }
}

/** Initialize the application */
function init(): void {
  // Initialize components
  initEditor();
  initStatusBar();
  initSidebar();

  // Set up event handlers
  setOnNoteSelect(selectNote);
  setOnNewNote(handleNewNote);
  setOnDeleteNote(handleDeleteNote);
  onEditorInput(handleEditorInput, 300);

  // Load notes from storage
  notes = getAllNotes();

  // Select the most recent note or create a new one
  if (notes.length > 0) {
    selectNote(notes[0].id);
  } else {
    handleNewNote();
  }

  autoResize();
}

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
