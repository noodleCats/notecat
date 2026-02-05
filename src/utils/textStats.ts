import type { TextStats, StorageInfo } from "../types/types.ts";

const LOCALSTORAGE_QUOTA_BYTES = 5 * 1024 * 1024; // 5MB assumed quota

/** Count words in text */
export function calculateWordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/** Count characters in text */
export function calculateCharacterCount(text: string): number {
  return text.length;
}

/** Calculate storage used by text */
export function calculateStorageUsed(text: string): StorageInfo {
  const bytes = new Blob([text]).size;
  const kb = bytes / 1024;
  const percent = (bytes / LOCALSTORAGE_QUOTA_BYTES) * 100;

  return {
    bytes,
    kb: Math.round(kb * 10) / 10, // 1 decimal place
    percent: Math.round(percent * 100) / 100, // 2 decimal places
  };
}

/** Calculate all text statistics at once */
export function calculateTextStats(text: string): TextStats {
  return {
    words: calculateWordCount(text),
    characters: calculateCharacterCount(text),
    storageUsed: calculateStorageUsed(text),
  };
}

/** Format word count for display */
export function formatWordCount(count: number): string {
  return `${count} ${count === 1 ? "word" : "words"}`;
}

/** Format character count for display */
export function formatCharacterCount(count: number): string {
  return `${count} ${count === 1 ? "char" : "chars"}`;
}

/** Format storage info for display */
export function formatStorageUsed(info: StorageInfo): string {
  return `${info.kb.toFixed(1)}KB (${info.percent.toFixed(2)}%)`;
}

/** Format a timestamp as a relative date string */
export function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}
