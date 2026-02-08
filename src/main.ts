import "./style.css";
import type { Note } from "./types/note.ts";
import type { InputListenerCallback } from "./components/editor.ts";
import { Editor } from "./components/editor.ts";
import { Sidebar } from "./components/sidebar.ts";
import { StatusBar } from "./components/status-bar.ts";
import { noteStorage } from "./utils/note-storage.ts";
import { stats } from "./utils/stats.ts";

let notes: Note[] = [];
let activeNoteId: string | null = null;

let editor: Editor;
let statusBar: StatusBar;
let sidebar: Sidebar;

function getActiveNote(): Note | null {
  if (activeNoteId === null) return null;
  return notes.find((n) => n.id === activeNoteId) ?? null;
}

function selectNote(noteId: string): void {
  const note = noteStorage.getNote(noteId);
  if (note === null) return;

  activeNoteId = noteId;
  noteStorage.setActiveNoteId(noteId);

  statusBar.setStatusBarVisibility(true);
  statusBar.updateStats(stats.getTextStats(note.content));
  statusBar.updateDates(note.createdAt, note.updatedAt);
  sidebar.renderNoteList(notes, activeNoteId);

  editor.setEditorVisibility(true);
  editor.setContent("titleInput", note.title);
  editor.setContent("textarea", note.content);
  editor.resizeTextarea();
  editor.focus("textarea");
}

function newNote(): void {
  const note = noteStorage.newNote();
  noteStorage.saveNote(note);
  notes = noteStorage.getAllNotes();
  selectNote(note.id);
  editor.select("titleInput");
}

function deleteNote(noteId: string): void {
  noteStorage.deleteNote(noteId);
  notes = noteStorage.getAllNotes();

  if (activeNoteId === noteId) {
    if (notes.length > 0) {
      selectNote(notes[0].id);
    } else {
      activeNoteId = null;
      noteStorage.clearActiveNoteId();

      editor.setEditorVisibility(false);
      editor.setContent("titleInput", "");
      editor.setContent("textarea", "");

      statusBar.setStatusBarVisibility(false);
      statusBar.clearDates();
      sidebar.renderNoteList(notes);
    }
  } else {
    sidebar.renderNoteList(notes, activeNoteId!);
  }
}

function updateUICallback(
  target: "titleInput" | "textarea",
): InputListenerCallback {
  return (content: string) => {
    const note = getActiveNote();
    if (note === null) return;

    switch (target) {
      case "titleInput":
        note.title = content;
        break;
      case "textarea":
        note.content = content;
        break;
    }

    note.updatedAt = Date.now();

    statusBar.updateStats(stats.getTextStats(note.content));
    statusBar.updateDates(note.createdAt, note.updatedAt);
    sidebar.renderNoteList(notes, activeNoteId!);
  };
}

function saveNoteCallback(): void {
  const note = getActiveNote();
  if (note === null) return;

  noteStorage.saveNote(note);
}

function init(): void {
  editor = new Editor("editor");
  statusBar = new StatusBar("status-bar");
  sidebar = new Sidebar("sidebar", {
    onNoteSelect: selectNote,
    onNewNote: newNote,
    onDeleteNote: deleteNote,
  });

  (["titleInput", "textarea"] as const).forEach((target) => {
    editor.addInstantInputListener(target, updateUICallback(target));
    editor.addDebouncedInputListener(target, saveNoteCallback, 200);
  });

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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
