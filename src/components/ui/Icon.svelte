<script lang="ts">
  interface Props {
    icon: string; // SVGs are strings when imported ?raw
    // Accessible name.
    // Omit for decorative icons, which are hidden from the accessibility tree
    label?: string;
  }

  let { icon, label }: Props = $props();
</script>

<div
  class="size flex items-center justify-center"
  role={label ? "img" : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : "true"}
>
  {@html icon}
</div>

<style>
  .size {
    width: var(--size, 20px);
    height: var(--size, 20px);
  }
</style>
