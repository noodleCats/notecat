import { formatByteSize, formatCount } from "@/lib/formatting";
import type { FiniteNumber } from "@/types/finite";
import { describe, expect, it } from "vitest";

describe("formatCount", () => {
  it("formats singular labels without an 's' at the end", () => {
    expect(formatCount(1, "test")).toBe("1 test");
    expect(formatCount(-1, "test")).toBe("-1 test");
  });

  it("formats plural labels with an 's' at the end", () => {
    expect(formatCount(500, "test")).toBe("500 tests");
    expect(formatCount(-10, "test")).toBe("-10 tests");
  });

  it("formats count of 0 with a plural", () => {
    expect(formatCount(0, "test")).toBe("0 tests");
  });
});

describe("formatByteSize", () => {
  it("returns '0 bytes' for a byte size of 0", () => {
    expect(formatByteSize(0 as FiniteNumber)).toBe("0 bytes");
  });

  it("returns '1 byte' for a byte size of 1", () => {
    expect(formatByteSize(1 as FiniteNumber)).toBe("1 byte");
  });

  it("format values from 2 to 999 with 'bytes'", () => {
    expect(formatByteSize(2 as FiniteNumber)).toBe("2 bytes");
    expect(formatByteSize(999 as FiniteNumber)).toBe("999 bytes");
  });

  it("formats values from 1_000 to 999_949 with 'kB'", () => {
    expect(formatByteSize(1_000 as FiniteNumber)).toBe("1 kB");
    expect(formatByteSize(999_949 as FiniteNumber)).toBe("999.9 kB");
  });

  it("promotes rounded up 'kB' values to 'MB'", () => {
    expect(formatByteSize(999_949 as FiniteNumber)).toBe("999.9 kB");
    expect(formatByteSize(999_950 as FiniteNumber)).toBe("1 MB");
    expect(formatByteSize(999_999 as FiniteNumber)).toBe("1 MB");
  });

  it("formats values at and above 1_000_000 with 'MB' ", () => {
    expect(formatByteSize(1_000_000 as FiniteNumber)).toBe("1 MB");
    expect(formatByteSize(4_000_000 as FiniteNumber)).toBe("4 MB");
    expect(formatByteSize(1_000_000_000 as FiniteNumber)).toBe("1000 MB");
  });

  it("rounds fractional sizes to one decimal place", () => {
    expect(formatByteSize(1_240 as FiniteNumber)).toBe("1.2 kB");
    expect(formatByteSize(1_260 as FiniteNumber)).toBe("1.3 kB");
    expect(formatByteSize(1_240_000 as FiniteNumber)).toBe("1.2 MB");
    expect(formatByteSize(1_260_000 as FiniteNumber)).toBe("1.3 MB");
  });

  it("omits decimals for whole converted sizes", () => {
    expect(formatByteSize(2_000 as FiniteNumber)).toBe("2 kB");
    expect(formatByteSize(25_000 as FiniteNumber)).toBe("25 kB");
    expect(formatByteSize(2_000_000 as FiniteNumber)).toBe("2 MB");
  });
});
