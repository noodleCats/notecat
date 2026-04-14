<script lang="ts">
  import notecatLogo from "/notecat.svg?raw";
  import Icon from "./Icon.svelte";
</script>

<div id="empty">
  <Icon icon={notecatLogo} --width="12rem" --height="10.5rem" />
</div>

<style>
  #empty {
    color: var(--color-bg-hover);
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
  }
</style>
