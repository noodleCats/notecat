import "./style.css";
import type { Note } from "./types/note.ts";
import { Editor } from "./components/editor.ts";
import { Sidebar } from "./components/sidebar.ts";
import { StatusBar } from "./components/status-bar.ts";
import { noteStorage } from "./utils/note-storage.ts";
import { stats } from "./utils/stats.ts";

let notes: Note[] = [];
let activeNoteId: string | null = null;

function getActiveNote(): Note | null {
  if (activeNoteId === null) return null;
  return notes.find((n) => n.id === activeNoteId) ?? null;
}

function init(): void {
  const editor = new Editor("editor");
  const statusBar = new StatusBar("status-bar");

  const selectNote = (noteId: string) => {
    const note = noteStorage.getNote(noteId);
    if (note === null) return;

    activeNoteId = noteId;
    noteStorage.setActiveNoteId(noteId);

    editor.setEditorVisibility(true);
    editor.setTitleInputContent(note.title);
    editor.setTextareaContent(note.content);
    editor.focus("textarea");

    statusBar.setStatusBarVisibility(true);
    statusBar.updateStats(stats.getTextStats(note.content));
    statusBar.updateDates(note.createdAt, note.updatedAt);
    sidebar.renderNoteList(notes, activeNoteId);
  };

  const newNote = () => {
    const note = noteStorage.newNote();
    noteStorage.saveNote(note);
    notes = noteStorage.getAllNotes();
    selectNote(note.id);
  };

  const deleteNote = (noteId: string) => {
    noteStorage.deleteNote(noteId);
    notes = noteStorage.getAllNotes();

    if (activeNoteId === noteId) {
      if (notes.length > 0) {
        selectNote(notes[0].id);
      } else {
        activeNoteId = null;
        noteStorage.clearActiveNoteId();

        editor.setEditorVisibility(false);
        editor.setTitleInputContent("");
        editor.setTextareaContent("");

        statusBar.setStatusBarVisibility(false);
        statusBar.clearDates();
        sidebar.renderNoteList(notes);
      }
    } else {
      sidebar.renderNoteList(notes, activeNoteId!);
    }
  };

  const sidebar = new Sidebar("sidebar", {
    onNoteSelect: selectNote,
    onNewNote: newNote,
    onDeleteNote: deleteNote,
  });

  editor.addInstantInputListener("titleInput", (title: string) => {
    const note = getActiveNote();
    if (note === null) return;

    note.title = title;
    note.updatedAt = Date.now();

    statusBar.updateStats(stats.getTextStats(note.content));
    statusBar.updateDates(note.createdAt, note.updatedAt);
    sidebar.renderNoteList(notes, activeNoteId!);
  });

  editor.addInstantInputListener("textarea", (content: string) => {
    const note = getActiveNote();
    if (note === null) return;

    note.content = content;
    note.updatedAt = Date.now();

    statusBar.updateStats(stats.getTextStats(note.content));
    statusBar.updateDates(note.createdAt, note.updatedAt);
    sidebar.renderNoteList(notes, activeNoteId!);
  });

  const saveNoteCallback = () => {
    const note = getActiveNote();
    if (note === null) return;

    noteStorage.saveNote(note);
  };

  (["titleInput", "textarea"] as const).forEach((target) =>
    editor.addDebouncedInputListener(target, saveNoteCallback),
  );

  notes = noteStorage.getAllNotes();
  activeNoteId = noteStorage.getActiveNoteId();

  const noteToOpen = activeNoteId ? noteStorage.getNote(activeNoteId) : null;
  if (noteToOpen !== null) {
    selectNote(activeNoteId!);
  } else if (notes.length > 0) {
    selectNote(notes[0].id);
  } else {
    editor.setEditorVisibility(false);
    statusBar.setStatusBarVisibility(false);
    statusBar.clearDates();
    sidebar.renderNoteList(notes);
  }

  editor.resizeTextarea();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
