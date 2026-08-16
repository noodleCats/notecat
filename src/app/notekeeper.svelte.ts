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
import { variables } from "../data/variables";
import { type Result, ok } from "../shared/result";

const ACTIVE_NOTE_ID_STORAGE_KEY = "active-note-id";
const SAVE_DEBOUNCE_DELAY_MS = 1_000;
const MAX_SAVE_DEBOUNCE_DELAY_MS = 5_000;

type EditableField = "title" | "content";

class Notekeeper {
  private static instance: Notekeeper | undefined;
  private static initialization: Promise<Notekeeper> | undefined;

  private selectedNoteId = $state<string | null>(null);
  private editRevision = 0;
  private saveInProgress: Promise<Result<void>> | undefined;
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

    const persistence = await requestPersistentStorage();
    if (!persistence.ok) {
      console.warn("Could not request persistent storage:", persistence.error);
    } else if (persistence.value === "denied") {
      console.warn(
        "Persistent storage was denied; locally stored notes may be removed if the browser needs to free space.",
      );
    }

    window.addEventListener("beforeunload", (event) => {
      if (notekeeper.unsavedEditsPresent) event.preventDefault();
    });

    this.instance = notekeeper;
    return notekeeper;
  }

  async createNote(title?: string, content?: string): Promise<Result<string>> {
    const note = newNote(title, content);
    const result = await saveNote(note);
    if (!result.ok) {
      console.error("Failed to create note:", result.error);
      return result;
    }

    const refreshResult = await this.refreshNotes();
    if (!refreshResult.ok) return refreshResult;
    this.selectLoadedNote(note.id);
    return ok(note.id);
  }

  async deleteNote(noteId: string): Promise<Result<void>> {
    if (this.selectedNoteId === noteId) {
      const flushResult = await this.flushEdits();
      if (!flushResult.ok) return flushResult;
    }

    const result = await deleteNote(noteId);
    if (!result.ok) {
      console.error("Failed to delete note:", result.error);
      return result;
    }

    const refreshResult = await this.refreshNotes();
    if (!refreshResult.ok) return refreshResult;
    if (this.selectedNoteId === noteId) this.clearSelection();
    return ok();
  }

  async importNotes(notes: Note[]): Promise<Result<void>> {
    const flushResult = await this.flushEdits();
    if (!flushResult.ok) return flushResult;

    const result = await replaceAllNotes(notes.map((note) => ({ ...note })));
    if (!result.ok) {
      console.error("Failed to import notes:", result.error);
      return result;
    }

    const refreshResult = await this.refreshNotes();
    if (!refreshResult.ok) return refreshResult;
    this.clearSelection();
    return ok();
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

  async saveActiveNote(): Promise<Result<void>> {
    return this.flushEdits();
  }

  async closeActiveNote(): Promise<Result<void>> {
    const flushResult = await this.flushEdits();
    if (!flushResult.ok) return flushResult;
    this.clearSelection();
    return ok();
  }

  async selectNote(noteId: string): Promise<Result<void>> {
    const flushResult = await this.flushEdits();
    if (!flushResult.ok) return flushResult;

    const selectionVersion = ++this.selectionVersion;
    const result = await getNote(noteId);
    if (
      selectionVersion !== this.selectionVersion ||
      !result.ok ||
      !result.value
    ) {
      return result.ok ? ok() : result;
    }

    this.selectLoadedNote(noteId);
    return ok();
  }

  private async flushEdits(): Promise<Result<void>> {
    this.cancelScheduledSave();
    if (!this.unsavedEditsPresent) return ok();

    if (!this.saveInProgress) {
      this.saveInProgress = this.persistPendingEdits().finally(() => {
        this.saveInProgress = undefined;
      });
    }

    return this.saveInProgress;
  }

  private async persistPendingEdits(): Promise<Result<void>> {
    while (this.unsavedEditsPresent) {
      const note = this.activeNote;
      if (!note) return ok();

      const noteId = note.id;
      const savedRevision = this.editRevision;
      const snapshot: Note = { ...note };
      const result = await saveNote(snapshot);

      if (!result.ok) {
        console.error("Failed to save note:", result.error);
        return result;
      }

      if (
        this.activeNote?.id === noteId &&
        this.editRevision === savedRevision
      ) {
        this.unsavedEditsPresent = false;
      }
    }

    return this.refreshStorageUsage();
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

  private async refreshNotes(): Promise<Result<void>> {
    const result = await getAllNotes();
    if (!result.ok) {
      console.error("Failed to load notes:", result.error);
      return result;
    }

    this.notes = result.value;
    return this.refreshStorageUsage();
  }

  private async refreshStorageUsage(): Promise<Result<void>> {
    const result = await getStorageUsedBytes();
    if (!result.ok) {
      console.error("Failed to calculate storage usage:", result.error);
      return result;
    }

    this.storageUsedBytes = result.value;
    return ok();
  }

  private restoreSelection(): void {
    const noteId = variables.local.get(ACTIVE_NOTE_ID_STORAGE_KEY);
    if (noteId && this.notes.some((note) => note.id === noteId)) {
      this.selectLoadedNote(noteId);
    }
  }

  private selectLoadedNote(noteId: string): void {
    this.selectedNoteId = noteId;
    variables.local.set(ACTIVE_NOTE_ID_STORAGE_KEY, noteId);
    this.unsavedEditsPresent = false;
    this.editRevision = 0;
  }

  private clearSelection(): void {
    this.selectionVersion += 1;
    this.selectedNoteId = null;
    variables.local.set(ACTIVE_NOTE_ID_STORAGE_KEY, null);
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
