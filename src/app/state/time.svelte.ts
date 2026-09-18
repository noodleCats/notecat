import { getCurrentTime } from "@/shared/time";

export const DATE_UPDATE_INTERVAL_MS = 60000;

export const time = $state({ now: getCurrentTime() });

export function setDateUpdateInterval(): () => void {
  const intervalId = setInterval(() => {
    time.now = getCurrentTime();
  }, DATE_UPDATE_INTERVAL_MS);

  return () => clearInterval(intervalId);
}
