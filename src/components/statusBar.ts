import type { TextStats } from "../types/types.ts";
import {
  formatWordCount,
  formatCharacterCount,
  formatStorageUsed,
  formatRelativeDate,
} from "../utils/textStats.ts";

export class StatusBar {
  private wordCount: HTMLElement;
  private charCount: HTMLElement;
  private storageStatus: HTMLElement;
  private createdAtDate: HTMLElement;
  private updatedAtDate: HTMLElement;
  private statusBar: HTMLElement;
  private dateUpdateInterval: number | null = null;
  private currentCreatedAt: number | null = null;
  private currentUpdatedAt: number | null = null;

  constructor() {
    this.wordCount = this.getElement("word-count");
    this.charCount = this.getElement("char-count");
    this.storageStatus = this.getElement("storage-status");
    this.createdAtDate = this.getElement("created-at-date");
    this.updatedAtDate = this.getElement("updated-at-date");
    this.statusBar = this.getElement("status-bar");
  }

  private getElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Status bar element not found: #${id}`);
    }
    return element;
  }

  updateStats(stats: TextStats): void {
    this.wordCount.textContent = formatWordCount(stats.words);
    this.charCount.textContent = formatCharacterCount(stats.characters);
    this.storageStatus.textContent = formatStorageUsed(stats.storageUsed);
  }

  updateDates(createdAt: number, updatedAt: number): void {
    this.currentCreatedAt = createdAt;
    this.currentUpdatedAt = updatedAt;
    this.refreshDates();
    this.startDateUpdates();
  }

  clearDates(): void {
    this.currentCreatedAt = null;
    this.currentUpdatedAt = null;
    this.createdAtDate.textContent = "";
    this.updatedAtDate.textContent = "";
    this.stopDateUpdates();
  }

  private refreshDates(): void {
    if (this.currentCreatedAt !== null) {
      this.createdAtDate.textContent = `Created ${formatRelativeDate(this.currentCreatedAt)}`;
    }
    if (this.currentUpdatedAt !== null) {
      this.updatedAtDate.textContent = `Updated ${formatRelativeDate(this.currentUpdatedAt)}`;
    }
  }

  private startDateUpdates(): void {
    this.stopDateUpdates();
    this.dateUpdateInterval = window.setInterval(() => {
      this.refreshDates();
    }, 60000); // Update every minute
  }

  private stopDateUpdates(): void {
    if (this.dateUpdateInterval !== null) {
      clearInterval(this.dateUpdateInterval);
      this.dateUpdateInterval = null;
    }
  }

  setVisible(visible: boolean): void {
    this.statusBar.style.display = visible ? "flex" : "none";
    if (!visible) {
      this.stopDateUpdates();
    }
  }
}
