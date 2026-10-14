export type Timestamp = number & { readonly __brand: "Timestamp" };

export const MAX_VALID_TIMESTAMP_MS = 8.64e15;

export function isValidTimestamp(value: unknown): value is Timestamp {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= MAX_VALID_TIMESTAMP_MS
  );
}

export function getCurrentTime(): Timestamp {
  return Date.now() as Timestamp;
}
