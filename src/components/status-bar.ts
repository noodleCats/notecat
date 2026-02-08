import type { TextStats } from "../types/stats.ts";
import { formatting } from "../utils/formatting.ts";

export class StatusBar {
  private static readonly DATE_UPDATE_INTERVAL_MS = 60000;

  private statusBar: HTMLElement;

  private createdAtDate: HTMLSpanElement;
  private updatedAtDate: HTMLSpanElement;
  private dateUpdateInterval: number | null = null;
  private currentNoteCreatedAt: number | null = null;
  private currentNoteUpdatedAt: number | null = null;

  private wordCount: HTMLSpanElement;
  private characterCount: HTMLSpanElement;
  private storageUsed: HTMLSpanElement;

  constructor(containerElementId: string) {
    const container = document.getElementById(containerElementId);
    if (
      !(container instanceof HTMLElement) ||
      container.localName !== "footer"
    ) {
      throw new Error("StatusBar: container is not a footer element");
    }

    const createdAtDateId = "created-at-date";
    const updatedAtDateId = "updated-at-date";
    const wordCountId = "word-count";
    const characterCountId = "character-count";
    const storageUsedId = "storage-used";

    container.innerHTML = `
      <div id="status-bar-left">
        <span id="${createdAtDateId}" class="status"></span>
        <span id="${updatedAtDateId}" class="status"></span>
      </div>
      <div id="status-bar-right">
        <span id="${wordCountId}" class="status"></span>
        <span id="${characterCountId}" class="status"></span>
        <span id="${storageUsedId}" class="status"></span>
      </div>
    `;

    this.statusBar = container;

    const getSpan = (id: string) => {
      const element = this.statusBar.querySelector(`#${id}`);
      if (!(element instanceof HTMLSpanElement)) {
        throw new Error("getSpan: element is not a span element");
      }
      return element;
    };

    this.createdAtDate = getSpan(createdAtDateId);
    this.updatedAtDate = getSpan(updatedAtDateId);
    this.wordCount = getSpan(wordCountId);
    this.characterCount = getSpan(characterCountId);
    this.storageUsed = getSpan(storageUsedId);
  }

  updateStats(stats: TextStats): void {
    const formattedStats = formatting.stat.formatTextStats(stats);

    this.wordCount.textContent = formattedStats.wordCount;
    this.characterCount.textContent = formattedStats.characterCount;
    this.storageUsed.textContent = formattedStats.storageUsed;
  }

  updateDates(createdAt: number, updatedAt: number): void {
    this.currentNoteCreatedAt = createdAt;
    this.currentNoteUpdatedAt = updatedAt;
    this.refreshDates();
    this.startDateUpdates();
  }

  clearDates(): void {
    this.currentNoteCreatedAt = null;
    this.currentNoteUpdatedAt = null;
    this.createdAtDate.textContent = "";
    this.updatedAtDate.textContent = "";
    this.stopDateUpdates();
  }

  setStatusBarVisibility(visible: boolean): void {
    this.statusBar.style.display = visible ? "flex" : "none";
  }

  private refreshDates(): void {
    if (this.currentNoteCreatedAt !== null) {
      const relativeCreationDate = formatting.time.formatRelativeDate(
        this.currentNoteCreatedAt,
      );
      this.createdAtDate.textContent = `Created ${relativeCreationDate}`;
    }
    if (this.currentNoteUpdatedAt !== null) {
      const relativeUpdateDate = formatting.time.formatRelativeDate(
        this.currentNoteUpdatedAt,
      );
      this.updatedAtDate.textContent = `Updated ${relativeUpdateDate}`;
    }
  }

  private startDateUpdates(): void {
    this.stopDateUpdates();
    this.dateUpdateInterval = window.setInterval(() => {
      this.refreshDates();
    }, StatusBar.DATE_UPDATE_INTERVAL_MS);
  }

  private stopDateUpdates(): void {
    if (this.dateUpdateInterval !== null) {
      clearInterval(this.dateUpdateInterval);
      this.dateUpdateInterval = null;
    }
  }
}
