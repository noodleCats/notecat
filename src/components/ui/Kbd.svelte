<script lang="ts">
  import type { ShortcutKeys } from "@/types/shortcut";

  let { key, ctrl, alt, shift }: ShortcutKeys = $props();
</script>

{#snippet kbd(text: string)}
  <kbd
    class={[
      "rounded-md bg-bg-button px-1 py-0.5 font-sans text-sm text-text-secondary shadow-md",
      "[transition:inherit]",
      "group-aria-disabled:bg-inherit group-aria-disabled:text-text-disabled",
      "group-not-aria-disabled:group-hover:bg-bg-button-hover",
      "group-not-aria-disabled:group-focus:bg-bg-button-hover",
    ]}>{text}</kbd
  >
{/snippet}

{#snippet plus()}
  <span class="text-text-secondary group-aria-disabled:text-text-disabled">+</span>
{/snippet}

<span class="flex items-center gap-0.5 [transition:inherit]">
  {#if ctrl}
    {@render kbd("Ctrl")}
    {@render plus()}
  {/if}

  {#if alt}
    {@render kbd("Alt")}
    {@render plus()}
  {/if}

  {#if shift}
    {@render kbd("Shift")}
    {@render plus()}
  {/if}

  {@render kbd(key)}
</span>
