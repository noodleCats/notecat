// The pointer moves focus too, so mouse and keyboard share one highlight

/** A pointer event from a listener on an element, as Svelte types handlers */
type ItemPointerEvent = PointerEvent & { currentTarget: HTMLElement };

/** Focuses the item under the pointer, or the menu itself for a disabled item */
export function focusOnPointerMove(event: ItemPointerEvent, disabled = false) {
  const item = event.currentTarget;
  if (disabled) item.closest<HTMLElement>('[role="menu"]')?.focus();
  else if (document.activeElement !== item) item.focus();
}

/** Parks focus on the menu once the pointer leaves an item */
export function blurOnPointerLeave(event: ItemPointerEvent) {
  event.currentTarget.closest<HTMLElement>('[role="menu"]')?.focus();
}
