<script lang="ts">
  import notekeeper from "../lib/notekeeper.svelte";
  import NoteItem from "./NoteItem.svelte";
  import filePlusIcon from "../assets/file-plus.svg?raw";
  import panelLeftIcon from "../assets/panel-left.svg?raw";
  import Icon from "./Icon.svelte";
  import { onMount } from "svelte";
  import shortcuts from "../lib/shortcuts.svelte";

  let sidebarVisible = $state(true);
  let notes = $derived(notekeeper.notes);
  let activeNote = $derived(notekeeper.activeNote);

  function newNote() {
    const newNoteId = notekeeper.createNote();
    // Dispatch custom event so parent can focus the editor
    const event = new CustomEvent("newNote", { detail: newNoteId });
    document.dispatchEvent(event);
  }

  function toggleSidebar() {
    sidebarVisible = !sidebarVisible;
  }

  onMount(() => {
    const unregisterSidebarToggle = shortcuts.register({
      key: "b",
      ctrl: true,
      preventDefault: true,
      handler: toggleSidebar,
    });

    const unregisterNewNote = shortcuts.register({
      key: "n",
      ctrl: true,
      alt: true,
      preventDefault: true,
      handler: newNote,
    });

    return () => {
      unregisterSidebarToggle();
      unregisterNewNote();
    };
  });
</script>

<aside id="sidebar" class:collapsed={!sidebarVisible}>
  <div id="button-panel">
    <div id="button-panel-left">
      <button class="button" type="button" title="New note" onclick={newNote}>
        <Icon icon={filePlusIcon} --width="20px" --height="20px" />
      </button>
    </div>
    <div id="button-panel-right">
      <button
        class="button"
        type="button"
        title="Toggle sidebar"
        onclick={toggleSidebar}
      >
        <Icon icon={panelLeftIcon} --width="20px" --height="20px" />
      </button>
    </div>
  </div>

  <nav id="note-list">
    {#if notes.length === 0}
      <p class="empty-state-text">No notes yet</p>
    {:else}
      {#each notes as note (note.id)}
        <NoteItem {note} isActive={note.id === activeNote?.id} />
      {/each}
    {/if}
  </nav>
</aside>

<style>
  #sidebar {
    width: 240px;
    min-width: 240px;
    background-color: var(--color-bg-sidebar);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    transition:
      width 0.2s,
      min-width 0.2s;
    overflow: hidden;

    &.collapsed {
      width: 52px;
      min-width: 52px;

      #button-panel {
        border-bottom: none;

        div#button-panel-left {
          display: none;
        }
      }

      #note-list {
        display: none;
      }
    }

    #button-panel {
      display: flex;
      flex-direction: row;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-border);

      div {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      div#button-panel-left {
        justify-self: flex-start;
      }

      div#button-panel-right {
        justify-self: flex-end;
        margin-left: auto;
      }
    }

    #note-list {
      flex: 1;
      overflow-y: auto;
      margin: 0.75rem;
    }

    .empty-state-text {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin: 0;
      padding: 0.75rem;
      text-align: center;
    }
  }

  .button {
    background: none;
    border: none;
    color: var(--color-icon);
    transition: color 0.2s;

    &:hover {
      color: var(--color-icon-hover);
      cursor: pointer;
    }
  }
</style>
