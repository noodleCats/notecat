<script lang="ts">
  import Icon from "./Icon.svelte";
  import notecatLogo from "/notecat.svg?raw";
  import githubIcon from "../assets/github.svg?raw";
</script>

<header>
  <div id="header-left">
    <Icon icon={notecatLogo} --width="32px" --height="28px" />
    <h1>Notecat</h1>
  </div>
  <div id="header-right">
    <a
      href="https://github.com/noodleCats/notecat"
      aria-label="View source code on GitHub"
      target="_blank"
      rel="noopener noreferrer"
      class="link"
    >
      <Icon icon={githubIcon} --width="20px" --height="20px" />
    </a>
  </div>
</header>

<style>
  header {
    display: flex;
    flex-direction: row;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border);

    div {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    div#header-left {
      justify-self: flex-start;
    }

    div#header-right {
      justify-self: flex-end;
      margin-left: auto;
    }
  }

  h1 {
    font-size: 1.25rem;
  }

  .link {
    color: var(--color-icon);
    transition: color 0.2s;

    &:hover {
      color: var(--color-icon-hover);
    }
  }
</style>
