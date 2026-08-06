<script lang="ts">
  import { onMount } from "svelte";
  import type { Note } from "./types/note";
  import { notekeeper } from "./core/notekeeper.svelte";
  import Header from "./components/Header.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Editor from "./components/Editor.svelte";
  import StatusBar from "./components/StatusBar.svelte";
  import EmptyState from "./components/EmptyState.svelte";
  import Modal from "./components/Modal.svelte";
  import { registerShortcut } from "./utils/keyboard";
  import { toggleSidebarVisibility, sidebarState } from "./core/app-state.svelte";

  let editorComponent = $state<Editor>();
  const editorActive = $derived(notekeeper.activeNote !== null);

  type ModalState =
    | { type: "delete"; noteId: string; noteTitle: string }
    | { type: "import"; notes: Note[]; fileName: string }
    | { type: "dialog"; title: string; content: string }
    | null;
  let modal = $state<ModalState>(null);

  function handleNewNote() {
    editorComponent?.focusTitle();
  }

  function handleRequestDelete(event: Event) {
    const customEvent = event as CustomEvent<{
      noteId: string;
      noteTitle: string;
    }>;
    modal = { type: "delete", ...customEvent.detail };
  }

  function handleRequestImportNotes(event: Event) {
    const customEvent = event as CustomEvent<{
      notes: Note[];
      fileName: string;
    }>;
    modal = { type: "import", ...customEvent.detail };
  }

  function handleShowDialog(event: Event) {
    const customEvent = event as CustomEvent<{
      title: string;
      content: string;
    }>;
    modal = { type: "dialog", ...customEvent.detail };
  }

  function toggleSidebar() {
    toggleSidebarVisibility();
  }

  const unregisterCollapse = registerShortcut({
    key: "b",
    ctrl: true,
    preventDefault: true,
    handler: toggleSidebar,
  });

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
      event: "requestImportNotes",
      handler: handleRequestImportNotes,
    },
    {
      event: "showDialog",
      handler: handleShowDialog,
    },
    {
      event: "toggleSidebar",
      handler: toggleSidebar,
    },
  ];

  onMount(() => {
    eventListeners.forEach((listener) => {
      document.addEventListener(listener.event, listener.handler);
    });

    return () => {
      unregisterCollapse();
      eventListeners.forEach((listener) => {
        document.removeEventListener(listener.event, listener.handler);
      });
    };
  });
</script>

<Header />
<main>
  <Sidebar sidebarHidden={sidebarState.visibility === "hidden"} />
  {#if editorActive}
    <Editor bind:this={editorComponent} />
  {:else}
    <EmptyState />
  {/if}

  {#if modal?.type === "delete"}
    {const deleteModal = $derived(modal)}
    <Modal
      title="Delete note?"
      content="Are you sure you want to delete '{modal.noteTitle}'? This action cannot be undone."
      buttons={[
        {
          label: "Cancel",
          variant: "default",
          onClick: () => {
            modal = null;
          },
        },
        {
          label: "Delete",
          variant: "danger",
          onClick: () => {
            notekeeper.deleteNote(deleteModal.noteId);
            modal = null;
          },
        },
      ]}
    />
  {/if}

  {#if modal?.type === "import"}
    {const importModal = $derived(modal)}
    <Modal
      title="Import notes?"
      content="Import {modal.notes.length ?? 0} {modal.notes.length === 1
        ? 'note'
        : 'notes'} from '{modal.fileName}'? This will replace all existing notes."
      buttons={[
        {
          label: "Cancel",
          variant: "default",
          onClick: () => {
            modal = null;
          },
        },
        {
          label: "Replace all",
          variant: "danger",
          onClick: async () => {
            await notekeeper.importNotes(importModal.notes ?? []);
            modal = null;
          },
        },
      ]}
    />
  {/if}

  {#if modal?.type === "dialog"}
    <Modal
      title={modal.title ?? ""}
      content={modal.content ?? ""}
      buttons={[
        {
          label: "Close",
          variant: "default",
          onClick: () => {
            modal = null;
          },
        },
      ]}
    />
  {/if}
</main>
<StatusBar />

<style>
  main {
    flex: 1;
    display: flex;
    flex-direction: row;
    min-height: 0;
  }
</style>
