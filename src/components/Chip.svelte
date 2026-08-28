<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div
  class="text-text-secondary bg-bg border border-border rounded-md py-0.5 px-2"
>
  {@render children()}
</div>
