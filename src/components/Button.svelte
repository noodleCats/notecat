<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    onclick: () => void;
    variant?: "default" | "danger";
    children: Snippet;
  }

  let { onclick, variant, children }: Props = $props();
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
  {@render children()}
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
