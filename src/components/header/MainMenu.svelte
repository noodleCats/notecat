<script lang="ts">
  import { notekeeper } from "@/app/notekeeper.svelte";
  import {
    closeActiveNote,
    createNoteAndFocus,
    exportActiveNoteAsText,
    exportAllNotesAsJson,
    importNoteFromText,
    importAllNotesFromJson,
    openQuickSwitcher,
    trashActiveNote,
    openRepo,
    toggleSidebar,
    toggleMonospace,
  } from "@/app/commands";
  import { sidebarState } from "@/app/state/sidebar.svelte";
  import { editorState } from "@/app/state/editor.svelte";
  import { menuState } from "@/app/state/menu.svelte";
  import Menubar from "@/components/ui/menu/Menubar.svelte";
  import Menu from "@/components/ui/menu/Menu.svelte";
  import MenuItem from "@/components/ui/menu/MenuItem.svelte";
  import MenuSeparator from "@/components/ui/menu/MenuSeparator.svelte";
  import ThemeSwitch from "./ThemeSwitch.svelte";
  import { formatDate, formatShortDate } from "@/lib/formatting";
  import type { Timestamp } from "@/shared/timestamp";

  const buildTimestamp = Date.parse(__BUILD_DATE__) as Timestamp;
  const buildDateShort = formatShortDate(buildTimestamp);
  const buildDateFull = formatDate(buildTimestamp);

  const noActiveNote = $derived(notekeeper.activeNote === null);
</script>

<Menubar bind:open={menuState.open}>
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

    <MenuSeparator />

    <MenuItem onclick={importNoteFromText}>Import note from TXT…</MenuItem>
    <MenuItem disabled={noActiveNote} onclick={exportActiveNoteAsText}>
      Export note as TXT
    </MenuItem>

    <MenuSeparator />

    <MenuItem onclick={importAllNotesFromJson}>Import all from JSON…</MenuItem>
    <MenuItem
      disabled={notekeeper.allNotes.length === 0}
      onclick={exportAllNotesAsJson}
    >
      Export all as JSON
    </MenuItem>

    <MenuSeparator />

    <MenuItem disabled={noActiveNote} onclick={trashActiveNote}>
      Move to trash
    </MenuItem>
  </Menu>

  <Menu label="view">
    <MenuItem shortcut={{ key: "K", ctrl: true }} onclick={openQuickSwitcher}>
      Search notes…
    </MenuItem>

    <MenuItem shortcut={{ key: "B", ctrl: true }} onclick={toggleSidebar}>
      {sidebarState.visibility === "hidden" ? "Show sidebar" : "Hide sidebar"}
    </MenuItem>

    <MenuItem shortcut={{ key: "M", ctrl: true }} onclick={toggleMonospace}>
      {editorState.font === "monospace"
        ? "Disable monospace font"
        : "Enable monospace font"}
    </MenuItem>

    <MenuSeparator />

    <ThemeSwitch />
  </Menu>

  <Menu label="help">
    <MenuItem external onclick={openRepo}>View source code</MenuItem>

    <MenuSeparator />

    <p
      role="none"
      class="px-2 pt-1 pb-1 text-sm whitespace-nowrap text-text-tertiary"
    >
      <span class="text-text-secondary">Notecat {__APP_VERSION__}</span>
      <br />
      Built
      <time
        datetime={__BUILD_DATE__}
        title={buildDateFull}
        class="transition hover:text-text">{buildDateShort}</time
      >
    </p>
  </Menu>
</Menubar>
