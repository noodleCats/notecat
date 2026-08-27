<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="chip">
  {@render children()}
</div>

<style>
  .chip {
    color: var(--color-text-secondary);
    background-color: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 0.125rem 0.5rem;
  }
</style>
