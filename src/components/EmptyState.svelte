<script lang="ts">
  import notecatLogo from "../assets/logo.svg?raw";
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
    align-items: center;
    justify-content: center;
  }
</style>
