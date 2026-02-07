import type { TextStats } from "../types/stats.ts";

class Stats {
  getCharacterCount(text: string): number {
    return text.length;
  }

  getWordCount(text: string): number {
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }

  getStorageUsedBytes(text: string): number {
    const blob = new Blob([text]);
    return blob.size;
  }

  getTextStats(text: string): TextStats {
    return {
      wordCount: this.getWordCount(text),
      characterCount: this.getCharacterCount(text),
      storageUsedBytes: this.getStorageUsedBytes(text),
    };
  }
}

export const stats = new Stats();
