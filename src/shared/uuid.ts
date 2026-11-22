export type UUIDv4 = string & { readonly __brand: "UUIDv4" };

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export function isValidUUID(value: unknown): value is UUIDv4 {
  return typeof value === "string" && UUID_V4_REGEX.test(value);
}

export function getRandomUUID(): UUIDv4 {
  // `crypto.randomUUID` is only available in secure contexts (HTTPS or
  // localhost), e.g. not when the dev server is accessed over LAN via HTTP.
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID() as UUIDv4;
  }

  // `crypto.getRandomValues` is available in insecure contexts too.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const view = new DataView(bytes.buffer);
  view.setUint8(6, (view.getUint8(6) & 0x0f) | 0x40); // version 4
  view.setUint8(8, (view.getUint8(8) & 0x3f) | 0x80); // variant 10xx

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-") as UUIDv4;
}
