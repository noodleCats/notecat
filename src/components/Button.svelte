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
  class={[
    "min-w-max flex-1 cursor-pointer rounded-md border px-3 py-2 transition active:scale-96",
    variant === "danger"
      ? "border-danger-border bg-danger text-neutral-50 hover:bg-danger-hover"
      : "border-border bg-bg-button text-text hover:bg-bg-button-hover",
  ]}
  bind:this={button}
  {onclick}
>
  {@render children()}
</button>
