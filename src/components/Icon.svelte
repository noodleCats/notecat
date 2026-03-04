<script lang="ts">
  let { icon } = $props();
</script>

<div id="icon-container">
  {@html icon}
</div>

<style>
  #icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--width, 16px);
    height: var(--height, 16px);
  }
</style>
