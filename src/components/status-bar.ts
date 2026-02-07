import type { TextStats } from "../types/stats.ts";
import { formatting } from "../utils/formatting.ts";

export class StatusBar {
  private static readonly DATE_UPDATE_INTERVAL_MS = 60000;

  private statusBar: HTMLElement;

  private wordCount: HTMLSpanElement;
  private characterCount: HTMLSpanElement;
  private storageUsed: HTMLSpanElement;

  private createdAtDate: HTMLSpanElement;
  private updatedAtDate: HTMLSpanElement;
  private dateUpdateInterval: number | null = null;
  private currentNoteCreatedAt: number | null = null;
  private currentNoteUpdatedAt: number | null = null;

  constructor(containerElementId: string) {
    const container = document.getElementById(containerElementId);
    if (
      !(container instanceof HTMLElement) ||
      container.localName !== "footer"
    ) {
      throw new Error("StatusBar: container is not a footer element");
    }

    container.innerHTML = `
      <div id="status-bar-left">
        <span id="created-at-date" class="status"></span>
        <span id="updated-at-date" class="status"></span>
      </div>
      <div id="status-bar-right">
        <span id="word-count" class="status"></span>
        <span id="character-count" class="status"></span>
        <span id="storage-used" class="status"></span>
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

    this.createdAtDate = getSpan("created-at-date");
    this.updatedAtDate = getSpan("updated-at-date");
    this.wordCount = getSpan("word-count");
    this.characterCount = getSpan("character-count");
    this.storageUsed = getSpan("storage-used");
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
