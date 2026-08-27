<script lang="ts">
  import { notekeeper } from "../app/notekeeper.svelte";
  import {
    closeActiveNote,
    createNoteAndFocus,
    exportActiveNoteAsText,
    exportAllNotesAsJson,
    importNoteFromText,
    importAllNotesFromJson,
    requestDeleteActiveNote,
    openRepo,
    toggleSidebar,
    toggleMonospace,
  } from "../app/commands";
  import Icon from "./Icon.svelte";
  import externalLinkIcon from "../assets/external-link.svg?raw";
  import { sidebarState } from "../app/state/sidebar.svelte";
  import { editorState } from "../app/state/editor.svelte";
  import {
    closeMenu,
    menuState,
    showMenu,
    toggleMenu,
  } from "../app/state/menu.svelte";

  type MenuItem = {
    label: string;
    action: () => void | Promise<void>;
    shortcut?: string;
    disabled?: boolean;
    external?: boolean;
  };

  type Menu = { id: string; label: string; items: MenuItem[] };

  let menubar: HTMLDivElement = null!;
  const activeNote = $derived(notekeeper.activeNote);

  const menus = $derived<Menu[]>([
    {
      id: "file",
      label: "file",
      items: [
        {
          label: "New note",
          shortcut: "Alt+N",
          action: createNoteAndFocus,
        },
        {
          label: "Close note",
          shortcut: "Alt+W",
          disabled: activeNote === null,
          action: closeActiveNote,
        },
        {
          label: "Import note from TXT",
          action: importNoteFromText,
        },
        {
          label: "Export note as TXT",
          disabled: activeNote === null,
          action: exportActiveNoteAsText,
        },
        {
          label: "Import all from JSON",
          action: importAllNotesFromJson,
        },
        {
          label: "Export all as JSON",
          disabled: notekeeper.notes.length === 0,
          action: exportAllNotesAsJson,
        },
        {
          label: "Delete note",
          disabled: activeNote === null,
          action: requestDeleteActiveNote,
        },
      ],
    },
    {
      id: "view",
      label: "view",
      items: [
        {
          label:
            sidebarState.visibility === "hidden"
              ? "Show sidebar"
              : "Hide sidebar",
          shortcut: "Ctrl+B",
          action: toggleSidebar,
        },
        {
          label:
            editorState.font === "monospace"
              ? "Disable monospace font"
              : "Enable monospace font",
          shortcut: "Ctrl+M",
          action: toggleMonospace,
        },
      ],
    },
    {
      id: "help",
      label: "help",
      items: [
        {
          label: "View source code",
          action: openRepo,
          external: true,
        },
      ],
    },
  ]);

  function onclick(event: MouseEvent) {
    if (!menubar.contains(event.target as Node)) {
      closeMenu();
    }
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeMenu();
    }
  }

  async function onItemClick(item: MenuItem) {
    if (item.disabled) return;
    closeMenu();
    await item.action();
  }
</script>

<svelte:document {onclick} {onkeydown} />

{#snippet menuItem(item: MenuItem)}
  <button
    type="button"
    role="menuitem"
    class="item"
    disabled={item.disabled}
    onclick={() => onItemClick(item)}
  >
    <span>{item.label}</span>
    {#if item.shortcut}
      <span class="shortcut">{item.shortcut}</span>
    {/if}
    {#if item.external}
      <Icon icon={externalLinkIcon} />
    {/if}
  </button>
{/snippet}

<div id="menubar" bind:this={menubar}>
  {#each menus as menu}
    <div class="menu">
      <button
        type="button"
        class:open={menuState.open === menu.id}
        class="trigger"
        aria-haspopup="menu"
        aria-expanded={menuState.open === menu.id}
        onclick={() => toggleMenu(menu.id)}
        onmouseenter={() => menuState.open !== null && showMenu(menu.id)}
      >
        {menu.label}
      </button>

      {#if menuState.open === menu.id}
        <div class="dropdown" role="menu">
          {#each menu.items as item}
            {@render menuItem(item)}
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  #menubar {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .menu {
    position: relative;
  }

  .trigger,
  .item {
    background: none;
    border: none;
    font: inherit;
  }

  .trigger {
    color: var(--color-text-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    transition: background-color 0.15s;

    &:hover,
    &.open {
      background-color: var(--color-bg-hover);
      cursor: pointer;
    }
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 0.35rem);
    left: 0;
    min-width: 13rem;
    padding: 0.35rem;
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    background-color: var(--color-bg-sidebar);
    box-shadow: 0 0.75rem 2rem rgb(0 0 0 / 0.18);
    z-index: 10;
  }

  .item {
    color: var(--color-text);
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    white-space: nowrap;
    gap: 1rem;
    border-radius: 0.5rem;
    padding: 0.375rem 0.5rem;

    &:hover:not(:disabled) {
      background-color: var(--color-bg-hover);
      cursor: pointer;
    }

    &:disabled {
      color: var(--color-text-tertiary);
      cursor: not-allowed;
    }
  }

  .shortcut {
    color: var(--color-text-secondary);
    font-size: 0.875rem;

    :disabled & {
      color: var(--color-text-tertiary);
    }
  }
</style>
