<script lang="ts">
  import { onMount } from "svelte";
  import notekeeper from "./lib/notekeeper.svelte";
  import Header from "./components/Header.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Editor from "./components/Editor.svelte";
  import StatusBar from "./components/StatusBar.svelte";
  import DeleteConfirm from "./components/DeleteConfirm.svelte";

  let editorComponent = $state<Editor>();
  let showEditor = $state(false);
  let deleteConfirmNote = $state<{
    noteId: string;
    noteTitle: string;
  } | null>(null);

  onMount(() => {
    showEditor = notekeeper.activeNote !== null;

    // Listen for new note events from Sidebar
    const handleNewNote = () => {
      setTimeout(() => {
        showEditor = notekeeper.activeNote !== null;
        editorComponent?.focusTitle();
      }, 0);
    };

    const handleRequestDelete = (event: Event) => {
      const customEvent = event as CustomEvent<{
        noteId: string;
        noteTitle: string;
      }>;
      deleteConfirmNote = customEvent.detail;
    };

    document.addEventListener("newNote", handleNewNote);
    document.addEventListener("requestDelete", handleRequestDelete);
    return () => {
      document.removeEventListener("newNote", handleNewNote);
      document.removeEventListener("requestDelete", handleRequestDelete);
    };
  });

  // Update showEditor when active note changes
  $effect(() => {
    showEditor = notekeeper.activeNote !== null;
  });
</script>

<div id="app">
  <Header />
  <main>
    <Sidebar />
    {#if showEditor}
      <Editor bind:this={editorComponent} />
    {/if}

    {#if deleteConfirmNote}
      {@const confirmNote = deleteConfirmNote}
      <DeleteConfirm
        noteTitle={confirmNote.noteTitle}
        onConfirm={() => {
          notekeeper.deleteNote(confirmNote.noteId);
          deleteConfirmNote = null;
        }}
        onCancel={() => {
          deleteConfirmNote = null;
        }}
      />
    {/if}
  </main>
  {#if showEditor}
    <StatusBar />
  {:else}
    <StatusBar chipsHidden={true} />
  {/if}
</div>

<style>
  #app {
    flex: 1;
    display: flex;
    flex-direction: column;

    main {
      flex: 1;
      display: flex;
      flex-direction: row;
      min-height: 0;
    }
  }
</style>
