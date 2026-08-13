// this does allow dates up into the *distant* future
// and who knows if JavaScript will still exist by that point but who cares
const MAX_VALID_TIMESTAMP_MS = 8.64e15;

export function isValidTimestamp(value: number): boolean {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= MAX_VALID_TIMESTAMP_MS
  );
}
