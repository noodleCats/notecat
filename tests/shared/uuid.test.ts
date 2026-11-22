import { getRandomUUID, isValidUUID } from "@/shared/uuid";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("getRandomUUID", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a valid UUIDv4", () => {
    expect(isValidUUID(getRandomUUID())).toBe(true);
  });

  it("returns a valid UUIDv4 when crypto.randomUUID is unavailable", () => {
    // Mimics an insecure context, where only `getRandomValues` is exposed.
    const getRandomValues = crypto.getRandomValues.bind(crypto);
    vi.stubGlobal("crypto", { getRandomValues });

    for (let i = 0; i < 100; i++) {
      expect(isValidUUID(getRandomUUID())).toBe(true);
    }
  });
});
