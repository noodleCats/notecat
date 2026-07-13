<script lang="ts">
  import Icon from "./Icon.svelte";
  import MenuBar from "./MenuBar.svelte";
  import notecatLogo from "../assets/logo.svg?raw";
</script>

<header>
  <div id="header-left">
    <Icon icon={notecatLogo} --width="32px" --height="28px" />
  </div>
  <MenuBar />
  <div id="header-right"></div>
</header>

<style>
  header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 1rem;
    border-bottom: 1px solid var(--color-border);
  }

  #header-left,
  #header-right {
    display: flex;
    align-items: center;
  }

  #header-right {
    margin-left: auto;
  }
</style>
