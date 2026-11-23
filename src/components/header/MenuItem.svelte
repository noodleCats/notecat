<script lang="ts">
  import type { Snippet } from "svelte";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import { closeMenu } from "@/app/state/menu.svelte";
  import type { ShortcutKeys } from "@/types/shortcut";
  import Kbd from "@/components/ui/Kbd.svelte";

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

  async function onItemClick() {
    closeMenu();
    await onclick();
  }
</script>

<button
  type="button"
  role="menuitem"
  class="
    group flex w-full items-center justify-between gap-4 rounded-lg border-none
    bg-none px-2 py-1.5 whitespace-nowrap text-text
    not-disabled:hover:cursor-pointer not-disabled:hover:bg-bg-sidebar-hover
    disabled:cursor-not-allowed disabled:text-text-disabled
  "
  {disabled}
  onclick={onItemClick}
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
