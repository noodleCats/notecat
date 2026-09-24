import { isNote } from "@/shared/note";
import { MAX_VALID_TIMESTAMP_MS } from "@/shared/time";
import { describe, expect, it } from "vitest";

const validNote = {
  id: "ae2579ca-02c1-4482-9b33-828a3ee71c05",
  title: "notecat",
  content: "a minimal notes app with multi-note support",
  createdAt: 1790240070900,
  updatedAt: 1790240117973,
};

// oxlint-disable-next-line max-lines-per-function
describe("isNote", () => {
  it("accepts a complete note", () => {
    expect(isNote(validNote)).toBe(true);
  });

  it("accepts empty titles and contents", () => {
    expect(isNote({ ...validNote, title: "", content: "" })).toBe(true);
  });

  it("allows additional properties", () => {
    expect(isNote({ ...validNote, tag: "personal" })).toBe(true);
  });

  it.each([
    "",
    "not-a-uuid",
    "123e4567-e89b-12d3-a456-426614174000",
    "123e4567-e89b-42d3-7456-426614174000",
    "123e4567-e89b-42d3-a456-426614174000-extra",
  ])("rejects an invalid UUIDv4: %j", (id) => {
    expect(isNote({ ...validNote, id })).toBe(false);
  });

  it.each([null, undefined, true, false, 0, "note", [], {}])(
    "rejects non-note input %j",
    (value) => {
      expect(isNote(value)).toBe(false);
    },
  );

  it.each(["id", "title", "content", "createdAt", "updatedAt"] as const)(
    "rejects a note missing %s",
    (field) => {
      const note: Partial<typeof validNote> = { ...validNote };
      delete note[field];
      expect(isNote(note)).toBe(false);
    },
  );

  it.each([
    ["id", 123],
    ["title", 123],
    ["content", 123],
    ["createdAt", "1700000000000"],
    ["updatedAt", "1700000001000"],
    ["title", null],
    ["content", undefined],
  ])("rejects %s with the wrong type (%j)", (field, value) => {
    expect(isNote({ ...validNote, [field]: value })).toBe(false);
  });

  ["createdAt", "updatedAt"].forEach((field) => {
    it.each([0, MAX_VALID_TIMESTAMP_MS])(
      "accepts timestamp boundary %s",
      (value) => {
        expect(isNote({ ...validNote, [field]: value })).toBe(true);
      },
    );

    it.each([-1, NaN, Infinity, -Infinity, MAX_VALID_TIMESTAMP_MS + 1])(
      "rejects invalid timestamp %s",
      (value) => {
        expect(isNote({ ...validNote, [field]: value })).toBe(false);
      },
    );
  });
});
