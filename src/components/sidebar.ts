import notecatLogo from "/notecat.svg";
import type { Note } from "../types/note.ts";
import { formatting } from "../utils/formatting.ts";

export type NoteSelectCallback = (noteId: string) => void;
export type NewNoteCallback = () => void;
export type DeleteNoteCallback = (noteId: string) => void;

export class Sidebar {
  private noteListElement: HTMLElement;
  private newNoteButton: HTMLButtonElement;
  private onNoteSelect: NoteSelectCallback;
  private onNewNote: NewNoteCallback;
  private onDeleteNote: DeleteNoteCallback;

  constructor(
    containerElementId: string,
    callbacks: {
      onNoteSelect: NoteSelectCallback;
      onNewNote: NewNoteCallback;
      onDeleteNote: DeleteNoteCallback;
    },
  ) {
    const container = document.getElementById(containerElementId);
    if (
      !(container instanceof HTMLElement) ||
      container.localName !== "aside"
    ) {
      throw new Error("Sidebar: container is not an aside element");
    }

    container.innerHTML = `
      <header id="sidebar-header">
        <img src="${notecatLogo}" alt="Notecat logo" width="28" height="24" />
        <h1>Notecat</h1>
      </header>
      <button id="new-note-button" type="button">+ New Note</button>
      <nav id="note-list"></nav>
    `;

    this.noteListElement = container.querySelector("#note-list") as HTMLElement;
    this.newNoteButton = container.querySelector(
      "#new-note-button",
    ) as HTMLButtonElement;

    this.onNoteSelect = callbacks.onNoteSelect;
    this.onNewNote = callbacks.onNewNote;
    this.onDeleteNote = callbacks.onDeleteNote;

    this.newNoteButton.addEventListener("click", () => {
      this.onNewNote();
    });
  }

  renderNoteList(notes: Note[], activeNoteId?: string): void {
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

  private createNoteItem(note: Note, isActive: boolean): HTMLElement {
    const item = document.createElement("div");
    item.dataset.noteId = note.id;
    item.classList.add("note-item");
    if (isActive) {
      item.classList.add("active");
    }

    item.innerHTML = `
      <p class="note-item-title">
        ${note.title || "Untitled"}
      </p>
      <p class="note-item-date">
        ${formatting.time.formatDate(note.updatedAt)}
      </p>
    `;

    item.addEventListener("click", () => {
      this.onNoteSelect(note.id);
    });

    item.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      if (confirm(`Delete "${note.title || "Untitled"}"?`)) {
        this.onDeleteNote(note.id);
      }
    });

    return item;
  }
}
