import type { FiniteNumber } from "@/types/finite";

const WORD_REGEX = /[^\s.,;!?/\\()[\]{}"“”—\-`]+/gu;

export function getCharacterCount(text: string): number {
  return text.length;
}

export function getWordCount(text: string): number {
  let count = 0;
  while (WORD_REGEX.test(text)) count += 1;
  return count;
}

export function getByteSize(text: string): FiniteNumber {
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.codePointAt(index) ?? 0;
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code > 0xffff) {
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
  }
  return bytes as FiniteNumber;
}
