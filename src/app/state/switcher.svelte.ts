export const switcherState = $state({
  open: false,
  /** Kept between openings, so a search can be picked up again */
  query: "",
});

export function openSwitcher() {
  switcherState.open = true;
}

export function closeSwitcher() {
  switcherState.open = false;
}

export function setSwitcherQuery(value: string) {
  switcherState.query = value;
}
