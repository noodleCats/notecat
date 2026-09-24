import { getCurrentTime } from "@/shared/time";

export const DATE_UPDATE_INTERVAL_MS = 60000;

let tick = $state(0);

export const time = {
  get now() {
    void tick;
    return getCurrentTime();
  },
};

export function setDateUpdateInterval(): () => void {
  const intervalId = setInterval(() => {
    tick += 1;
  }, DATE_UPDATE_INTERVAL_MS);

  return () => clearInterval(intervalId);
}
