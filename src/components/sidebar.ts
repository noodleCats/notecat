import type { Note } from "../types/types.ts";

export type NoteSelectCallback = (noteId: string) => void;
export type NewNoteCallback = () => void;
export type DeleteNoteCallback = (noteId: string) => void;

export class Sidebar {
  private noteListElement: HTMLElement | null = null;
  private newNoteButton: HTMLButtonElement | null = null;
  private onNoteSelect: NoteSelectCallback | null = null;
  private onNewNote: NewNoteCallback | null = null;
  private onDeleteNote: DeleteNoteCallback | null = null;

  constructor() {
    this.noteListElement = document.getElementById("note-list");
    const btn = document.getElementById("new-note-btn");

    if (!this.noteListElement) {
      throw new Error("Note list element not found");
    }

    if (!(btn instanceof HTMLButtonElement)) {
      throw new Error("New note button not found");
    }

    this.newNoteButton = btn;
    this.newNoteButton.addEventListener("click", () => {
      this.onNewNote?.();
    });
  }

  setOnNoteSelect(callback: NoteSelectCallback): void {
    this.onNoteSelect = callback;
  }

  setOnNewNote(callback: NewNoteCallback): void {
    this.onNewNote = callback;
  }

  setOnDeleteNote(callback: DeleteNoteCallback): void {
    this.onDeleteNote = callback;
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
    }

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  private createNoteItem(note: Note, isActive: boolean): HTMLElement {
    const item = document.createElement("div");
    item.className = `note-item${isActive ? " active" : ""}`;
    item.dataset.noteId = note.id;

    const title = document.createElement("p");
    title.className = "note-item-title";
    title.textContent = note.title || "Untitled";

    const date = document.createElement("p");
    date.className = "note-item-date";
    date.textContent = this.formatDate(note.updatedAt);

    item.appendChild(title);
    item.appendChild(date);

    item.addEventListener("click", () => {
      this.onNoteSelect?.(note.id);
    });

    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (confirm(`Delete "${note.title || "Untitled"}"?`)) {
        this.onDeleteNote?.(note.id);
      }
    });

    return item;
  }

  renderNoteList(notes: Note[], activeNoteId: string | null): void {
    if (!this.noteListElement) {
      throw new Error("Sidebar not initialized");
    }

    this.noteListElement.innerHTML = "";

    if (notes.length === 0) {
      const empty = document.createElement("p");
      empty.className = "note-item-date";
      empty.style.padding = "0.75rem";
      empty.textContent = "No notes yet";
      this.noteListElement.appendChild(empty);
      return;
    }

    for (const note of notes) {
      const item = this.createNoteItem(note, note.id === activeNoteId);
      this.noteListElement.appendChild(item);
    }
  }
}
