export const DATE_UPDATE_INTERVAL_MS = 60000;

export const time = $state({ now: Date.now() });

export function setDateUpdateInterval(): () => void {
  const intervalId = setInterval(() => {
    time.now = Date.now();
  }, DATE_UPDATE_INTERVAL_MS);

  return () => clearInterval(intervalId);
}
