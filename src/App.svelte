<script lang="ts">
  import { onMount } from 'svelte';
  import { initializeNotes, getActiveNote } from './lib/notes.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import Editor from './components/Editor.svelte';
  import StatusBar from './components/StatusBar.svelte';
  import './style.css';

  let editorComponent: Editor;
  let showEditor = $state(false);

  onMount(() => {
    initializeNotes();
    showEditor = getActiveNote() !== null;

    // Listen for new note events from Sidebar
    const handleNewNote = () => {
      setTimeout(() => {
        showEditor = getActiveNote() !== null;
        editorComponent?.focusTitle();
      }, 0);
    };

    document.addEventListener('newNote', handleNewNote);
    return () => document.removeEventListener('newNote', handleNewNote);
  });

  // Update showEditor when active note changes
  $effect(() => {
    void getActiveNote();
    showEditor = getActiveNote() !== null;
  });
</script>

<main>
  <Sidebar />

  {#if showEditor}
    <div id="editor-pane">
      <Editor bind:this={editorComponent} />
      <StatusBar />
    </div>
  {/if}
</main>

<style>
  :global(body) {
    display: flex;
    min-height: 100vh;
    margin: 0;
    padding: 0;
  }

  :global(html) {
    color-scheme: dark;
  }

  main {
    display: flex;
    width: 100%;
    height: 100vh;
  }
</style>
