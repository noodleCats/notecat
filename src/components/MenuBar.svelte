<script lang="ts">
  import { notekeeper } from "../core/notekeeper.svelte";
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
  } from "../utils/commands";
  import Icon from "./Icon.svelte";
  import externalLinkIcon from "../assets/external-link.svg?raw";
  import { sidebarState } from "../core/state/sidebar.svelte";
  import { editorState } from "../core/state/editor.svelte";
  import { menuState } from "../core/state/menu.svelte";

  type MenuItem = {
    label: string;
    shortcut?: string;
    disabled?: boolean;
    action?: () => void | Promise<void>;
    external?: boolean;
  };

  let root: HTMLDivElement = null!;
  const activeNote = $derived(notekeeper.activeNote);

  const menus = $derived.by<{ id: string; label: string; items: MenuItem[] }[]>(
    () => [
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
    ],
  );

  function showMenu(menuId: string) {
    menuState.open = menuId;
  }

  function toggleMenu(menuId: string) {
    menuState.open = menuState.open === menuId ? null : menuId;
  }

  function closeMenu() {
    menuState.open = null;
  }

  function onclick(event: MouseEvent) {
    if (!root.contains(event.target as Node)) {
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
    await item.action?.();
  }
</script>

<svelte:document {onclick} {onkeydown} />

<div id="menu-bar" bind:this={root}>
  {#each menus as menu}
    <div class="menu-group">
      <button
        type="button"
        class:open={menuState.open === menu.id}
        class="menu-trigger"
        aria-haspopup="menu"
        aria-expanded={menuState.open === menu.id}
        onclick={() => toggleMenu(menu.id)}
        onmouseenter={() => menuState.open !== null && showMenu(menu.id)}
      >
        {menu.label}
      </button>

      {#if menuState.open === menu.id}
        <div class="menu-dropdown" role="menu">
          {#each menu.items as item}
            <button
              type="button"
              role="menuitem"
              class="menu-item"
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
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  #menu-bar {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .menu-group {
    position: relative;
  }

  .menu-trigger,
  .menu-item {
    background: none;
    border: none;
    font: inherit;
  }

  .menu-trigger {
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

  .menu-dropdown {
    position: absolute;
    top: calc(100% + 0.35rem);
    left: 0;
    min-width: 13rem;
    width: fit-content;
    padding: 0.35rem;
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    background-color: var(--color-bg-sidebar);
    box-shadow: 0 0.75rem 2rem rgb(0 0 0 / 0.18);
    z-index: 10;
  }

  .menu-item {
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
      cursor: not-allowed;
    }
  }
</style>
