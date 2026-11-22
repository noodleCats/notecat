<script lang="ts">
  interface Props {
    icon: string; // SVGs are strings when imported ?raw
  }

  let { icon }: Props = $props();
</script>

<div class="size flex items-center justify-center">
  {@html icon}
</div>

<style>
  .size {
    width: var(--size, 20px);
    height: var(--size, 20px);
  }
</style>
