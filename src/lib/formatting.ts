import type { Finite } from "@/shared/finite";
import type { Timestamp } from "@/shared/timestamp";

const DATA_SIZE_TIERS = [
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

const RELATIVE_TIME_FORMAT = new Intl.RelativeTimeFormat(undefined, {
  numeric: "always",
  style: "long",
});

const RELATIVE_TIME_UNITS = [
  { unit: "year", suffix: "y", seconds: 31_536_000 },
  { unit: "month", suffix: "mo", seconds: 2_592_000 },
  { unit: "week", suffix: "w", seconds: 604_800 },
  { unit: "day", suffix: "d", seconds: 86_400 },
  { unit: "hour", suffix: "h", seconds: 3_600 },
  { unit: "minute", suffix: "m", seconds: 60 },
] as const;

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  dateStyle: "long",
  timeStyle: "short",
});

const SHORT_DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

const PREVIEW_MAX_LENGTH = 100;

export function formatCount(count: number, noun: string): string {
  return `${count} ${noun}${Math.abs(count) === 1 ? "" : "s"}`;
}

export function formatByteSize(bytes: Finite): string {
  for (const tier of DATA_SIZE_TIERS) {
    const value = bytes / tier.divisor;
    const rounded = Math.round(value * 10) / 10;
    const upperLimit = tier.limit / tier.divisor;

    if (rounded >= upperLimit) continue;

    if (tier.singular && rounded === 1) {
      return `1 ${tier.singular}`;
    }

    return `${rounded} ${tier.unit}`;
  }

  return "Invalid size";
}

export function formatDate(timestamp: Timestamp): string {
  return DATE_FORMAT.format(timestamp);
}

export function formatShortDate(timestamp: Timestamp): string {
  return SHORT_DATE_FORMAT.format(timestamp);
}

export function formatRelativeDate(
  timestamp: Timestamp,
  relativeTo: Timestamp,
): string {
  const differenceSeconds = Math.floor((relativeTo - timestamp) / 1000);

  if (differenceSeconds < 0) {
    return "in the future";
  } else if (differenceSeconds < 60) {
    return "just now";
  }

  for (const { unit, seconds } of RELATIVE_TIME_UNITS) {
    const count = Math.floor(differenceSeconds / seconds);
    if (count >= 1) {
      return RELATIVE_TIME_FORMAT.format(-count, unit);
    }
  }

  return "just now";
}

/** Compact age for tight spaces, e.g. "now", "5m", "3h", "43d" */
export function formatShortRelativeDate(
  timestamp: Timestamp,
  relativeTo: Timestamp,
): string {
  // Clock skew between tabs can put a timestamp slightly in the future
  const differenceSeconds = Math.floor((relativeTo - timestamp) / 1000);

  for (const { suffix, seconds } of RELATIVE_TIME_UNITS) {
    const count = Math.floor(differenceSeconds / seconds);
    if (count >= 1) return `${count}${suffix}`;
  }

  return "now";
}

export function formatPreview(content: string): string {
  const head = content.slice(0, PREVIEW_MAX_LENGTH * 4);
  for (const line of head.split("\n")) {
    const trimmed = line.trim();
    if (trimmed !== "") return trimmed.slice(0, PREVIEW_MAX_LENGTH);
  }
  return "";
}
