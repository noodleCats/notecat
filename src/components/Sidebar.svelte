<script lang="ts">
  import { noteState, createNote } from "../lib/notes.svelte";
  import NoteItem from "./NoteItem.svelte";
  import notecatLogo from "/notecat.svg";
  import githubIcon from "../assets/github.svg?raw";

  interface Props {
    isSidebarHidden?: boolean;
  }

  let { isSidebarHidden = false }: Props = $props();

  function handleNewNote() {
    const newNoteId = createNote();
    // Dispatch custom event so parent can focus the editor
    const event = new CustomEvent("newNote", { detail: newNoteId });
    document.dispatchEvent(event);
  }
</script>

<aside id="sidebar" class:hidden={isSidebarHidden}>
  <header id="sidebar-header">
    <img src={notecatLogo} alt="Notecat logo" width="28" height="24" />
    <h1>Notecat</h1>
    <a
      href="https://github.com/noodleCats/notecat"
      target="_blank"
      rel="noopener noreferrer"
      class="github-link"
    >
      {@html githubIcon}
    </a>
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
    transition:
      width var(--transition-delay),
      min-width var(--transition-delay),
      opacity var(--transition-delay);
    overflow: hidden;
  }

  #sidebar.hidden {
    width: 0;
    min-width: 0;
    opacity: 0;
    border-right: none;
  }

  #sidebar-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color);
    transition: opacity var(--transition-delay);
  }

  #sidebar.hidden #sidebar-header {
    opacity: 0;
  }

  #sidebar-header h1 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    flex: 1;
  }

  .github-link {
    display: flex;
    align-items: center;
    color: var(--primary-color);
    opacity: 0.3;
    transition: opacity var(--transition-delay);
  }

  .github-link:hover {
    opacity: 1;
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
    transition: background-color var(--transition-delay);
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
