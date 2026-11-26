<script lang="ts">
  import type { Snippet } from "svelte";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import type { ShortcutKeys } from "@/types/shortcut";
  import Kbd from "@/components/ui/Kbd.svelte";
  import { getMenubarContext } from "./context";

  interface Props {
    /** Runs after the menu closes */
    onclick: () => void | Promise<void>;
    shortcut?: ShortcutKeys;
    disabled?: boolean;
    /** Marks the item as opening an external page */
    external?: boolean;
    children: Snippet;
  }

  let { onclick, shortcut, disabled, external, children }: Props = $props();

  const menubar = getMenubarContext();

  async function onItemClick() {
    if (disabled) return;
    menubar.close();
    await onclick();
  }

  // The pointer moves focus too, so mouse and keyboard share one highlight
  function onpointermove(event: PointerEvent) {
    const item = event.currentTarget as HTMLElement;
    if (disabled) item.closest<HTMLElement>('[role="menu"]')?.focus();
    else if (document.activeElement !== item) item.focus();
  }

  function onpointerleave(event: PointerEvent) {
    (event.currentTarget as HTMLElement)
      .closest<HTMLElement>('[role="menu"]')
      ?.focus();
  }
</script>

<!--
  `aria-disabled` rather than `disabled`, so arrow keys can still reach the item
  and screen readers announce it as unavailable
-->
<button
  type="button"
  role="menuitem"
  tabindex="-1"
  class="
    group flex w-full items-center justify-between gap-4 rounded-lg border-none
    bg-none px-2 py-1.5 whitespace-nowrap text-text outline-none
    not-aria-disabled:hover:cursor-pointer focus:bg-bg-sidebar-hover
    aria-disabled:cursor-not-allowed aria-disabled:text-text-disabled
  "
  aria-disabled={disabled}
  onclick={onItemClick}
  {onpointermove}
  {onpointerleave}
>
  <span>{@render children()}</span>
  {#if shortcut}
    <Kbd {...shortcut} />
  {/if}
  {#if external}
    <span class="text-icon">
      <ExternalLink size={16} />
    </span>
  {/if}
</button>
