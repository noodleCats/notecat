export function createDebouncer(
  callback: () => void,
  delayMs: number,
  maxWaitMs: number,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let maxTimer: ReturnType<typeof setTimeout> | undefined;

  function cancel(): void {
    if (timer !== undefined) clearTimeout(timer);
    if (maxTimer !== undefined) clearTimeout(maxTimer);
    timer = undefined;
    maxTimer = undefined;
  }

  function run(): void {
    cancel();
    callback();
  }

  function schedule(): void {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(run, delayMs);
    maxTimer ??= setTimeout(run, maxWaitMs);
  }

  // Runs the callback once after delayMs, replacing any pending run.
  // The next schedule() call resumes normal debouncing.
  function retry(delayMs: number): void {
    cancel();
    timer = setTimeout(run, delayMs);
  }

  return { schedule, retry, cancel };
}
