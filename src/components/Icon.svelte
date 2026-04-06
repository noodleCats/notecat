<script lang="ts">
  interface Props {
    icon: string; // SVGs are strings when imported ?raw
  }

  let { icon }: Props = $props();
</script>

<div class="icon-container">
  {@html icon}
</div>

<style>
  .icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--width, 16px);
    height: var(--height, 16px);
  }
</style>
