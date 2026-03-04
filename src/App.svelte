<script lang="ts">
  import { onMount } from "svelte";
  import notekeeper from "./lib/notekeeper.svelte";
  import shortcuts from "./lib/shortcuts.svelte";
  import Header from "./components/Header.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Editor from "./components/Editor.svelte";
  import StatusBar from "./components/StatusBar.svelte";
  import DeleteConfirm from "./components/DeleteConfirm.svelte";
  import notecatLogo from "/notecat.svg?raw";
  import Icon from "./components/Icon.svelte";

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

    const unregisterClose = shortcuts.register({
      key: "w",
      ctrl: true,
      alt: true,
      handler: () => notekeeper.closeActiveNote(),
    });

    document.addEventListener("newNote", handleNewNote);
    document.addEventListener("requestDelete", handleRequestDelete);
    return () => {
      unregisterClose();
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
    {:else}
      <div id="empty">
        <Icon icon={notecatLogo} --width="12rem" --height="10.5rem" />
      </div>
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

  #empty {
    color: var(--color-bg-sidebar);
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
