import type { Note } from "@/shared/note";

/** Half-open range of UTF-16 indices `[start, end)` */
export interface TextRange {
  start: number;
  end: number;
}

export interface SearchSnippet {
  text: string;
  ranges: TextRange[];
}

export interface SearchMatch {
  titleRanges: TextRange[];
  /** Part of the line with the first match in the content, if any */
  snippet: SearchSnippet | null;
}

export interface SearchResult {
  note: Note;
  match: SearchMatch;
}

export interface SearchResults {
  results: SearchResult[];
  total: number;
}

interface FoldedNote {
  title: string;
  content: string;
  foldedTitle: string;
  foldedContent: string;
}

const COMBINING_MARK_REGEX = /\p{M}/gu;
const WHITESPACE_REGEX = /\s+/u;

const SNIPPET_LEAD = 24;
const SNIPPET_LENGTH = 160;
const SNIPPET_SEARCH_RADIUS = 64;

// Folding is per note and only redone when its text changes.
// Rebuilt on every search, so deleted notes drop out of it
let foldedNotes = new Map<string, FoldedNote>();

/** Case-, accent- and width-insensitive form of `text` for matching */
export function foldText(text: string): string {
  return text.toLowerCase().normalize("NFKD").replace(COMBINING_MARK_REGEX, "");
}

/**
 * Folded copy of `note`'s title and content. Reuses `previous`'s folded
 * title or content when that text hasn't changed
 */
function foldNote(note: Note, previous: FoldedNote | undefined): FoldedNote {
  const { title, content } = note;
  return {
    title,
    content,
    foldedTitle:
      previous?.title === title ? previous.foldedTitle : foldText(title),
    foldedContent:
      previous?.content === content
        ? previous.foldedContent
        : foldText(content),
  };
}

/** Splits a query into unique, folded terms */
export function parseQuery(query: string): string[] {
  const terms = foldText(query).split(WHITESPACE_REGEX).filter(Boolean);
  return [...new Set(terms)];
}

/**
 * Folds `text` one character at a time, recording which characters of
 * `text` each folded character came from
 */
function foldWithMap(text: string) {
  let folded = "";
  const starts: number[] = [];
  const ends: number[] = [];

  let index = 0;
  for (const character of text) {
    const end = index + character.length;
    // Most text is ASCII, which only needs lowercasing
    const piece =
      character.charCodeAt(0) < 0x80
        ? character.toLowerCase()
        : foldText(character);
    for (let offset = 0; offset < piece.length; offset += 1) {
      starts.push(index);
      ends.push(end);
    }
    folded += piece;
    index = end;
  }

  return { folded, starts, ends };
}

/**
 * Sorts `ranges` by start and merges any that overlap or touch. Returns new
 * range objects and leaves `ranges` unchanged
 */
function mergeRanges(ranges: TextRange[]): TextRange[] {
  const merged: TextRange[] = [];
  for (const range of ranges.toSorted(
    (left, right) => left.start - right.start,
  )) {
    const last = merged.at(-1);
    if (last && range.start <= last.end)
      last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
  }
  return merged;
}

/** Ranges of `text` that match any of the (folded) terms */
export function findRanges(text: string, terms: string[]): TextRange[] {
  const { folded, starts, ends } = foldWithMap(text);
  const ranges: TextRange[] = [];

  for (const term of terms) {
    let index = folded.indexOf(term);
    while (index !== -1) {
      const nextIndex = index + term.length;
      const start = starts[index];
      // Extend up to the next folded character, so characters that fold
      // to nothing (like a combining accent) stay with the one before them
      const end = Math.max(
        ends[nextIndex - 1] ?? 0,
        starts[nextIndex] ?? text.length,
      );
      if (start !== undefined) ranges.push({ start, end });
      index = folded.indexOf(term, nextIndex);
    }
  }

  return mergeRanges(ranges);
}

/** Moves `index` back off the second half of a surrogate pair */
function toCodePointBoundary(text: string, index: number): number {
  const code = text.charCodeAt(index);
  const previous = text.charCodeAt(index - 1);
  const splitsPair =
    code >= 0xdc00 &&
    code <= 0xdfff &&
    previous >= 0xd800 &&
    previous <= 0xdbff;

  return splitsPair ? index - 1 : index;
}

/** Number of `\n` characters in `text` before index `end` */
function countLineBreaks(text: string, end: number): number {
  let count = 0;
  for (
    let index = text.indexOf("\n");
    index !== -1 && index < end;
    index = text.indexOf("\n", index + 1)
  ) {
    count += 1;
  }
  return count;
}

/** Start of the `lineNumber`th line (0-based), or -1 if there isn't one */
function findLineStart(text: string, lineNumber: number): number {
  let start = 0;
  for (let line = 0; line < lineNumber; line += 1) {
    const lineBreak = text.indexOf("\n", start);
    if (lineBreak === -1) return -1;
    start = lineBreak + 1;
  }
  return start;
}

/**
 * Part of the line in `content` with the earliest match of any of the
 * (folded) terms, plus the ranges in it to highlight. `foldedContent` must be
 * `foldText(content)`.
 *
 * The snippet starts at the beginning of the line, or a little before the
 * match if it's further along (prefixed with `…`). It is at most
 * `SNIPPET_LENGTH` characters long, without the `…`. Ranges are indices into
 * the snippet's `text`, including the `…`.
 *
 * Returns `null` if no term is in `content`
 */
function findSnippet(
  content: string,
  foldedContent: string,
  terms: string[],
): SearchSnippet | null {
  let firstMatch = -1;
  for (const term of terms) {
    const index = foldedContent.indexOf(term);
    if (index !== -1 && (firstMatch === -1 || index < firstMatch))
      firstMatch = index;
  }
  if (firstMatch === -1) return null;

  // Folding keeps line breaks, so the match is on the same line of
  // `content`, though not necessarily at the same column
  const foldedLineStart = foldedContent.lastIndexOf("\n", firstMatch - 1) + 1;
  const lineStart = findLineStart(
    content,
    countLineBreaks(foldedContent, foldedLineStart),
  );
  if (lineStart === -1) return null;
  const lineBreak = content.indexOf("\n", lineStart);
  const lineEnd = lineBreak === -1 ? content.length : lineBreak;

  // Find the exact position near where the match should be
  const approximateStart = lineStart + firstMatch - foldedLineStart;
  const longestTerm = Math.max(...terms.map((term) => term.length));
  const windowStart = toCodePointBoundary(
    content,
    Math.max(lineStart, approximateStart - SNIPPET_SEARCH_RADIUS),
  );
  const windowEnd = Math.min(
    lineEnd,
    approximateStart + SNIPPET_SEARCH_RADIUS + longestTerm,
  );
  const [windowMatch] = findRanges(
    content.slice(windowStart, windowEnd),
    terms,
  );
  const matchStart = Math.min(
    lineEnd,
    windowMatch ? windowStart + windowMatch.start : approximateStart,
  );

  let start = lineStart;
  if (matchStart - lineStart > SNIPPET_LEAD * 2) {
    // Start at a word, rather than partway through one
    const wordBreak = content
      .slice(matchStart - SNIPPET_LEAD, matchStart)
      .search(/\s/u);
    start =
      wordBreak === -1
        ? toCodePointBoundary(content, matchStart - SNIPPET_LEAD)
        : matchStart - SNIPPET_LEAD + wordBreak;
  }
  // Skip indentation rather than showing it as a gap
  while (start < matchStart && /\s/u.test(content.charAt(start))) start += 1;
  const end = toCodePointBoundary(
    content,
    Math.min(lineEnd, start + SNIPPET_LENGTH),
  );

  const prefix = content.slice(lineStart, start).trim() === "" ? "" : "…";
  const text = content.slice(start, end).trimEnd();
  const ranges = findRanges(text, terms).map((range) => ({
    start: range.start + prefix.length,
    end: range.end + prefix.length,
  }));
  return { text: prefix + text, ranges };
}

/**
 * Notes where every term appears in the title or content. Notes with a term
 * in the title come first. Otherwise, the given order is kept.
 *
 * Only the first `limit` are returned, since working out where they matched
 * takes longer than finding them.
 *
 * Returns `null` for a blank query
 */
export function searchNotes(
  notes: Note[],
  query: string,
  limit = Infinity,
): SearchResults | null {
  const terms = parseQuery(query);
  if (terms.length === 0) return null;

  const nextFoldedNotes = new Map<string, FoldedNote>();
  type Match = { note: Note; folded: FoldedNote };
  const titleMatches: Match[] = [];
  const contentMatches: Match[] = [];

  for (const note of notes) {
    const folded = foldNote(note, foldedNotes.get(note.id));
    nextFoldedNotes.set(note.id, folded);

    const inTitle = terms.some((term) => folded.foldedTitle.includes(term));
    const matchesAll = terms.every(
      (term) =>
        folded.foldedTitle.includes(term) ||
        folded.foldedContent.includes(term),
    );
    if (!matchesAll) continue;

    (inTitle ? titleMatches : contentMatches).push({ note, folded });
  }
  foldedNotes = nextFoldedNotes;

  const matches = [...titleMatches, ...contentMatches];
  const results = matches.slice(0, limit).map(({ note, folded }) => {
    const titleTerms = terms.filter((term) =>
      folded.foldedTitle.includes(term),
    );
    return {
      note,
      match: {
        titleRanges:
          titleTerms.length > 0 ? findRanges(folded.title, titleTerms) : [],
        snippet: findSnippet(folded.content, folded.foldedContent, terms),
      },
    };
  });

  return { results, total: matches.length };
}
