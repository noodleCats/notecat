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
    width: var(--width, 20px);
    height: var(--height, 20px);
  }
</style>
