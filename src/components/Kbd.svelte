<script lang="ts">
  import type { Shortcut } from "@/types/shortcut";

  let { key, ctrl, alt, shift }: Shortcut = $props();
</script>

{#snippet kbd(text: string)}
  <kbd
    class={[
      "rounded-md bg-bg-button px-1 py-0.5 font-sans text-sm text-text-secondary shadow-xl",
      "group-disabled:bg-inherit group-disabled:text-text-tertiary",
      "group-not-disabled:group-hover:bg-bg-button-hover",
    ]}>{text}</kbd
  >
{/snippet}

{#snippet plus()}
  <span class="text-text-secondary group-disabled:text-text-tertiary">+</span>
{/snippet}

<span class="flex items-center gap-0.5">
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
