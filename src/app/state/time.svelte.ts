import { getCurrentTime } from "@/shared/timestamp";

export const TICK_INTERVAL_MS = 60000;

let tick = $state(0);
export const time = {
  get now() {
    void tick;
    return getCurrentTime();
  },
};

export function setTickInterval(): () => void {
  const intervalId = setInterval(() => {
    tick += 1;
  }, TICK_INTERVAL_MS);

  return () => clearInterval(intervalId);
}
