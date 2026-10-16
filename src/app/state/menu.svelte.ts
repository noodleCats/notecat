export const menuState = $state<{ open: string | null }>({
  open: null,
});

export function closeMenu() {
  menuState.open = null;
}
