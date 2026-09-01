<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div
  class="rounded-md border border-border bg-bg px-2 py-0.5 text-text-secondary"
>
  {@render children()}
</div>
