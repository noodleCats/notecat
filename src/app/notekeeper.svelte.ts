import type { Note } from "../types/note";
import {
  deleteNote,
  getAllNotes,
  getNote,
  getStorageUsedBytes,
  newNote,
  replaceAllNotes,
  saveNote,
} from "../data/storage";
import { variables } from "../data/variables";
import { setupLifecycle } from "../data/lifecycle";
import { createDebouncer } from "../lib/debounce";
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
  private saveScheduler = createDebouncer(
    () => void this.saveActiveNote(),
    SAVE_DEBOUNCE_DELAY_MS,
    MAX_SAVE_DEBOUNCE_DELAY_MS,
  );
  private selectionVersion = 0;
  private refreshInProgress: Promise<Result<void>> | undefined;
  private refreshRequested = false;

  public notes = $state<Note[]>([]);
  public activeNote = $derived(
    this.notes.find((note) => note.id === this.selectedNoteId) ?? null,
  );
  public unsavedEditsPresent = $state(false);
  public storageUsedBytes = $state(0);

  private constructor() {}

  static getInstance(): Promise<Notekeeper> {
    if (this.instance) return Promise.resolve(this.instance);

    this.initialization ??= this.create().catch((error) => {
      this.initialization = undefined;
      throw error;
    });

    return this.initialization;
  }

  private static async create(): Promise<Notekeeper> {
    const notekeeper = new Notekeeper();
    const cleanup = setupLifecycle({
      onNotesChanged: () => void notekeeper.refreshNotes(),
      hasUnsavedEdits: () => notekeeper.unsavedEditsPresent,
    });
    import.meta.hot?.dispose(() => {
      cleanup();
      notekeeper.saveScheduler.cancel();
    });
    await notekeeper.refreshNotes();
    notekeeper.restoreSelection();

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
    this.saveScheduler.schedule();
  }

  saveActiveNote(): Promise<Result<void>> {
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

  private flushEdits(): Promise<Result<void>> {
    this.saveScheduler.cancel();
    if (!this.unsavedEditsPresent) return Promise.resolve(ok());

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

      // saves must be serialized - otherwise,
      // an older snapshot can overwrite a newer one
      // oxlint-disable-next-line no-await-in-loop
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

    return this.refreshNotes();
  }

  private refreshNotes(): Promise<Result<void>> {
    this.refreshRequested = true;
    this.refreshInProgress ??= this.refreshPendingNotes().finally(() => {
      this.refreshInProgress = undefined;
    });
    return this.refreshInProgress;
  }

  private async refreshPendingNotes(): Promise<Result<void>> {
    let result: Result<void> = ok();
    while (this.refreshRequested) {
      this.refreshRequested = false;
      // keeps older reads from replacing newer state
      // oxlint-disable-next-line no-await-in-loop
      result = await this.loadNotes();
    }
    return result;
  }

  private async loadNotes(): Promise<Result<void>> {
    const result = await getAllNotes();
    if (!result.ok) {
      console.error("Failed to load notes:", result.error);
      return result;
    }
    if (this.refreshRequested) return ok();

    const draft = this.unsavedEditsPresent ? this.activeNote : null;
    if (draft) {
      // Local unsaved edits win, including when a peer deletes the note
      // Its next save will persist the draft and notify the other contexts
      this.notes = [draft, ...result.value.filter(({ id }) => id !== draft.id)];
    } else {
      this.notes = result.value;
      if (this.selectedNoteId && !this.activeNote) this.clearSelection();
    }
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
