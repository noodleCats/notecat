<script lang="ts">
  import notecatLogo from "/notecat.svg?raw";
  import Icon from "./Icon.svelte";
  import Chip from "./Chip.svelte";
</script>

<div id="empty">
  <Icon icon={notecatLogo} --width="12rem" --height="10.5rem" />
  <div id="empty-hints">
    <div class="hint">
      <p>New note</p>
      <span>
        <Chip content="Alt" />
        <Chip content="N" />
      </span>
    </div>

    <div class="hint">
      <p>Close note</p>
      <span>
        <Chip content="Alt" />
        <Chip content="W" />
      </span>
    </div>

    <div class="hint">
      <p>Toggle sidebar</p>
      <span>
        <Chip content="Ctrl" />
        <Chip content="B" />
      </span>
    </div>
  </div>
</div>

<style>
  #empty {
    color: var(--color-border);
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
  }

  #empty-hints {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 16rem;

    .hint {
      display: flex;
      align-items: center;
      justify-content: space-between;

      span {
        display: flex;
        gap: 0.25rem;
      }

      p {
        color: var(--color-text-secondary);
      }
    }
  }
</style>
