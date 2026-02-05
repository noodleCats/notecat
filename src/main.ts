import "./style.css";
import type { Note } from "./types/types.ts";
import { NoteStorage } from "./utils/noteStorage.ts";

/** Note storage instance */
const storage = new NoteStorage();
import { calculateTextStats } from "./utils/textStats.ts";
import {
  initStatusBar,
  updateStatusBar,
  setStatusBarVisible,
} from "./components/statusBar.ts";
import {
  initEditor,
  setEditorContent,
  getEditorContent,
  onEditorInput,
  onEditorInputInstant,
  autoResize,
  focusEditor,
  setEditorVisible,
} from "./components/editor.ts";
import {
  initSidebar,
  renderNoteList,
  setOnNoteSelect,
  setOnNewNote,
  setOnDeleteNote,
} from "./components/sidebar.ts";

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
  const note = storage.getNote(noteId);
  if (!note) return;

  activeNoteId = noteId;
  storage.setActiveNoteId(noteId);
  setEditorVisible(true);
  setStatusBarVisible(true);
  setEditorContent(note.content);
  refreshStatusBar();
  refreshSidebar();
  focusEditor();
}

/** Handle editor input - instant updates (title, stats, sidebar) */
function handleInstantUpdate(content: string): void {
  const note = getActiveNote();
  if (!note) return;

  note.content = content;

  // Update title from first line if content exists
  const firstLine = content.split("\n")[0].trim();
  note.title = firstLine.slice(0, 50) || "Untitled";

  // Refresh sidebar and status bar immediately using in-memory notes
  refreshSidebar();
  refreshStatusBar();
}

/** Handle editor input - debounced save to storage */
function handleDebouncedSave(content: string): void {
  const note = getActiveNote();
  if (!note) return;

  note.content = content;
  note.updatedAt = Date.now();

  // Update title from first line if content exists
  const firstLine = content.split("\n")[0].trim();
  note.title = firstLine.slice(0, 50) || "Untitled";

  storage.saveNote(note);

  // Refresh notes list to update order and title
  notes = storage.getAllNotes();
  refreshSidebar();
}

/** Create a new note and select it */
function handleNewNote(): void {
  const note = storage.newNote();
  storage.saveNote(note);
  notes = storage.getAllNotes();
  selectNote(note.id);
}

/** Delete a note */
function handleDeleteNote(noteId: string): void {
  storage.deleteNote(noteId);
  notes = storage.getAllNotes();

  // If we deleted the active note, select another one
  if (activeNoteId === noteId) {
    if (notes.length > 0) {
      selectNote(notes[0].id);
    } else {
      activeNoteId = null;
      storage.clearActiveNoteId();
      setEditorVisible(false);
      setStatusBarVisible(false);
      setEditorContent("");
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
  onEditorInputInstant(handleInstantUpdate);
  onEditorInput(handleDebouncedSave, 300);

  // Load notes from storage
  notes = storage.getAllNotes();
  const activeNoteId = storage.getActiveNoteId();
  const noteToOpen = activeNoteId ? storage.getNote(activeNoteId) : null;

  // Select the last active or most recent note if available,
  // otherwise hide editor and status bar
  if (noteToOpen !== null) {
    selectNote(activeNoteId!);
  } else if (notes.length > 0) {
    selectNote(notes[0].id);
  } else {
    setEditorVisible(false);
    setStatusBarVisible(false);
    refreshSidebar();
  }

  autoResize();
}

// Start the app
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
