<script lang="ts">
  import { tick, type Snippet } from "svelte";
  import { setMenubarContext } from "./context";

  interface Props {
    /** Label of the open menu, or `null` when all are closed */
    open?: string | null;
    /** `Menu`s, each a trigger with its dropdown */
    children: Snippet;
  }

  let { open = $bindable(null), children }: Props = $props();

  let tabStop = $state<string | null>(null);
  let menubar: HTMLDivElement;

  function show(label: string) {
    open = label;
  }

  function close() {
    open = null;
  }

  setMenubarContext({
    get open() {
      return open;
    },
    get tabStop() {
      return tabStop;
    },
    show,
    toggle: (label) => (open === label ? close() : show(label)),
    close,
    register: (label) => (tabStop ??= label),
  });

  function onclick(event: MouseEvent) {
    if (!menubar.contains(event.target as Node)) {
      close();
    }
  }

  function ondocumentkeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      close();
    }
  }

  // Keyboard navigation follows the WAI-ARIA menubar pattern:
  // https://www.w3.org/WAI/ARIA/apg/patterns/menubar/

  function getMenus() {
    return Array.from(menubar.querySelectorAll<HTMLElement>("[data-menu]"));
  }

  function getLabel(menu: HTMLElement) {
    return menu.dataset.menu ?? "";
  }

  function getTrigger(menu: HTMLElement) {
    return menu.querySelector<HTMLElement>(":scope > button");
  }

  function getItems(menu: HTMLElement) {
    return Array.from(
      menu.querySelectorAll<HTMLElement>('[role="menu"] [role="menuitem"]'),
    );
  }

  /** Index `index` of `list`, wrapping around both ends */
  function wrap<T>(list: T[], index: number): T {
    return list[(index + list.length) % list.length];
  }

  async function openAndFocus(menu: HTMLElement, item: "first" | "last") {
    show(getLabel(menu));
    await tick();
    const items = getItems(menu);
    (item === "first" ? items[0] : items.at(-1))?.focus();
  }

  /** The next item whose label starts with `char`, searching after `from` */
  function findByFirstLetter(items: HTMLElement[], from: number, char: string) {
    for (let offset = 1; offset <= items.length; offset++) {
      const item = wrap(items, from + offset);
      const text = item.textContent?.trim().toLowerCase() ?? "";
      if (text.startsWith(char.toLowerCase())) return item;
    }
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    const target = event.target as HTMLElement;
    const menu = target.closest<HTMLElement>("[data-menu]");
    if (!menu) return;

    const menus = getMenus();
    const menuIndex = menus.indexOf(menu);
    const inMenu = target.closest('[role="menu"]') !== null;

    if (inMenu) {
      const items = getItems(menu);
      const itemIndex = items.indexOf(target);

      switch (event.key) {
        case "ArrowDown":
          wrap(items, itemIndex + 1).focus();
          break;
        case "ArrowUp":
          // From the menu itself (nothing highlighted), start at the bottom
          wrap(items, itemIndex === -1 ? -1 : itemIndex - 1).focus();
          break;
        case "Home":
          items[0]?.focus();
          break;
        case "End":
          items.at(-1)?.focus();
          break;
        case "ArrowRight":
        case "ArrowLeft": {
          const step = event.key === "ArrowRight" ? 1 : -1;
          void openAndFocus(wrap(menus, menuIndex + step), "first");
          break;
        }
        case "Escape":
          close();
          getTrigger(menu)?.focus();
          break;
        default:
          if (event.key.length !== 1 || event.key === " ") return;
          findByFirstLetter(items, itemIndex, event.key)?.focus();
      }
    } else {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowLeft": {
          const step = event.key === "ArrowRight" ? 1 : -1;
          const next = wrap(menus, menuIndex + step);
          // Moving along the menubar keeps a menu open if one already was
          if (open !== null) show(getLabel(next));
          getTrigger(next)?.focus();
          break;
        }
        case "Home":
          getTrigger(menus[0])?.focus();
          break;
        case "End":
          getTrigger(wrap(menus, -1))?.focus();
          break;
        case "ArrowDown":
          void openAndFocus(menu, "first");
          break;
        case "ArrowUp":
          void openAndFocus(menu, "last");
          break;
        default:
          return;
      }
    }

    event.preventDefault();
  }

  function onfocusin(event: FocusEvent) {
    const target = event.target as HTMLElement;
    const menu = target.closest<HTMLElement>("[data-menu]");
    if (menu && getTrigger(menu) === target) {
      tabStop = getLabel(menu);
    }
  }

  // Tab, or anything else that takes focus out of the menubar, closes the menu.
  // Clicks on unfocusable parts of the page have no `relatedTarget`, and are
  // handled by `onclick` above instead
  function onfocusout(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (next !== null && !menubar.contains(next)) close();
  }
</script>

<svelte:document {onclick} onkeydown={ondocumentkeydown} />

<div
  class="flex min-w-0 items-center"
  role="menubar"
  tabindex="-1"
  bind:this={menubar}
  {onkeydown}
  {onfocusin}
  {onfocusout}
>
  {@render children()}
</div>
