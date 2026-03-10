<script lang="ts">
  import { onMount } from "svelte";
  import notekeeper from "./lib/notekeeper.svelte";
  import Header from "./components/Header.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Editor from "./components/Editor.svelte";
  import StatusBar from "./components/StatusBar.svelte";
  import EmptyState from "./components/EmptyState.svelte";
  import Modal from "./components/Modal.svelte";

  let editorComponent = $state<Editor>();
  let editorActive = $derived(notekeeper.activeNote !== null);

  let showPersistentStorageModal = $state(false);
  let showNoteDeletionModal = $state(false);
  let noteDeletionModalDetail = $state<{
    noteId: string;
    noteTitle: string;
  } | null>(null);

  onMount(() => {
    editorActive = notekeeper.activeNote !== null;

    // Listen for new note events from Sidebar
    const handleNewNote = () => {
      setTimeout(() => {
        editorActive = notekeeper.activeNote !== null;
        editorComponent?.focusTitle();
      }, 0);
    };

    const handleRequestDelete = (event: Event) => {
      const customEvent = event as CustomEvent<{
        noteId: string;
        noteTitle: string;
      }>;
      noteDeletionModalDetail = customEvent.detail;
      showNoteDeletionModal = true;
    };

    const handlePersistentStorageDenied = () => {
      showPersistentStorageModal = true;
    };

    const eventListeners = [
      {
        event: "newNote",
        handler: handleNewNote,
      },
      {
        event: "requestDelete",
        handler: handleRequestDelete,
      },
      {
        event: "persistentStorageDenied",
        handler: handlePersistentStorageDenied,
      },
    ];

    eventListeners.forEach((listener) => {
      document.addEventListener(listener.event, listener.handler);
    });
    return () => {
      eventListeners.forEach((listener) => {
        document.removeEventListener(listener.event, listener.handler);
      });
    };
  });
</script>

<div id="app">
  <Header />
  <main>
    <Sidebar />
    {#if editorActive}
      <Editor bind:this={editorComponent} />
    {:else}
      <EmptyState />
    {/if}

    {#if showNoteDeletionModal}
      {@const note = noteDeletionModalDetail}
      <Modal
        title="Delete note?"
        content="Are you sure you want to delete '{note?.noteTitle}'? This action cannot be undone."
        buttons={[
          {
            label: "Cancel",
            variant: "default",
            onClick: () => {
              showNoteDeletionModal = false;
            },
          },
          {
            label: "Delete",
            variant: "danger",
            onClick: () => {
              notekeeper.deleteNote(note?.noteId!);
              showNoteDeletionModal = false;
            },
          },
        ]}
      />
    {/if}

    {#if showPersistentStorageModal}
      <Modal
        title="Persistent storage denied"
        content="Your notes are currently stored with best-effort storage. This means your notes could be deleted if the browser runs out of space."
        buttons={[
          {
            label: "OK",
            variant: "default",
            onClick: () => {
              showPersistentStorageModal = false;
            },
          },
        ]}
      />
    {/if}
  </main>
  <StatusBar {editorActive} />
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
