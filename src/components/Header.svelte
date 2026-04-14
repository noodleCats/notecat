<script lang="ts">
  import Icon from "./Icon.svelte";
  import MenuBar from "./MenuBar.svelte";
  import notecatLogo from "../assets/logo.svg?raw";

  interface Props {
    titleHidden: boolean;
  }

  let { titleHidden }: Props = $props();
</script>

<header>
  <div id="header-left">
    <Icon icon={notecatLogo} --width="32px" --height="28px" />
    <h1 class:collapsed={titleHidden}>Notecat</h1>
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

  h1 {
    font-size: 1.25rem;
    margin: 0 0 0 0.5rem;
    max-width: 12rem;
    overflow: hidden;
    white-space: nowrap;
    transition:
      opacity 0.15s,
      max-width 0.15s,
      margin 0.15s;

    &.collapsed {
      opacity: 0;
      max-width: 0;
      margin: 0;
    }
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
