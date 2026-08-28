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
    class="
      group bg-none border-none py-1.5 px-2 rounded-lg text-text w-full
      flex items-center justify-between gap-4 whitespace-nowrap
      not-disabled:hover:bg-bg-hover not-disabled:hover:cursor-pointer
      disabled:text-text-tertiary disabled:cursor-not-allowed
    "
    disabled={item.disabled}
    onclick={() => onItemClick(item)}
  >
    <span>{item.label}</span>
    {#if item.shortcut}
      <span
        class="text-text-secondary text-sm group-disabled:text-text-tertiary"
        >{item.shortcut}</span
      >
    {/if}
    {#if item.external}
      <Icon icon={externalLinkIcon} />
    {/if}
  </button>
{/snippet}

<div class="min-w-0 flex items-center" bind:this={menubar}>
  {#each menus as menu}
    <div class="relative">
      <button
        type="button"
        class:open={menuState.open === menu.id}
        class={[
          "bg-none border-none text-text-secondary py-1 px-2 rounded-md",
          "transition-colors",
          "hover:bg-bg-hover hover:cursor-pointer",
          menuState.open === menu.id && "bg-bg-hover cursor-pointer",
        ]}
        aria-haspopup="menu"
        aria-expanded={menuState.open === menu.id}
        onclick={() => toggleMenu(menu.id)}
        onmouseenter={() => menuState.open !== null && showMenu(menu.id)}
      >
        {menu.label}
      </button>

      {#if menuState.open === menu.id}
        <div
          class="absolute p-1.5 border border-border rounded-xl bg-bg-sidebar shadow-md z-10"
          role="menu"
        >
          {#each menu.items as item}
            {@render menuItem(item)}
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>
