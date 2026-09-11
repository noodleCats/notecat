<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    onclick: () => void;
    children: Snippet;
    title?: string;
  }

  let { onclick, children, title }: Props = $props();
</script>

<button
  class={[
    "rounded-sm bg-none p-1.5 text-icon hover:text-icon-hover",
    "transition-colors hover:cursor-pointer hover:bg-bg-hover",
  ]}
  type="button"
  {title}
  {onclick}
>
  {@render children()}
</button>
