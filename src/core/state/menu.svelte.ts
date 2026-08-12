export const menuState = $state<{ open: string | null }>({
  open: null,
});

export function showMenu(menuId: string) {
  menuState.open = menuId;
}

export function toggleMenu(menuId: string) {
  menuState.open = menuState.open === menuId ? null : menuId;
}

export function closeMenu() {
  menuState.open = null;
}
