import { afterEach, describe, expect, it, vi } from "vitest";
import { createDebouncer } from "@/lib/debounce";

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("createDebouncer", () => {
  it("waits until typing has stopped for one second", () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const debouncer = createDebouncer(save, 1_000, 5_000);

    debouncer.schedule();
    vi.advanceTimersByTime(800);

    debouncer.schedule();
    vi.advanceTimersByTime(999);
    expect(save).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("triggers max wait timer with continuous rescheduling", () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const debouncer = createDebouncer(save, 1_000, 5_000);

    const scheduleInterval = 500;
    for (let elapsed = 0; elapsed < 10_000; elapsed += scheduleInterval) {
      debouncer.schedule();
      vi.advanceTimersByTime(scheduleInterval);
    }

    expect(save).toHaveBeenCalledTimes(2);
  });
});
