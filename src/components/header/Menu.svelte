<script lang="ts">
  import type { Snippet } from "svelte";
  import { menuState, showMenu, toggleMenu } from "@/app/state/menu.svelte";

  interface Props {
    /** Shown on the trigger button; also identifies the menu in `menuState` */
    label: string;
    /** The menu items */
    children: Snippet;
    /** Non-interactive content shown below the items */
    footer?: Snippet;
  }

  let { label, children, footer }: Props = $props();
  const open = $derived(menuState.open === label);
</script>

<div class="relative">
  <button
    type="button"
    class={[
      "rounded-md border-none bg-none px-2 py-1 text-text-secondary",
      "transition-colors",
      "hover:cursor-pointer hover:bg-bg-hover",
      open && "cursor-pointer bg-bg-hover",
    ]}
    aria-haspopup="menu"
    aria-expanded={open}
    onclick={() => toggleMenu(label)}
    onmouseenter={() => menuState.open !== null && showMenu(label)}
  >
    {label}
  </button>

  {#if open}
    <div
      class="absolute z-10 rounded-xl border border-border bg-bg-sidebar p-1.5 shadow-md"
    >
      <div role="menu" aria-label={label}>
        {@render children()}
      </div>
      <!-- Outside the menu role, which may only hold menu items -->
      {@render footer?.()}
    </div>
  {/if}
</div>
