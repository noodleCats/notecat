import type { FiniteNumber } from "@/types/finite";

export function getCharacterCount(text: string): number {
  return text.length;
}

export function getWordCount(text: string): number {
  const words = text
    .trim()
    .split(/[\s.,;;!?/\\()[\]{}"“”—\-`]+/u)
    .filter(Boolean);
  return words.length;
}

export function getStorageUsedBytes(text: string): FiniteNumber {
  const blob = new Blob([text]);

  // Blob.size is always finite
  return blob.size as FiniteNumber;
}
