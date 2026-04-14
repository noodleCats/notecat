<script lang="ts">
  import { onMount } from "svelte";
  import { notekeeper } from "../lib/notekeeper.svelte";
  import {
    closeActiveNote,
    createNoteAndFocus,
    dispatchSidebarToggle,
    requestDeleteActiveNote,
    openRepo,
  } from "../lib/commands";
  import Icon from "./Icon.svelte";
  import externalLinkIcon from "../assets/external-link.svg?raw";

  type MenuItem = {
    label: string;
    shortcut?: string;
    disabled?: boolean;
    action?: () => void | Promise<void>;
    external?: boolean;
  };

  let root: HTMLDivElement = null!;
  let openMenu = $state<string | null>(null);
  let activeNote = $derived(notekeeper.activeNote);

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
            label: "Toggle sidebar",
            shortcut: "Ctrl+B",
            action: dispatchSidebarToggle,
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
    openMenu = menuId;
  }

  function toggleMenu(menuId: string) {
    openMenu = openMenu === menuId ? null : menuId;
  }

  function closeMenu() {
    openMenu = null;
  }

  async function handleItemClick(item: MenuItem) {
    if (item.disabled) return;
    closeMenu();
    await item.action?.();
  }

  onMount(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!root.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleDocumentKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleDocumentKeydown);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleDocumentKeydown);
    };
  });
</script>

<div id="menu-bar" bind:this={root}>
  {#each menus as menu}
    <div class="menu-group">
      <button
        type="button"
        class:open={openMenu === menu.id}
        class="menu-trigger"
        aria-haspopup="menu"
        aria-expanded={openMenu === menu.id}
        onclick={() => toggleMenu(menu.id)}
        onmouseenter={() => openMenu !== null && showMenu(menu.id)}
      >
        {menu.label}
      </button>

      {#if openMenu === menu.id}
        <div class="menu-dropdown" role="menu">
          {#each menu.items as item}
            <button
              type="button"
              role="menuitem"
              class="menu-item"
              disabled={item.disabled}
              onclick={() => handleItemClick(item)}
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
    gap: 1rem;
    border-radius: 0.5rem;
    padding: 0.375rem 0.5rem;

    &:hover:not(:disabled) {
      background-color: var(--color-bg-hover);
      cursor: pointer;
    }

    &:disabled {
      color: var(--color-text-secondary);
      cursor: not-allowed;
    }
  }

  .shortcut {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
  }
</style>
