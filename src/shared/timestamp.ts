export type Timestamp = number & { readonly __brand: "Timestamp" };

// this does allow dates up into the *distant* future
// and who knows if JavaScript will still exist by that point but who cares
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
