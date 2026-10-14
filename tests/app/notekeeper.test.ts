// oxlint-disable max-lines
import {
  ResultAsync,
  err,
  errAsync,
  ok,
  okAsync,
  type Result,
} from "neverthrow";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { setupLifecycle } from "@/data/lifecycle";
import type * as Storage from "@/data/storage";
import type { Note } from "@/shared/note";
import type { Timestamp } from "@/shared/timestamp";
import type { UUIDv4 } from "@/shared/uuid";
import { getByteSize } from "@/lib/stats";

type Lifecycle = Parameters<typeof setupLifecycle>[0];

const mocks = vi.hoisted(() => ({
  storage: {
    getAllNotes: vi.fn<typeof Storage.getAllNotes>(),
    getNote: vi.fn<typeof Storage.getNote>(),
    saveNote: vi.fn<typeof Storage.saveNote>(),
    deleteNote: vi.fn<typeof Storage.deleteNote>(),
    replaceAllNotes: vi.fn<typeof Storage.replaceAllNotes>(),
  },
  setupLifecycle: vi.fn<typeof setupLifecycle>(),
  cleanup: vi.fn<() => void>(),
  local: {
    get: vi.fn<(name: string) => string | null>(),
    set: vi.fn<(name: string, value: string | null) => void>(),
  },
}));

vi.mock("@/data/storage", () => mocks.storage);
vi.mock("@/data/lifecycle", () => ({ setupLifecycle: mocks.setupLifecycle }));
vi.mock("@/data/variables", () => ({ variables: { local: mocks.local } }));

const first: Note = {
  id: "ae2579ca-02c1-4482-9b33-828a3ee71c05" as UUIDv4,
  title: "First",
  content: "Original",
  createdAt: 1_700_000_000_000 as Timestamp,
  updatedAt: 1_700_000_000_000 as Timestamp,
};
const second: Note = {
  ...first,
  id: "ce2579ca-02c1-4482-9b33-828a3ee71c05" as UUIDv4,
  title: "Second",
  updatedAt: (first.updatedAt + 1) as Timestamp,
};

function copyNote(note: Note): Note {
  return { ...note };
}

function deferred<T>() {
  let resolve!: (result: Result<T, Error>) => void;
  const result = new ResultAsync<T, Error>(
    new Promise((done) => {
      resolve = done;
    }),
  );
  return { result, resolve };
}

let keeper: typeof import("@/app/notekeeper.svelte").notekeeper;
let init: typeof import("@/app/notekeeper.svelte").init;
let records: Map<UUIDv4, Note>;
let lifecycle: Lifecycle;

async function start() {
  expect((await init()).isOk()).toBe(true);
}

async function settle() {
  // Drain queued ResultAsync chains without relying on timers or real storage.
  await vi.waitFor(() =>
    expect(keeper.notes).toEqual(
      [...records.values()].toSorted((a, b) => b.updatedAt - a.updatedAt),
    ),
  );
}

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.spyOn(console, "error").mockImplementation(() => {});
  records = new Map([
    [first.id, { ...first }],
    [second.id, { ...second }],
  ]);
  mocks.storage.getAllNotes.mockImplementation(() =>
    okAsync(
      [...records.values()]
        .toSorted((a, b) => b.updatedAt - a.updatedAt)
        .map((note) => copyNote(note)),
    ),
  );
  mocks.storage.getNote.mockImplementation((id) => {
    const note = records.get(id);
    return okAsync(note ? { ...note } : null);
  });
  mocks.storage.saveNote.mockImplementation((note) => {
    records.set(note.id, { ...note });
    return okAsync();
  });
  mocks.storage.deleteNote.mockImplementation((id) => {
    records.delete(id);
    return okAsync();
  });
  mocks.storage.replaceAllNotes.mockImplementation((notes) => {
    records = new Map(notes.map((note) => [note.id, { ...note }]));
    return okAsync();
  });
  mocks.local.get.mockReturnValue(first.id);
  mocks.setupLifecycle.mockImplementation((callbacks) => {
    lifecycle = callbacks;
    return mocks.cleanup;
  });
  ({ notekeeper: keeper, init } = await import("@/app/notekeeper.svelte"));
});

afterEach(() => {
  keeper.dispose();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("initialization", () => {
  it("shares initialization and restores the remembered note", async () => {
    const initialized = init();
    expect(initialized).toBeInstanceOf(ResultAsync);
    expect(init()).toBe(initialized);
    expect((await initialized).isOk()).toBe(true);
    expect(keeper.activeNote).toEqual(first);
    expect(keeper.notes).toEqual([second, first]);
    expect(keeper.byteSize).toBe(getByteSize(JSON.stringify(keeper.notes)));
    expect(mocks.setupLifecycle).toHaveBeenCalledTimes(1);
  });

  it.each(["invalid-id", "de2579ca-02c1-4482-9b33-828a3ee71c05", null])(
    "clears an unavailable remembered selection: %s",
    async (id) => {
      mocks.local.get.mockReturnValue(id);
      await start();
      expect(keeper.activeNote).toBeNull();
      expect(mocks.local.set).toHaveBeenCalledWith("active-note-id", null);
    },
  );

  it("returns load failures, cleans up, and permits retry", async () => {
    const error = new Error("Database unavailable");
    mocks.storage.getAllNotes.mockReturnValueOnce(errAsync(error));
    expect(await init()).toEqual(err(error));
    expect(mocks.cleanup).toHaveBeenCalledTimes(1);
    await start();
    expect(keeper.activeNote).toEqual(first);
    expect(mocks.setupLifecycle).toHaveBeenCalledTimes(2);
  });
});

describe("editing", () => {
  it("updates ordering and size immediately, then saves after typing stops", async () => {
    await start();
    keeper.updateActiveNote("content", "Draft 😺");
    expect(keeper.activeNote?.content).toBe("Draft 😺");
    expect(keeper.notes[0]?.id).toBe(first.id);
    expect(keeper.unsavedEditsPresent).toBe(true);
    expect(lifecycle.hasUnsavedEdits()).toBe(true);
    expect(keeper.byteSize).toBe(getByteSize(JSON.stringify(keeper.notes)));
    await vi.advanceTimersByTimeAsync(999);
    expect(mocks.storage.saveNote).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(records.get(first.id)?.content).toBe("Draft 😺");
    expect(keeper.unsavedEditsPresent).toBe(false);
  });

  it("does not schedule saves for unchanged values or an empty selection", async () => {
    await start();
    keeper.updateActiveNote("content", first.content);
    await keeper.closeActiveNote();
    keeper.updateActiveNote("title", "No note");
    await vi.advanceTimersByTimeAsync(5_000);
    expect(mocks.storage.saveNote).not.toHaveBeenCalled();
    expect(keeper.unsavedEditsPresent).toBe(false);
  });
});

describe("saving", () => {
  it("writes newer edits after an in-flight snapshot, with no overlapping writes", async () => {
    await start();
    keeper.updateActiveNote("content", "First draft");
    const writing = deferred<void>();
    mocks.storage.saveNote.mockReturnValueOnce(writing.result);
    const saved = keeper.saveActiveNote();
    await vi.waitFor(() =>
      expect(mocks.storage.saveNote).toHaveBeenCalledTimes(1),
    );
    keeper.updateActiveNote("content", "Second draft");
    expect(mocks.storage.saveNote.mock.calls[0]?.[0].content).toBe(
      "First draft",
    );
    expect(keeper.unsavedEditsPresent).toBe(true);
    writing.resolve(ok());
    expect((await saved).isOk()).toBe(true);
    expect(mocks.storage.saveNote).toHaveBeenCalledTimes(2);
    expect(records.get(first.id)?.content).toBe("Second draft");
    expect(keeper.unsavedEditsPresent).toBe(false);
  });

  it("retains a failed draft and allows the next save to succeed", async () => {
    await start();
    keeper.updateActiveNote("title", "Keep me");
    const error = new Error("Write failed");
    mocks.storage.saveNote.mockReturnValueOnce(errAsync(error));
    expect(await keeper.saveActiveNote()).toEqual(err(error));
    expect(keeper.activeNote?.title).toBe("Keep me");
    expect(keeper.unsavedEditsPresent).toBe(true);
    expect((await keeper.saveActiveNote()).isOk()).toBe(true);
    expect(records.get(first.id)?.title).toBe("Keep me");
  });
});

describe("selection", () => {
  it("keeps the selected draft when saving before a switch fails", async () => {
    await start();
    keeper.updateActiveNote("content", "Keep me");
    const error = new Error("Write failed");
    mocks.storage.saveNote.mockReturnValueOnce(errAsync(error));
    expect(await keeper.selectNote(second.id)).toEqual(err(error));
    expect(keeper.activeNote?.id).toBe(first.id);
    expect(keeper.unsavedEditsPresent).toBe(true);
    expect((await keeper.selectNote(second.id)).isOk()).toBe(true);
    expect(records.get(first.id)?.content).toBe("Keep me");
    expect(keeper.activeNote?.id).toBe(second.id);
  });

  it("does not replace the draft with stored content when reselecting it", async () => {
    await start();
    keeper.updateActiveNote("content", "Saved draft");
    await keeper.selectNote(first.id);
    expect(keeper.activeNote?.content).toBe("Saved draft");
    expect(records.get(first.id)?.content).toBe("Saved draft");
  });

  it("orders rapid selection and close requests", async () => {
    await start();
    const reading = deferred<Note | null>();
    mocks.storage.getNote.mockReturnValueOnce(reading.result);
    const selected = keeper.selectNote(second.id);
    const closed = keeper.closeActiveNote();
    await vi.waitFor(() =>
      expect(mocks.storage.getNote).toHaveBeenCalledTimes(1),
    );
    expect(keeper.activeNote?.id).toBe(first.id);
    reading.resolve(ok(second));
    await selected;
    await closed;
    expect(keeper.activeNote).toBeNull();
    expect(mocks.local.set).toHaveBeenLastCalledWith("active-note-id", null);
  });

  it("leaves selection unchanged when a target is missing or unreadable", async () => {
    await start();
    records.delete(second.id);
    expect((await keeper.selectNote(second.id)).isOk()).toBe(true);
    const error = new Error("Read failed");
    mocks.storage.getNote.mockReturnValueOnce(errAsync(error));
    expect(await keeper.selectNote(second.id)).toEqual(err(error));
    expect(keeper.activeNote?.id).toBe(first.id);
  });
});

// oxlint-disable-next-line max-lines-per-function
describe("selection races", () => {
  it("keeps newer peer content received while saving before a switch", async () => {
    await start();
    keeper.updateActiveNote("content", "Local edit to first");
    const writing = deferred<void>();
    mocks.storage.saveNote.mockImplementationOnce((note) => {
      records.set(note.id, { ...note });
      return writing.result;
    });
    const selected = keeper.selectNote(second.id);
    await vi.waitFor(() =>
      expect(mocks.storage.saveNote).toHaveBeenCalledTimes(1),
    );
    records.set(second.id, { ...second, content: "New content from peer" });
    lifecycle.onNotesChanged();
    await vi.waitFor(() =>
      expect(keeper.notes.find(({ id }) => id === second.id)?.content).toBe(
        "New content from peer",
      ),
    );
    writing.resolve(ok());
    expect((await selected).isOk()).toBe(true);
    keeper.updateActiveNote("title", "Rename second");
    await keeper.saveActiveNote();
    expect(records.get(second.id)?.content).toBe("New content from peer");
  });

  it("refetches a target superseded by a peer refresh during its read", async () => {
    await start();
    const reading = deferred<Note | null>();
    mocks.storage.getNote.mockReturnValueOnce(reading.result);
    const selected = keeper.selectNote(second.id);
    await vi.waitFor(() =>
      expect(mocks.storage.getNote).toHaveBeenCalledTimes(1),
    );
    records.set(second.id, { ...second, content: "New content from peer" });
    lifecycle.onNotesChanged();
    await settle();
    reading.resolve(ok(second));
    expect((await selected).isOk()).toBe(true);
    expect(mocks.storage.getNote).toHaveBeenCalledTimes(2);
    expect(keeper.activeNote?.content).toBe("New content from peer");
    keeper.updateActiveNote("title", "Rename second");
    await keeper.saveActiveNote();
    expect(records.get(second.id)?.content).toBe("New content from peer");
  });

  it("does not resurrect a target deleted by a peer during its read", async () => {
    await start();
    const reading = deferred<Note | null>();
    mocks.storage.getNote.mockReturnValueOnce(reading.result);
    const selected = keeper.selectNote(second.id);
    await vi.waitFor(() =>
      expect(mocks.storage.getNote).toHaveBeenCalledTimes(1),
    );
    records.delete(second.id);
    lifecycle.onNotesChanged();
    await settle();
    reading.resolve(ok(second));
    expect((await selected).isOk()).toBe(true);
    expect(keeper.notes).toEqual([first]);
    expect(keeper.activeNote?.id).toBe(first.id);
  });

  it("saves edits made to the current note while reading the target", async () => {
    await start();
    const reading = deferred<Note | null>();
    mocks.storage.getNote.mockReturnValueOnce(reading.result);
    const selected = keeper.selectNote(second.id);
    await vi.waitFor(() =>
      expect(mocks.storage.getNote).toHaveBeenCalledTimes(1),
    );
    keeper.updateActiveNote("content", "Edited during selection");
    reading.resolve(ok(second));
    expect((await selected).isOk()).toBe(true);
    expect(records.get(first.id)?.content).toBe("Edited during selection");
    expect(keeper.activeNote?.id).toBe(second.id);
    expect(keeper.unsavedEditsPresent).toBe(false);
  });
});

describe("creation", () => {
  it("saves the old draft, including edits made while creating a note", async () => {
    await start();
    keeper.updateActiveNote("content", "Before creation");
    const writing = deferred<void>();
    mocks.storage.saveNote
      .mockImplementationOnce((note) => {
        records.set(note.id, { ...note });
        return okAsync();
      })
      .mockReturnValueOnce(writing.result);
    const created = keeper.createNote("New note", "New content");
    await vi.waitFor(() =>
      expect(mocks.storage.saveNote).toHaveBeenCalledTimes(2),
    );
    keeper.updateActiveNote("content", "During creation");
    writing.resolve(ok());
    const result = await created;
    expect(result.isOk()).toBe(true);
    if (result.isErr()) throw result.error;
    expect(keeper.activeNote?.id).toBe(result.value);
    expect(keeper.activeNote?.title).toBe("New note");
    expect(records.get(first.id)?.content).toBe("During creation");
    expect(keeper.unsavedEditsPresent).toBe(false);
  });

  it("keeps selection when creation fails", async () => {
    await start();
    const error = new Error("Create failed");
    mocks.storage.saveNote.mockReturnValueOnce(errAsync(error));
    expect(await keeper.createNote()).toEqual(err(error));
    expect(keeper.activeNote).toEqual(first);
    expect(keeper.notes).toHaveLength(2);
  });
});

describe("deletion", () => {
  it("deletes other notes without discarding the active draft", async () => {
    await start();
    keeper.updateActiveNote("content", "Draft");
    expect((await keeper.deleteNote(second.id)).isOk()).toBe(true);
    expect(keeper.notes).toHaveLength(1);
    expect(keeper.activeNote?.content).toBe("Draft");
    expect(keeper.unsavedEditsPresent).toBe(true);
    expect(mocks.storage.saveNote).not.toHaveBeenCalled();
  });

  it("clears selection only after deletion succeeds", async () => {
    await start();
    const error = new Error("Delete failed");
    mocks.storage.deleteNote.mockReturnValueOnce(errAsync(error));
    expect(await keeper.deleteNote(first.id)).toEqual(err(error));
    expect(keeper.activeNote?.id).toBe(first.id);
    expect((await keeper.deleteNote(first.id)).isOk()).toBe(true);
    expect(keeper.activeNote).toBeNull();
    expect(keeper.notes).toEqual([second]);
  });
});

describe("imports", () => {
  it("imports snapshots in date order and clears selection after success", async () => {
    await start();
    const imported = [{ ...first, title: "Imported" }, { ...second }];
    const replaced = keeper.importNotes(imported);
    imported[0].title = "Changed by caller";
    expect((await replaced).isOk()).toBe(true);
    expect(keeper.notes.map(({ title }) => title)).toEqual([
      "Second",
      "Imported",
    ]);
    expect(keeper.activeNote).toBeNull();
  });

  it("keeps notes and selection when replacing storage fails", async () => {
    await start();
    const error = new Error("Import failed");
    mocks.storage.replaceAllNotes.mockReturnValueOnce(errAsync(error));
    expect(await keeper.importNotes([])).toEqual(err(error));
    expect(keeper.notes).toEqual([second, first]);
    expect(keeper.activeNote).toEqual(first);
  });

  it("keeps the last occurrence of duplicate IDs in both state and storage", async () => {
    await start();
    const earlier = {
      ...first,
      title: "Earlier occurrence",
      updatedAt: (second.updatedAt + 1) as Timestamp,
    };
    const last = { ...first, title: "Last occurrence" };
    expect((await keeper.importNotes([earlier, second, last])).isOk()).toBe(
      true,
    );
    expect(mocks.storage.replaceAllNotes).toHaveBeenCalledWith([last, second]);
    expect(records.size).toBe(2);
    expect(keeper.notes).toEqual([second, last]);
    await settle();
  });
});

// oxlint-disable-next-line max-lines-per-function
describe("peer refreshes", () => {
  it("preserves a draft even if another context deletes the stored note", async () => {
    await start();
    keeper.updateActiveNote("content", "Local draft");
    records.delete(first.id);
    records.set(second.id, { ...second, title: "Peer edit" });
    lifecycle.onNotesChanged();
    await vi.waitFor(() => expect(keeper.notes[1]?.title).toBe("Peer edit"));
    expect(keeper.activeNote?.content).toBe("Local draft");
    expect(keeper.unsavedEditsPresent).toBe(true);
    await keeper.saveActiveNote();
    expect(records.get(first.id)?.content).toBe("Local draft");
  });

  it("clears a clean selection deleted by another context", async () => {
    await start();
    records.delete(first.id);
    lifecycle.onNotesChanged();
    await settle();
    expect(keeper.activeNote).toBeNull();
    expect(mocks.local.set).toHaveBeenLastCalledWith("active-note-id", null);
  });

  it("coalesces peer changes and rejects stale reads", async () => {
    await start();
    const reading = deferred<Note[]>();
    mocks.storage.getAllNotes.mockReturnValueOnce(reading.result);
    lifecycle.onNotesChanged();
    records.set(second.id, { ...second, title: "Latest" });
    lifecycle.onNotesChanged();
    expect(mocks.storage.getAllNotes).toHaveBeenCalledTimes(2);
    reading.resolve(ok([second, first]));
    await settle();
    expect(keeper.notes[0]?.title).toBe("Latest");
    expect(mocks.storage.getAllNotes).toHaveBeenCalledTimes(3);
  });

  it("does not let a pending peer read resurrect a locally deleted note", async () => {
    await start();
    const reading = deferred<Note[]>();
    mocks.storage.getAllNotes.mockReturnValueOnce(reading.result);
    lifecycle.onNotesChanged();
    await keeper.deleteNote(first.id);
    reading.resolve(ok([second, first]));
    await vi.waitFor(() =>
      expect(mocks.storage.getAllNotes).toHaveBeenCalledTimes(3),
    );
    await settle();
    expect(keeper.notes).toEqual([second]);
    expect(keeper.activeNote).toBeNull();
  });
});

describe("peer refresh failures", () => {
  it("processes a newer notification when the preceding read fails", async () => {
    await start();
    const reading = deferred<Note[]>();
    mocks.storage.getAllNotes.mockReturnValueOnce(reading.result);
    lifecycle.onNotesChanged();
    records.set(second.id, { ...second, content: "Newest change" });
    lifecycle.onNotesChanged();
    reading.resolve(err(new Error("Transient read failure")));
    await vi.waitFor(() =>
      expect(mocks.storage.getAllNotes).toHaveBeenCalledTimes(3),
    );
    await settle();
    expect(keeper.notes.find(({ id }) => id === second.id)?.content).toBe(
      "Newest change",
    );
    expect(console.error).not.toHaveBeenCalled();
  });

  it("reports the latest read failure without retrying it indefinitely", async () => {
    await start();
    const reading = deferred<Note[]>();
    const latestError = new Error("Latest read failed");
    mocks.storage.getAllNotes
      .mockReturnValueOnce(reading.result)
      .mockReturnValueOnce(errAsync(latestError));
    lifecycle.onNotesChanged();
    records.set(second.id, { ...second, content: "Newest change" });
    lifecycle.onNotesChanged();
    reading.resolve(err(new Error("Old read failed")));
    await vi.waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(latestError),
    );
    expect(mocks.storage.getAllNotes).toHaveBeenCalledTimes(3);
    expect(keeper.notes).toEqual([second, first]);
    lifecycle.onNotesChanged();
    await settle();
    expect(mocks.storage.getAllNotes).toHaveBeenCalledTimes(4);
  });
});
