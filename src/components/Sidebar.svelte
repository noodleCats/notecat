<script lang="ts">
  import { noteState, createNote } from "../lib/notes.svelte";
  import NoteItem from "./NoteItem.svelte";
  import notecatLogo from "/notecat.svg";

  function handleNewNote() {
    const newNoteId = createNote();
    // Dispatch custom event so parent can focus the editor
    const event = new CustomEvent("newNote", { detail: newNoteId });
    document.dispatchEvent(event);
  }
</script>

<aside id="sidebar">
  <header id="sidebar-header">
    <img src={notecatLogo} alt="Notecat logo" width="28" height="24" />
    <h1>Notecat</h1>
  </header>

  <button id="new-note-button" type="button" onclick={handleNewNote}>
    + New Note
  </button>

  <nav id="note-list">
    {#if noteState.notes.length === 0}
      <p class="empty-state-text">No notes yet</p>
    {:else}
      {#each noteState.notes as note (note.id)}
        <NoteItem {note} isActive={note.id === noteState.activeNoteId} />
      {/each}
    {/if}
  </nav>
</aside>

<style>
  #sidebar {
    width: var(--sidebar-width);
    min-width: var(--sidebar-width);
    background-color: var(--sidebar-background);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
  }

  #sidebar-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color);
  }

  #sidebar-header h1 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  #new-note-button {
    margin: 0.75rem;
    padding: 0.5rem 1rem;
    background-color: var(--hover-color);
    color: var(--primary-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    cursor: pointer;
    font-family: inherit;
    font-size: 1rem;
    transition: background-color 0.15s;
  }

  #new-note-button:hover {
    background-color: var(--active-color);
  }

  #note-list {
    flex: 1;
    overflow-y: auto;
    margin: 0.75rem;
  }

  .empty-state-text {
    font-size: 0.875rem;
    color: var(--secondary-color);
    margin: 0;
    padding: 0.75rem;
    text-align: center;
  }
</style>
