import { err, ok, type Result } from "../shared/result";

const MAX_TIMESTAMP_VALUE = 8.64e15;
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

function isValidTimestamp(value: number): boolean {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= MAX_TIMESTAMP_VALUE
  );
}

export function formatWordCount(count: number): string {
  return `${count} ${count === 1 ? "word" : "words"}`;
}

export function formatCharacterCount(count: number): string {
  return `${count} ${count === 1 ? "character" : "characters"}`;
}

export function formatStorageUsedBytes(bytes: number): Result<string> {
  if (!Number.isFinite(bytes))
    return err(new Error(`${bytes} is not a valid amount of bytes`));

  const tiers = DATA_SIZE_TIERS;

  const tier =
    tiers.find((sizeTier) => bytes < sizeTier.limit) ?? tiers.at(-1)!;
  const value = bytes / tier.divisor;
  const formattedValue = Number.isInteger(value) ? value : value.toFixed(1);

  if (tier.singular && value === 1) {
    return ok(`1 ${tier.singular}`);
  }

  return ok(`${formattedValue} ${tier.unit}`);
}

export function formatDate(timestamp: number): Result<string> {
  if (!isValidTimestamp(timestamp))
    return err(new Error(`${timestamp} is not a valid timestamp`));

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

  return ok(`${date} ${time}`);
}

export function formatRelativeDate(timestamp: number): Result<string> {
  if (!isValidTimestamp(timestamp))
    return err(new Error(`${timestamp} is not a valid timestamp`));

  const differenceSeconds = Math.floor((Date.now() - timestamp) / 1000);

  if (differenceSeconds < 0) {
    return ok("in the future");
  } else if (differenceSeconds < 60) {
    return ok("just now");
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
      return ok(relativeTimeFormat.format(-count, unit));
    }
  }

  return ok("just now");
}
