// neverthrow's map callbacks may intentionally return void
// oxlint-disable array-callback-return
import { ResultAsync, ok, okAsync } from "neverthrow";
import {
  deleteNote,
  getAllNotes,
  getNote,
  replaceAllNotes,
  saveNote,
} from "@/data/storage";
import { setupLifecycle } from "@/data/lifecycle";
import { variables } from "@/data/variables";
import { createDebouncer } from "@/lib/debounce";
import { getByteSize } from "@/lib/stats";
import { toError } from "@/shared/error";
import { type Note, newNote } from "@/shared/note";
import { type UUIDv4, isValidUUID } from "@/shared/uuid";
import { getCurrentTime } from "@/shared/timestamp";

const ACTIVE_NOTE_ID_STORAGE_KEY = "active-note-id";
const SAVE_DELAY_MS = 1_000;
const MAX_SAVE_DELAY_MS = 5_000;

type EditableField = "title" | "content";

class Notekeeper {
  private selectedNoteId = $state<UUIDv4 | null>(null);
  private draft = $state<Note | null>(null);

  notes = $state<Note[]>([]);
  activeNote = $derived(
    this.notes.find(({ id }) => id === this.selectedNoteId) ?? null,
  );
  unsavedEditsPresent = $derived(this.draft !== null);
  byteSize = $derived(getByteSize(JSON.stringify(this.notes)));

  private operations: Promise<void> = Promise.resolve();
  private initialization: ResultAsync<void, Error> | undefined;
  private refreshInProgress: ResultAsync<void, Error> | undefined;
  private refreshRevision = 0;
  private cleanup: (() => void) | undefined;
  private saveScheduler = createDebouncer(
    () => void this.saveActiveNote(),
    SAVE_DELAY_MS,
    MAX_SAVE_DELAY_MS,
  );

  initialize(): ResultAsync<void, Error> {
    this.initialization ??= ResultAsync.fromThrowable(async () => {
      this.cleanup = setupLifecycle({
        onNotesChanged: () => {
          void this.refreshNotes().orTee((error) => console.error(error));
        },
        hasUnsavedEdits: () => this.unsavedEditsPresent,
      });

      const result = await this.refreshNotes();
      if (result.isErr()) return result;

      const noteId = variables.local.get(ACTIVE_NOTE_ID_STORAGE_KEY);
      this.setSelection(
        isValidUUID(noteId) && this.notes.some(({ id }) => id === noteId)
          ? noteId
          : null,
      );
      return ok<void, Error>();
    }, toError)()
      .andThen((result) => result)
      .orTee(() => {
        this.cleanup?.();
        this.cleanup = undefined;
        this.initialization = undefined;
      });

    return this.initialization;
  }

  createNote(title?: string, content?: string): ResultAsync<UUIDv4, Error> {
    return this.enqueue(() => {
      const note = newNote(title, content);
      return this.flushDraft()
        .andThen(() => saveNote(note))
        .map(() => this.putNote(note))
        .andThen(() => this.flushDraft())
        .map(() => {
          this.setSelection(note.id);
          return note.id;
        });
    });
  }

  selectNote(noteId: UUIDv4): ResultAsync<void, Error> {
    return this.enqueue(() => {
      if (this.selectedNoteId === noteId) return this.flushDraft();
      return this.selectLatestNote(noteId);
    });
  }

  closeActiveNote(): ResultAsync<void, Error> {
    return this.enqueue(() =>
      this.flushDraft().map(() => this.setSelection(null)),
    );
  }

  deleteNote(noteId: UUIDv4): ResultAsync<void, Error> {
    return this.enqueue(() => {
      const saved =
        this.selectedNoteId === noteId ? this.flushDraft() : okAsync();
      return saved
        .andThen(() => deleteNote(noteId))
        .map(() => {
          this.refreshRevision += 1;
          if (this.selectedNoteId === noteId) this.setSelection(null);
          this.notes = this.notes.filter(({ id }) => id !== noteId);
        });
    });
  }

  importNotes(notes: Note[]): ResultAsync<void, Error> {
    const notesById = new Map<UUIDv4, Note>();
    for (const note of notes) notesById.set(note.id, { ...note });
    const snapshots = [...notesById.values()];
    return this.enqueue(() =>
      this.flushDraft()
        .andThen(() => replaceAllNotes(snapshots))
        .map(() => {
          this.refreshRevision += 1;
          this.setSelection(null);
          this.notes = this.sortNotes(snapshots);
        }),
    );
  }

  updateActiveNote(field: EditableField, value: string): void {
    const note = this.activeNote;
    if (!note || note[field] === value) return;

    this.draft = { ...note, [field]: value, updatedAt: getCurrentTime() };
    this.putNote(this.draft);
    this.saveScheduler.schedule();
  }

  saveActiveNote(): ResultAsync<void, Error> {
    return this.enqueue(() => this.flushDraft());
  }

  dispose(): void {
    this.cleanup?.();
    this.saveScheduler.cancel();
  }

  private enqueue<T>(
    operation: () => ResultAsync<T, Error>,
  ): ResultAsync<T, Error> {
    const pending = this.operations.then(operation);
    const result = ResultAsync.fromPromise(pending, toError)
      .andThen((value) => value)
      .orTee((error) => console.error(error));
    this.operations = Promise.resolve(result).then(() => {});
    return result;
  }

  private flushDraft(): ResultAsync<void, Error> {
    this.saveScheduler.cancel();
    const draft = this.draft;
    if (!draft) return okAsync();

    return saveNote({ ...draft }).andThen(() => {
      this.refreshRevision += 1;
      if (this.draft === draft) this.draft = null;
      return this.flushDraft();
    });
  }

  private selectLatestNote(noteId: UUIDv4): ResultAsync<void, Error> {
    return this.flushDraft().andThen(() => {
      const revision = this.refreshRevision;
      return getNote(noteId).andThen((note) => {
        if (revision !== this.refreshRevision)
          return this.selectLatestNote(noteId);
        if (!note) return ok();

        this.putNote(note);
        this.setSelection(note.id);
        return ok();
      });
    });
  }

  private refreshNotes(): ResultAsync<void, Error> {
    this.refreshRevision += 1;
    this.refreshInProgress ??= ResultAsync.fromThrowable(
      () => Promise.resolve(this.readLatestNotes()),
      toError,
    )()
      .andThen((result) => result)
      .andTee(() => {
        this.refreshInProgress = undefined;
      })
      .orTee(() => {
        this.refreshInProgress = undefined;
      });
    return this.refreshInProgress;
  }

  private readLatestNotes(): ResultAsync<void, Error> {
    const revision = this.refreshRevision;
    return ResultAsync.fromSafePromise(Promise.resolve(getAllNotes())).andThen(
      (result) => {
        if (revision !== this.refreshRevision) return this.readLatestNotes();

        return result.map((notes) => {
          this.refreshRevision += 1;
          this.notes = this.draft
            ? this.sortNotes([
                this.draft,
                ...notes.filter(({ id }) => id !== this.draft?.id),
              ])
            : notes;
          if (this.selectedNoteId && !this.activeNote) this.setSelection(null);
        });
      },
    );
  }

  private putNote(note: Note): void {
    this.refreshRevision += 1;
    this.notes = this.sortNotes([
      note,
      ...this.notes.filter(({ id }) => id !== note.id),
    ]);
  }

  private sortNotes(notes: Note[]): Note[] {
    return notes.toSorted((left, right) => right.updatedAt - left.updatedAt);
  }

  private setSelection(noteId: UUIDv4 | null): void {
    variables.local.set(ACTIVE_NOTE_ID_STORAGE_KEY, noteId);
    this.selectedNoteId = noteId;
    this.draft = null;
    this.saveScheduler.cancel();
  }
}

export const notekeeper = new Notekeeper();

export function init(): ResultAsync<void, Error> {
  return notekeeper.initialize();
}

import.meta.hot?.dispose(() => notekeeper.dispose());
