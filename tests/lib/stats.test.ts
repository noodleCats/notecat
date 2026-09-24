import { describe, expect, it } from "vitest";
import { getByteSize, getWordCount } from "@/lib/stats";

describe("getWordCount", () => {
  it("counts an empty note as zero words", () => {
    expect(getWordCount("   \n\t ")).toBe(0);
  });

  it("separates words around punctuation and newlines", () => {
    expect(getWordCount("Hello, world!\nAnother note.")).toBe(4);
  });
});

describe("getByteSize", () => {
  it("measures UTF-8 bytes", () => {
    expect(getByteSize("é")).toBe(2);
  });

  it("measures compound emojis", () => {
    expect(getByteSize("👨‍👩‍👧‍👦")).toBe(25);
  });
});
