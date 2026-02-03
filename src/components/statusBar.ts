import type { TextStats } from '../types.ts';
import {
  formatWordCount,
  formatCharacterCount,
  formatStorageUsed,
} from '../utils/textStats.ts';

/** DOM element references for status bar */
interface StatusBarElements {
  wordCount: HTMLElement;
  charCount: HTMLElement;
  storageStatus: HTMLElement;
}

let elements: StatusBarElements | null = null;

/** Initialize status bar element references */
export function initStatusBar(): void {
  const wordCount = document.getElementById('word-count');
  const charCount = document.getElementById('char-count');
  const storageStatus = document.getElementById('storage-status');

  if (!wordCount || !charCount || !storageStatus) {
    throw new Error('Status bar elements not found');
  }

  elements = { wordCount, charCount, storageStatus };
}

/** Update status bar with new text statistics */
export function updateStatusBar(stats: TextStats): void {
  if (!elements) {
    throw new Error('Status bar not initialized');
  }

  elements.wordCount.textContent = formatWordCount(stats.words);
  elements.charCount.textContent = formatCharacterCount(stats.characters);
  elements.storageStatus.textContent = formatStorageUsed(stats.storageUsed);
}
