import { tryResult } from "@/shared/result";
import { describe, expect, it } from "vitest";

describe("tryResult", () => {
  it("returns ok on function success", () => {
    expect(tryResult(() => void 0).ok).toBe(true);
  });

  it("returns err on function throwing", () => {
    expect(
      tryResult((): undefined => {
        throw new Error("error");
      }).ok,
    ).toBe(false);
  });

  it("returns ok on promise resolving", async () => {
    expect((await tryResult(() => Promise.resolve())).ok).toBe(true);
  });

  it("returns err on promise rejecting", async () => {
    expect((await tryResult(() => Promise.reject(new Error("error")))).ok).toBe(
      false,
    );
  });
});
