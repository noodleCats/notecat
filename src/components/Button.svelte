<script lang="ts">
  import type { Button } from "../types/button";

  let { label, onclick, variant }: Button = $props();
  let button: HTMLButtonElement = null!;

  export function focus() {
    button.focus();
  }
</script>

<button
  type="button"
  class="button"
  class:danger={variant === "danger"}
  bind:this={button}
  {onclick}
>
  {label}
</button>

<style>
  .button {
    color: var(--color-text);
    background-color: var(--color-bg-button);
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition:
      color var(--default-transition-duration),
      background-color var(--default-transition-duration);

    &:is(:hover, :focus-visible) {
      background-color: var(--color-bg-button-hover);
    }
  }

  .button.danger {
    color: var(--color-neutral-50);
    background-color: var(--color-danger);
    border-color: var(--color-danger-border);

    &:is(:hover, :focus-visible) {
      background-color: var(--color-danger-hover);
    }
  }
</style>
