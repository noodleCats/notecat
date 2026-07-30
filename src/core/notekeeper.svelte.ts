import type { Note } from "../types/note";
import {
  deleteNote,
  getAllNotes,
  getNote,
  getStorageUsedBytes,
  newNote,
  replaceAllNotes,
  requestPersistentStorage,
  saveNote,
} from "../data/storage";
import variables from "../data/variables";

const ACTIVE_NOTE_ID = "active-note-id";
const SAVE_DEBOUNCE_DELAY_MS = 1_000;
const MAX_SAVE_DEBOUNCE_DELAY_MS = 5_000;

type EditableField = "title" | "content";

class Notekeeper {
  private static instance: Notekeeper | undefined;
  private static initialization: Promise<Notekeeper> | undefined;

  private selectedNoteId = $state<string | null>(null);
  private editRevision = 0;
  private saveInProgress: Promise<void> | undefined;
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  private maxSaveTimer: ReturnType<typeof setTimeout> | undefined;
  private selectionVersion = 0;

  public notes = $state<Note[]>([]);
  public activeNote = $derived(
    this.notes.find((note) => note.id === this.selectedNoteId) ?? null,
  );
  public unsavedEditsPresent = $state(false);
  public storageUsedBytes = $state(0);

  private constructor() {}

  static async getInstance(): Promise<Notekeeper> {
    if (this.instance) return this.instance;

    this.initialization ??= this.create().catch((error) => {
      this.initialization = undefined;
      throw error;
    });

    return this.initialization;
  }

  private static async create(): Promise<Notekeeper> {
    const notekeeper = new Notekeeper();
    await notekeeper.refreshNotes();
    notekeeper.restoreSelection();

    if (!(await requestPersistentStorage())) {
      console.warn(
        "Persistent storage was not granted; browser eviction may result in data loss.",
      );
    }

    window.addEventListener("beforeunload", (event) => {
      if (notekeeper.unsavedEditsPresent) event.preventDefault();
    });

    this.instance = notekeeper;
    return notekeeper;
  }

  async createNote(): Promise<string> {
    const note = newNote();
    const result = await saveNote(note);
    if (!result.ok) {
      console.error("Failed to create note:", result.error);
      throw result.error;
    }

    await this.refreshNotes();
    this.selectLoadedNote(note.id);
    return note.id;
  }

  async deleteNote(noteId: string): Promise<void> {
    if (this.selectedNoteId === noteId) await this.flushEdits();

    const result = await deleteNote(noteId);
    if (!result.ok) {
      console.error("Failed to delete note:", result.error);
      return;
    }

    await this.refreshNotes();
    if (this.selectedNoteId === noteId) this.clearSelection();
  }

  async importNotes(notes: Note[]): Promise<void> {
    await this.flushEdits();

    const result = await replaceAllNotes(notes.map((note) => ({ ...note })));
    if (!result.ok) {
      console.error("Failed to import notes:", result.error);
      return;
    }

    await this.refreshNotes();
    this.clearSelection();
  }

  updateActiveNote(field: EditableField, value: string): void {
    const note = this.activeNote;
    if (!note) return;

    note[field] = value;
    note.updatedAt = Date.now();
    this.moveNoteToFront(note);

    this.editRevision += 1;
    this.unsavedEditsPresent = true;
    this.scheduleSave();
  }

  async saveActiveNote(): Promise<void> {
    this.cancelScheduledSave();
    await this.flushEdits();
  }

  async closeActiveNote(): Promise<void> {
    await this.flushEdits();
    this.clearSelection();
  }

  async selectNote(noteId: string): Promise<void> {
    await this.flushEdits();

    const selectionVersion = ++this.selectionVersion;
    const result = await getNote(noteId);
    if (
      selectionVersion !== this.selectionVersion ||
      !result.ok ||
      !result.value
    ) {
      return;
    }

    this.selectLoadedNote(noteId);
  }

  private async flushEdits(): Promise<void> {
    this.cancelScheduledSave();
    if (!this.unsavedEditsPresent) return;

    if (!this.saveInProgress) {
      this.saveInProgress = this.persistPendingEdits().finally(() => {
        this.saveInProgress = undefined;
      });
    }

    await this.saveInProgress;
  }

  private async persistPendingEdits(): Promise<void> {
    while (this.unsavedEditsPresent) {
      const note = this.activeNote;
      if (!note) return;

      const noteId = note.id;
      const savedRevision = this.editRevision;
      const snapshot: Note = { ...note };
      const result = await saveNote(snapshot);

      if (!result.ok) {
        console.error("Failed to save note:", result.error);
        return;
      }

      if (
        this.activeNote?.id === noteId &&
        this.editRevision === savedRevision
      ) {
        this.unsavedEditsPresent = false;
      }
    }

    await this.refreshStorageUsage();
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(
      () => void this.saveActiveNote(),
      SAVE_DEBOUNCE_DELAY_MS,
    );

    this.maxSaveTimer ??= setTimeout(
      () => void this.saveActiveNote(),
      MAX_SAVE_DEBOUNCE_DELAY_MS,
    );
  }

  private cancelScheduledSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.maxSaveTimer) clearTimeout(this.maxSaveTimer);
    this.saveTimer = undefined;
    this.maxSaveTimer = undefined;
  }

  private async refreshNotes(): Promise<void> {
    const result = await getAllNotes();
    if (!result.ok) {
      console.error("Failed to load notes:", result.error);
      return;
    }

    this.notes = result.value;
    await this.refreshStorageUsage();
  }

  private async refreshStorageUsage(): Promise<void> {
    try {
      this.storageUsedBytes = await getStorageUsedBytes();
    } catch (error) {
      console.error("Failed to calculate storage usage:", error);
    }
  }

  private restoreSelection(): void {
    const noteId = variables.local.get(ACTIVE_NOTE_ID);
    if (noteId && this.notes.some((note) => note.id === noteId)) {
      this.selectLoadedNote(noteId);
    }
  }

  private selectLoadedNote(noteId: string): void {
    this.selectedNoteId = noteId;
    variables.local.set({ name: ACTIVE_NOTE_ID, value: noteId });
    this.unsavedEditsPresent = false;
    this.editRevision = 0;
  }

  private clearSelection(): void {
    this.selectionVersion += 1;
    this.selectedNoteId = null;
    variables.local.set({ name: ACTIVE_NOTE_ID, value: null });
    this.unsavedEditsPresent = false;
    this.editRevision = 0;
  }

  private moveNoteToFront(note: Note): void {
    const index = this.notes.findIndex(({ id }) => id === note.id);
    if (index > 0) {
      this.notes.splice(index, 1);
      this.notes.unshift(note);
    }
  }
}

let notekeeper!: Notekeeper;

export async function init(): Promise<void> {
  notekeeper = await Notekeeper.getInstance();
}

export { notekeeper };
