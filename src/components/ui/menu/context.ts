import { createContext } from "svelte";

/** Shared by a `Menubar` with the menus and items inside it */
export interface MenubarContext {
  /** Label of the open menu */
  readonly open: string | null;
  /** Label of the one trigger reachable with Tab (roving tabindex) */
  readonly tabStop: string | null;
  show(label: string): void;
  toggle(label: string): void;
  close(): void;
  /** Called by each menu as it mounts; the first becomes the tab stop */
  register(label: string): void;
}

export const [getMenubarContext, setMenubarContext] =
  createContext<MenubarContext>();
