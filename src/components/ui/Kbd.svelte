<script lang="ts">
  import type { ShortcutKeys } from "@/types/shortcut";

  interface Props extends ShortcutKeys {
    /** Dims the keys, for a shortcut that can't be used right now */
    disabled?: boolean;
    /** Lightens the keys, for when the control showing them is hovered or focused */
    highlighted?: boolean;
  }

  let { key, ctrl, alt, shift, disabled, highlighted }: Props = $props();
</script>

{#snippet kbd(text: string)}
  <kbd
    class={[
      "rounded-md px-1 py-0.5 font-sans text-sm shadow-md [transition:inherit]",
      disabled
        ? "bg-inherit text-text-disabled"
        : [
            "text-text-secondary",
            highlighted ? "bg-bg-button-hover" : "bg-bg-button",
          ],
    ]}>{text}</kbd
  >
{/snippet}

{#snippet plus()}
  <span class={disabled ? "text-text-disabled" : "text-text-secondary"}>+</span>
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
