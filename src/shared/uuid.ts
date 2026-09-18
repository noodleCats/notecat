export type UUIDv4 = string & { readonly __brand: "UUIDv4" };

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export function isValidUUID(value: unknown): value is UUIDv4 {
  return typeof value === "string" && UUID_V4_REGEX.test(value);
}

export function getRandomUUID(): UUIDv4 {
  return crypto.randomUUID() as UUIDv4;
}
