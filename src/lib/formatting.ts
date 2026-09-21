import type { FiniteNumber } from "@/types/finite";
import type { Timestamp } from "@/shared/time";

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

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function formatByteSize(bytes: FiniteNumber): string {
  const tiers = DATA_SIZE_TIERS;
  const tier = tiers.find((sizeTier) => bytes < sizeTier.limit);
  if (!tier) return "Invalid size";

  const value = bytes / tier.divisor;
  const formattedValue = Number.isInteger(value) ? value : value.toFixed(1);

  if (tier.singular && value === 1) {
    return `1 ${tier.singular}`;
  }

  return `${formattedValue} ${tier.unit}`;
}

export function formatDate(timestamp: Timestamp): string {
  const timestampDate = new Date(timestamp);

  const date = [
    timestampDate.getFullYear(),
    pad(timestampDate.getMonth() + 1),
    pad(timestampDate.getDate()),
  ].join("/");
  const time = [
    pad(timestampDate.getHours()),
    pad(timestampDate.getMinutes()),
    // pad(timestampDate.getSeconds()),
  ].join(":");

  return `${date} ${time}`;
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
