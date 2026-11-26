import { type Note, isTrashed, newNote } from "@/shared/note";
import { getCurrentTime } from "@/shared/timestamp";
import { type UUIDv4, isValidUUID } from "@/shared/uuid";
import { type Result, err, ok } from "@/shared/result";
import {
  deleteTrashedNotes,
  getAllNotes,
  replaceAllNotes,
  restoreStoredNote,
  saveNote,
  trashStoredNote,
} from "@/data/storage";
import { variables } from "@/data/variables";
import { setupLifecycle } from "@/data/lifecycle";
import { createDebouncer } from "@/lib/debounce";
import { getByteSize } from "@/lib/stats";
import type { Finite } from "@/shared/finite";

const ACTIVE_NOTE_ID_STORAGE_KEY = "active-note-id";
const SAVE_DEBOUNCE_DELAY_MS = 1_000;
const MAX_SAVE_DEBOUNCE_DELAY_MS = 5_000;
const MAX_SAVE_RETRY_DELAY_MS = 60_000;

type EditableField = "title" | "content";

class Notekeeper {
  private selectedNoteId = $state<UUIDv4 | null>(null);
  private editRevision = 0;
  private consecutiveSaveFailures = 0;
  private saveInProgress: Promise<Result<void>> | undefined;
  private saveScheduler = createDebouncer(
    () => void this.saveActiveNote(),
    SAVE_DEBOUNCE_DELAY_MS,
    MAX_SAVE_DEBOUNCE_DELAY_MS,
  );
  private refreshInProgress: Promise<Result<void>> | undefined;
  private refreshRequested = false;

  public notes = $state<Note[]>([]);
  public trash = $state<Note[]>([]);
  public activeNote = $derived(
    this.notes.find((note) => note.id === this.selectedNoteId) ?? null,
  );
  public unsavedEditsPresent = $state(false);
  public byteSize = $state(0 as Finite);

  async start(): Promise<Result<void>> {
    const cleanup = setupLifecycle({
      onNotesChanged: () => void this.refreshNotes(),
      hasUnsavedEdits: () => this.unsavedEditsPresent,
      flushUnsavedEdits: () => void this.flushEdits(),
    });
    const dispose = () => {
      cleanup();
      this.saveScheduler.cancel();
    };
    import.meta.hot?.dispose(dispose);

    const result = await this.refreshNotes();
    if (!result.ok) {
      dispose();
      return err(
        new Error(`Failed to load notes: ${result.error.message}`, {
          cause: result.error,
        }),
      );
    }
    this.restoreSelection();
    return ok();
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

  async trashNote(noteId: UUIDv4): Promise<Result<void>> {
    if (this.selectedNoteId === noteId) {
      // Persist pending edits so they end up in the trash with the note
      const flushResult = await this.flushEdits();
      if (!flushResult.ok) return flushResult;
      // Deselect before saving so a new edit can't save over the trashed copy
      this.clearSelection();
    }

    // Trash the stored copy, not ours, so edits saved by another tab survive
    const result = await trashStoredNote(noteId, getCurrentTime());
    if (!result.ok) {
      console.error("Failed to move note to trash:", result.error);
      return result;
    }
    return this.refreshNotes();
  }

  async restoreNote(noteId: UUIDv4): Promise<Result<void>> {
    // Restore the stored copy so a note deleted forever elsewhere stays gone.
    // Bump updatedAt so the restored note shows up at the top of the list
    const result = await restoreStoredNote(noteId, getCurrentTime());
    if (!result.ok) {
      console.error("Failed to restore note:", result.error);
      return result;
    }
    return this.refreshNotes();
  }

  /** Permanently deletes a note, if it's still in the trash */
  async deleteNote(noteId: UUIDv4): Promise<Result<void>> {
    const result = await deleteTrashedNotes([noteId]);
    if (!result.ok) {
      console.error("Failed to delete note:", result.error);
      return result;
    }
    return this.refreshNotes();
  }

  /**
   * Permanently deletes the given notes, skipping any that have left the
   * trash since. Pass the IDs the user confirmed, not the current trash,
   * so notes trashed elsewhere in the meantime aren't swept up too
   */
  async emptyTrash(noteIds: UUIDv4[]): Promise<Result<void>> {
    const result = await deleteTrashedNotes(noteIds);
    if (!result.ok) {
      console.error("Failed to empty trash:", result.error);
      return result;
    }
    return this.refreshNotes();
  }

  /** Live and trashed notes together, e.g. for a full export */
  get allNotes(): Note[] {
    return [...this.notes, ...this.trash];
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
    if (!note || note[field] === value) return;

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
        this.scheduleSaveRetry();
        return result;
      }
      this.consecutiveSaveFailures = 0;

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

    const live: Note[] = [];
    const trashed: Note[] = [];
    for (const note of result.value) {
      (isTrashed(note) ? trashed : live).push(note);
    }
    this.trash = trashed.toSorted(
      (left, right) => (right.deletedAt ?? 0) - (left.deletedAt ?? 0),
    );

    const draft = this.unsavedEditsPresent ? this.activeNote : null;
    if (draft) {
      // Local unsaved edits win, including when a peer deletes or trashes
      // the note. Its next save will persist the draft (without `deletedAt`)
      // and notify the other contexts
      this.notes = [draft, ...live.filter(({ id }) => id !== draft.id)];
      this.trash = this.trash.filter(({ id }) => id !== draft.id);
    } else {
      this.notes = live;
      if (this.selectedNoteId && !this.activeNote) this.clearSelection();
    }

    this.updateByteSize();
    return ok();
  }

  // Backs off exponentially so a persistent error (e.g. a full quota)
  // doesn't retry every second; any new edit resumes normal debouncing
  private scheduleSaveRetry(): void {
    const delayMs = Math.min(
      SAVE_DEBOUNCE_DELAY_MS * 2 ** this.consecutiveSaveFailures,
      MAX_SAVE_RETRY_DELAY_MS,
    );
    this.consecutiveSaveFailures += 1;
    this.saveScheduler.retry(delayMs);
  }

  private updateByteSize(): void {
    // Notes are stored as separate records, so sum each one rather than
    // stringifying the array (which would count `[]` and commas)
    // Trashed notes still take up storage, so they count too
    let total = 0;
    for (const note of this.allNotes) {
      total += getByteSize(JSON.stringify(note));
    }
    this.byteSize = total as Finite;
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

export async function init(): Promise<Result<void>> {
  const instance = new Notekeeper();
  const result = await instance.start();
  if (result.ok) notekeeper = instance;
  return result;
}

export { notekeeper };
