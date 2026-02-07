import type { TextStats, FormattedTextStats } from "../types/stats.ts";

class StatFormatter {
  private static readonly LOCALSTORAGE_QUOTA_BYTES = 5 * 1_000_000;
  private static readonly DATA_SIZE_TIERS = [
    {
      limit: 1_000,
      divisor: 1,
      unit: "bytes",
      singular: "byte",
    },
    {
      limit: 1_000_000,
      divisor: 1_000,
      unit: "kB",
    },
    {
      limit: Infinity,
      divisor: 1_000_000,
      unit: "MB",
    },
  ];

  formatWordCount(count: number): string {
    return `${count} ${count === 1 ? "word" : "words"}`;
  }

  formatCharacterCount(count: number): string {
    return `${count} ${count === 1 ? "char" : "chars"}`;
  }

  formatStorageUsedBytes(bytes: number): string {
    if (bytes < 0 || !Number.isFinite(bytes))
      throw new Error(
        `formatStorageUsedBytes: ${bytes} is not a valid number of bytes`,
      );

    const tiers = StatFormatter.DATA_SIZE_TIERS;

    const tier =
      tiers.find((tier) => bytes < tier.limit) ?? tiers[tiers.length - 1];
    const value = bytes / tier.divisor;
    const formattedValue = Number.isInteger(value) ? value : value.toFixed(1);

    const storageUsed = bytes / StatFormatter.LOCALSTORAGE_QUOTA_BYTES;
    const formattedStorageUsed = `${(storageUsed * 100).toFixed(2)}%`;

    if (tier.singular && value === 1) {
      return `1 ${tier.singular} (${formattedStorageUsed})`;
    } else {
      return `${formattedValue} ${tier.unit} (${formattedStorageUsed})`;
    }
  }

  formatTextStats(stats: TextStats): FormattedTextStats {
    return {
      wordCount: this.formatWordCount(stats.wordCount),
      characterCount: this.formatCharacterCount(stats.characterCount),
      storageUsed: this.formatStorageUsedBytes(stats.storageUsedBytes),
    };
  }
}

class TimeFormatter {
  formatDate(timestamp: number): string {
    if (!Number.isFinite(timestamp))
      throw new Error(`formatDate: ${timestamp} is not a valid Unix timestamp`);

    const timestampDate = new Date(timestamp);
    const pad = (n: number) => String(n).padStart(2, "0");

    const date = [
      timestampDate.getFullYear(),
      pad(timestampDate.getMonth() + 1),
      pad(timestampDate.getDate()),
    ].join("/");
    const time = [
      pad(timestampDate.getHours()),
      pad(timestampDate.getMinutes()),
      pad(timestampDate.getSeconds()),
    ].join(":");

    return `${date} ${time}`;
  }

  formatRelativeDate(timestamp: number): string {
    if (!Number.isFinite(timestamp))
      throw new Error(
        `formatRelativeDate: ${timestamp} is not a valid Unix timestamp`,
      );

    const differenceSeconds = Math.floor((Date.now() - timestamp) / 1000);

    if (differenceSeconds < 0) {
      return "in the future";
    } else if (differenceSeconds < 60) {
      return "just now";
    }

    const relativeTimeFormat = new Intl.RelativeTimeFormat(undefined, {
      numeric: "always",
      style: "long",
    });

    const units = [
      { unit: "year", seconds: 31536000 },
      { unit: "month", seconds: 2592000 },
      { unit: "week", seconds: 604800 },
      { unit: "day", seconds: 86400 },
      { unit: "hour", seconds: 3600 },
      { unit: "minute", seconds: 60 },
    ] as const;

    for (const { unit, seconds } of units) {
      const count = Math.floor(differenceSeconds / seconds);
      if (count >= 1) {
        return relativeTimeFormat.format(-count, unit);
      }
    }

    return "just now";
  }
}

export const formatting = {
  stat: new StatFormatter(),
  time: new TimeFormatter(),
};
