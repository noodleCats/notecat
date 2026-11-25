import { describe, expect, it } from "vitest";
import { findRanges, foldText, parseQuery, searchNotes } from "@/lib/search";
import type { Note } from "@/shared/note";
import type { Timestamp } from "@/shared/timestamp";
import type { UUIDv4 } from "@/shared/uuid";

let nextId = 0;
function makeNote(title: string, content = ""): Note {
  nextId += 1;
  return {
    id: `00000000-0000-4000-8000-${String(nextId).padStart(12, "0")}` as UUIDv4,
    title,
    content,
    createdAt: 0 as Timestamp,
    updatedAt: 0 as Timestamp,
  };
}

const marked = (text: string, ranges: { start: number; end: number }[]) =>
  ranges.map(({ start, end }) => text.slice(start, end));

describe("foldText", () => {
  it("ignores case, accents and character width", () => {
    expect(foldText("Café ÉCOLE ﬁle Ｗide")).toBe("cafe ecole file wide");
  });

  it("keeps line breaks", () => {
    expect(foldText("A\nÉ\n")).toBe("a\ne\n");
  });

  it("treats final sigma like any other sigma", () => {
    expect(foldText("ΟΔΟΣ οδος")).toBe("οδοσ οδοσ");
  });
});

describe("parseQuery", () => {
  it("splits on whitespace and drops duplicates and blanks", () => {
    expect(parseQuery("  Foo bar\tfoo  ")).toEqual(["foo", "bar"]);
    expect(parseQuery("   ")).toEqual([]);
  });
});

describe("findRanges", () => {
  it("maps matches back to the original text", () => {
    const text = "Un café, deux cafés";
    expect(marked(text, findRanges(text, ["cafe"]))).toEqual(["café", "café"]);
  });

  it("handles decomposed accents and astral characters", () => {
    const text = "👋 café!";
    expect(marked(text, findRanges(text, ["cafe"]))).toEqual(["café"]);
  });

  it("merges overlapping matches", () => {
    expect(findRanges("abcdef", ["abc", "cde"])).toEqual([
      { start: 0, end: 5 },
    ]);
  });
});

describe("searchNotes", () => {
  it("returns null for a blank query", () => {
    expect(searchNotes([makeNote("a")], "  ")).toBeNull();
  });

  it("requires every term, in the title or the content", () => {
    const both = makeNote("Groceries", "milk and eggs");
    const one = makeNote("Groceries", "bread");
    const results = searchNotes([both, one], "groceries milk")?.results;
    expect(results?.map(({ note }) => note)).toEqual([both]);
  });

  it("ranks title matches first, otherwise keeping order", () => {
    const contentFirst = makeNote("One", "about cats");
    const title = makeNote("Cats");
    const contentSecond = makeNote("Two", "cats again");
    const results = searchNotes(
      [contentFirst, title, contentSecond],
      "cat",
    )?.results;
    expect(results?.map(({ note }) => note)).toEqual([
      title,
      contentFirst,
      contentSecond,
    ]);
  });

  it("marks the title and builds a snippet from the matching line", () => {
    const [result] =
      searchNotes(
        [makeNote("Résumé draft", "first line\n  second line has the RESUME")],
        "resume",
      )?.results ?? [];
    expect(marked("Résumé draft", result?.match.titleRanges ?? [])).toEqual([
      "Résumé",
    ]);
    const snippet = result?.match.snippet;
    expect(snippet?.text).toBe("second line has the RESUME");
    expect(marked(snippet?.text ?? "", snippet?.ranges ?? [])).toEqual([
      "RESUME",
    ]);
  });

  it("starts the snippet just before a match late in a long line", () => {
    const content = `${"é".repeat(500)} needle ${"x".repeat(500)}`;
    const snippet = searchNotes([makeNote("Long", content)], "needle")
      ?.results[0]?.match.snippet;
    expect(snippet?.text.startsWith("…")).toBe(true);
    expect(marked(snippet?.text ?? "", snippet?.ranges ?? [])).toEqual([
      "needle",
    ]);
  });

  it("finds the match when folding changes the line's length", () => {
    // Hangul syllables each fold to 2–3 jamo, so folded columns run ahead
    const content = `${"한국어 문장입니다 ".repeat(10)}고양이 ${"다른 내용입니다 ".repeat(30)}`;
    const snippet = searchNotes([makeNote("Korean", content)], "고양이")
      ?.results[0]?.match.snippet;
    expect(marked(snippet?.text ?? "", snippet?.ranges ?? [])).toEqual([
      "고양이",
    ]);
  });

  it("shows short lines whole, and cuts long ones at a word", () => {
    const short = searchNotes(
      [makeNote("Short", "random thought about the cafe menu")],
      "cafe",
    )?.results[0]?.match.snippet;
    expect(short?.text).toBe("random thought about the cafe menu");

    const long = searchNotes(
      [makeNote("Long", `${"lorem ipsum ".repeat(10)}dolor cafe sit`)],
      "cafe",
    )?.results[0]?.match.snippet;
    expect(long?.text).toMatch(/^…[a-z]/u);
    expect(long?.text.split(" ")[0]?.slice(1)).toMatch(/^(lorem|ipsum)$/u);
  });

  it("has no snippet when only the title matches", () => {
    const results = searchNotes([makeNote("Cats", "dogs")], "cats")?.results;
    expect(results?.[0]?.match.snippet).toBeNull();
  });

  it("picks up edits to a note between searches", () => {
    const edited = makeNote("Plan", "old");
    expect(searchNotes([edited], "new")?.total).toBe(0);
    edited.content = "new";
    expect(searchNotes([edited], "new")?.total).toBe(1);
  });

  it("counts every match but only returns up to the limit", () => {
    const notes = ["a1", "a2", "a3"].map((title) => makeNote(title));
    const found = searchNotes(notes, "a", 2);
    expect(found?.total).toBe(3);
    expect(found?.results.map(({ note }) => note)).toEqual(notes.slice(0, 2));
  });
});
