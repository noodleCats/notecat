<script lang="ts">
  import { notekeeper } from "@/app/notekeeper.svelte";
  import {
    closeActiveNote,
    createNoteAndFocus,
    exportActiveNoteAsText,
    exportAllNotesAsJson,
    importNoteFromText,
    importAllNotesFromJson,
    trashActiveNote,
    openRepo,
    toggleSidebar,
    toggleMonospace,
  } from "@/app/commands";
  import { sidebarState } from "@/app/state/sidebar.svelte";
  import { editorState } from "@/app/state/editor.svelte";
  import { closeMenu } from "@/app/state/menu.svelte";
  import Menu from "@/components/header/Menu.svelte";
  import MenuItem from "@/components/header/MenuItem.svelte";

  let menubar: HTMLDivElement;
  const noActiveNote = $derived(notekeeper.activeNote === null);

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
</script>

<svelte:document {onclick} {onkeydown} />

<div class="flex min-w-0 items-center" bind:this={menubar}>
  <Menu label="file">
    <MenuItem shortcut={{ key: "N", alt: true }} onclick={createNoteAndFocus}>
      New note
    </MenuItem>

    <MenuItem
      shortcut={{ key: "W", alt: true }}
      disabled={noActiveNote}
      onclick={closeActiveNote}
    >
      Close note
    </MenuItem>

    <MenuItem onclick={importNoteFromText}>Import note from TXT</MenuItem>

    <MenuItem disabled={noActiveNote} onclick={exportActiveNoteAsText}>
      Export note as TXT
    </MenuItem>

    <MenuItem onclick={importAllNotesFromJson}>Import all from JSON</MenuItem>

    <MenuItem
      disabled={notekeeper.allNotes.length === 0}
      onclick={exportAllNotesAsJson}
    >
      Export all as JSON
    </MenuItem>

    <MenuItem disabled={noActiveNote} onclick={trashActiveNote}>
      Move to trash
    </MenuItem>
  </Menu>

  <Menu label="view">
    <MenuItem shortcut={{ key: "B", ctrl: true }} onclick={toggleSidebar}>
      {sidebarState.visibility === "hidden" ? "Show sidebar" : "Hide sidebar"}
    </MenuItem>
    <MenuItem shortcut={{ key: "M", ctrl: true }} onclick={toggleMonospace}>
      {editorState.font === "monospace"
        ? "Disable monospace font"
        : "Enable monospace font"}
    </MenuItem>
  </Menu>

  <Menu label="help">
    <MenuItem external onclick={openRepo}>View source code</MenuItem>
  </Menu>
</div>
