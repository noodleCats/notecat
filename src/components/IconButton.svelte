<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    onclick: () => void;
    children: Snippet;
    ariaLabel: string;
    title?: string;
  }

  let { onclick, children, ariaLabel, title }: Props = $props();
</script>

<button
  class={[
    "rounded-sm bg-none p-1.5 text-icon hover:text-icon-hover",
    "transition-colors hover:cursor-pointer hover:bg-bg-hover",
  ]}
  type="button"
  aria-label={ariaLabel}
  {title}
  {onclick}
>
  {@render children()}
</button>
