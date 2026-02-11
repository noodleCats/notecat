<script lang="ts">
  import { onMount } from "svelte";
  import { initializeNotes, getActiveNote } from "./lib/notes.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Editor from "./components/Editor.svelte";
  import StatusBar from "./components/StatusBar.svelte";
  import "./style.css";

  let editorComponent = $state<Editor>();
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

    document.addEventListener("newNote", handleNewNote);
    return () => document.removeEventListener("newNote", handleNewNote);
  });

  // Update showEditor when active note changes
  $effect(() => {
    void getActiveNote();
    showEditor = getActiveNote() !== null;
  });
</script>

<Sidebar />

{#if showEditor}
  <main id="editor-pane">
    <Editor bind:this={editorComponent} />
    <StatusBar />
  </main>
{/if}

<style>
  #editor-pane {
    flex: 1;
    margin-left: var(--sidebar-width);
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
</style>
