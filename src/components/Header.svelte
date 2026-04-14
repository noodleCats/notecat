<script lang="ts">
  import Icon from "./Icon.svelte";
  import MenuBar from "./MenuBar.svelte";
  import notecatLogo from "/notecat.svg?raw";
</script>

<header>
  <div id="header-left">
    <Icon icon={notecatLogo} --width="32px" --height="28px" />
    <h1>Notecat</h1>
  </div>
  <MenuBar />
  <div id="header-right"></div>
</header>

<style>
  header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.6rem 1rem;
    border-bottom: 1px solid var(--color-border);
  }

  h1 {
    font-size: 1.25rem;
  }

  #header-left,
  #header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  #header-right {
    margin-left: auto;
  }
</style>
