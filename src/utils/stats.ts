import type { TextStats } from "../types/stats";

function getCharacterCount(text: string): number {
  return text.length;
}

function getWordCount(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

function getStorageUsedBytes(text: string): number {
  const blob = new Blob([text]);
  return blob.size;
}

export function getTextStats(text: string): TextStats {
  return {
    wordCount: getWordCount(text),
    characterCount: getCharacterCount(text),
    storageUsedBytes: getStorageUsedBytes(text),
  };
}
