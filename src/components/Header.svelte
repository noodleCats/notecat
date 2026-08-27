<script lang="ts">
  import Icon from "./Icon.svelte";
  import Menubar from "./Menubar.svelte";
  import notecatLogo from "../assets/logo.svg?raw";
</script>

<header>
  <div id="header-left">
    <Icon icon={notecatLogo} --width="32px" --height="28px" />
    <Menubar />
  </div>
  <div id="header-right">
    <!-- there will be something here one day ok -->
  </div>
</header>

<style>
  header {
    display: flex;
    align-items: center;
    padding: 0.6rem 1rem;
    border-bottom: 1px solid var(--color-border);
  }

  #header-left,
  #header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  #header-right {
    margin-left: auto;
  }
</style>
