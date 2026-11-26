<script lang="ts">
  import { onMount, tick, type Snippet } from "svelte";
  import { getMenubarContext } from "./context";

  interface Props {
    /** Shown on the trigger button; also identifies the menu in the menubar */
    label: string;
    /** `MenuItem`s, `MenuSeparator`s, or any other content */
    children: Snippet;
  }

  let { label, children }: Props = $props();

  const menubar = getMenubarContext();
  const open = $derived(menubar.open === label);

  onMount(() => menubar.register(label));

  let menu = $state<HTMLDivElement>();

  async function onclick(event: MouseEvent) {
    const opening = !open;
    menubar.toggle(label);
    // Safari doesn't focus buttons on click, and the menubar's keys need focus
    (event.currentTarget as HTMLElement).focus();

    // Enter and Space also fire `click`, with no clicks counted. Keyboard users
    // land on the first item; mouse users start with nothing highlighted
    if (opening && event.detail === 0) {
      await tick();
      menu?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    }
  }

  function onmouseenter(event: MouseEvent) {
    if (menubar.open !== null && !open) {
      menubar.show(label);
      // Focus was in the menu that just closed, so keep it in the menubar
      (event.currentTarget as HTMLElement).focus();
    }
  }

  // The rest of the keyboard navigation lives in `Menubar`, which sees every menu
</script>

<div class="relative" data-menu={label}>
  <button
    type="button"
    role="menuitem"
    tabindex={menubar.tabStop === label ? 0 : -1}
    class={[
      "rounded-md border-none bg-none px-2 py-1 text-text-secondary outline-none",
      "transition-colors",
      "hover:cursor-pointer hover:bg-bg-hover focus-visible:bg-bg-hover",
      open && "cursor-pointer bg-bg-hover",
    ]}
    aria-haspopup="menu"
    aria-expanded={open}
    {onclick}
    {onmouseenter}
  >
    {label}
  </button>

  {#if open}
    <!-- Focusable so focus has somewhere to rest between items -->
    <div
      bind:this={menu}
      role="menu"
      aria-label={label}
      tabindex="-1"
      class="absolute z-10 rounded-xl border border-border bg-bg-sidebar p-1.5 shadow-md outline-none"
    >
      {@render children()}
    </div>
  {/if}
</div>
