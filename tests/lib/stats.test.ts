import { describe, expect, it } from "vitest";
import { getByteSize, getWordCount } from "@/lib/stats";

describe("getWordCount", () => {
  it("counts an empty note as zero words", () => {
    expect(getWordCount("   \n\t ")).toBe(0);
  });

  it("separates words around punctuation and newlines", () => {
    expect(getWordCount("Hello, world!\nAnother note.")).toBe(4);
  });

  it("preserves the existing separators and Unicode words", () => {
    expect(getWordCount('.;,!?/\\()[]{}"“”—-`\n\t')).toBe(0);
    expect(getWordCount("АБВГД\u00A0世界\u2003don't foo:bar 👋")).toBe(5);
    expect(getWordCount("one two three")).toBe(3);
  });
});

describe("getByteSize", () => {
  it("measures UTF-8 bytes", () => {
    expect(getByteSize("é")).toBe(2);
  });

  it("measures compound emojis", () => {
    expect(getByteSize("👨‍👩‍👧‍👦")).toBe(25);
  });

  it.each([
    "",
    "ASCII\r\n\0",
    "世界",
    "АБВГД",
    "\uD800",
    "\uDC00",
    "\uD800a",
    "\uD800\uD800\uDC00",
    "\uDBFF\uDFFF",
  ])("matches Blob's UTF-8 encoding for %j", (text) =>
    expect(getByteSize(text)).toBe(new Blob([text]).size),
  );
});
