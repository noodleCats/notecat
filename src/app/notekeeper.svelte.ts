import { type Note, newNote } from "@/shared/note";
import { getCurrentTime } from "@/shared/timestamp";
import { type UUIDv4, isValidUUID } from "@/shared/uuid";
import { type Result, ok } from "@/shared/result";
import {
  deleteNote,
  getAllNotes,
  replaceAllNotes,
  saveNote,
} from "@/data/storage";
import { variables } from "@/data/variables";
import { setupLifecycle } from "@/data/lifecycle";
import { createDebouncer } from "@/lib/debounce";
import { getByteSize } from "@/lib/stats";
import type { Finite } from "@/shared/finite";

const ACTIVE_NOTE_ID_STORAGE_KEY = "active-note-id";
const SAVE_DEBOUNCE_DELAY_MS = 1_000;
const MAX_SAVE_DEBOUNCE_DELAY_MS = 5_000;

type EditableField = "title" | "content";

class Notekeeper {
  private selectedNoteId = $state<UUIDv4 | null>(null);
  private editRevision = 0;
  private saveInProgress: Promise<Result<void>> | undefined;
  private saveScheduler = createDebouncer(
    () => void this.saveActiveNote(),
    SAVE_DEBOUNCE_DELAY_MS,
    MAX_SAVE_DEBOUNCE_DELAY_MS,
  );
  private refreshInProgress: Promise<Result<void>> | undefined;
  private refreshRequested = false;

  public notes = $state<Note[]>([]);
  public activeNote = $derived(
    this.notes.find((note) => note.id === this.selectedNoteId) ?? null,
  );
  public unsavedEditsPresent = $state(false);
  public byteSize = $state(0 as Finite);

  async start(): Promise<void> {
    const cleanup = setupLifecycle({
      onNotesChanged: () => void this.refreshNotes(),
      hasUnsavedEdits: () => this.unsavedEditsPresent,
    });
    const dispose = () => {
      cleanup();
      this.saveScheduler.cancel();
    };
    import.meta.hot?.dispose(dispose);

    const result = await this.refreshNotes();
    if (!result.ok) {
      dispose();
      throw result.error;
    }
    this.restoreSelection();
  }

  async createNote(title?: string, content?: string): Promise<Result<string>> {
    const flushResult = await this.flushEdits();
    if (!flushResult.ok) return flushResult;

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

  async deleteNote(noteId: UUIDv4): Promise<Result<void>> {
    // Pending edits to a note being deleted are discarded, not saved
    if (this.selectedNoteId === noteId) this.clearSelection();

    const result = await deleteNote(noteId);
    if (!result.ok) {
      console.error("Failed to delete note:", result.error);
      return result;
    }

    return this.refreshNotes();
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
    note.updatedAt = getCurrentTime();
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

  async selectNote(noteId: UUIDv4): Promise<Result<void>> {
    const flushResult = await this.flushEdits();
    if (!flushResult.ok) return flushResult;

    if (this.notes.some(({ id }) => id === noteId)) {
      this.selectLoadedNote(noteId);
    }
    return ok();
  }

  private flushEdits(): Promise<Result<void>> {
    this.saveScheduler.cancel();
    if (!this.unsavedEditsPresent) return Promise.resolve(ok());

    this.saveInProgress ??= this.persistPendingEdits().finally(() => {
      this.saveInProgress = undefined;
    });
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
        this.saveScheduler.schedule();
        return result;
      }

      if (
        this.activeNote?.id === noteId &&
        this.editRevision === savedRevision
      ) {
        this.unsavedEditsPresent = false;
      }
    }

    // The in-memory list already reflects this save, and other contexts
    // are notified through the channel, so a full reload isn't needed
    this.updateByteSize();
    return ok();
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

    this.updateByteSize();
    return ok();
  }

  private updateByteSize(): void {
    this.byteSize = getByteSize(JSON.stringify(this.notes));
  }

  private restoreSelection(): void {
    const noteId = variables.local.get(ACTIVE_NOTE_ID_STORAGE_KEY);
    if (isValidUUID(noteId) && this.notes.some((note) => note.id === noteId)) {
      this.selectLoadedNote(noteId);
    }
  }

  private selectLoadedNote(noteId: UUIDv4): void {
    this.selectedNoteId = noteId;
    variables.local.set(ACTIVE_NOTE_ID_STORAGE_KEY, noteId);
    this.unsavedEditsPresent = false;
    this.editRevision = 0;
  }

  private clearSelection(): void {
    this.saveScheduler.cancel();
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
  const instance = new Notekeeper();
  await instance.start();
  notekeeper = instance;
}

export { notekeeper };
