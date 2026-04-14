<script lang="ts">
  import { onMount } from "svelte";
  import { notekeeper } from "../core/notekeeper.svelte";
  import Header from "../components/Header.svelte";
  import Sidebar from "../components/Sidebar.svelte";
  import Editor from "../components/Editor.svelte";
  import StatusBar from "../components/StatusBar.svelte";
  import EmptyState from "../components/EmptyState.svelte";
  import Modal from "../components/Modal.svelte";
  import variables from "../data/variables";
  import keyboard from "../app/keyboard";

  const COLLAPSED_STATE_VARIABLE_NAME = "collapsed-state";

  let editorComponent = $state<Editor>();
  let editorActive = $derived(notekeeper.activeNote !== null);

  let collapsed = $state(false);
  let showNoteDeletionModal = $state(false);
  let noteDeletionModalDetail = $state<{
    noteId: string;
    noteTitle: string;
  } | null>(null);

  function setSidebarCollapsed(nextCollapsed: boolean) {
    collapsed = nextCollapsed;
    variables.session.set({
      name: COLLAPSED_STATE_VARIABLE_NAME,
      value: collapsed ? "hidden" : "visible",
    });
  }

  function toggleSidebar() {
    setSidebarCollapsed(!collapsed);
  }

  onMount(() => {
    const collapsedState = variables.session.get(COLLAPSED_STATE_VARIABLE_NAME);
    if (collapsedState === null) {
      variables.session.set({
        name: COLLAPSED_STATE_VARIABLE_NAME,
        value: "visible",
      });
    } else {
      collapsed = collapsedState === "hidden";
    }

    const handleNewNote = () => {
      editorActive = notekeeper.activeNote !== null;
      editorComponent?.focusTitle();
    };

    const handleRequestDelete = (event: Event) => {
      const customEvent = event as CustomEvent<{
        noteId: string;
        noteTitle: string;
      }>;
      noteDeletionModalDetail = customEvent.detail;
      showNoteDeletionModal = true;
    };

    const unregisterCollapse = keyboard.register({
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
        event: "toggleSidebar",
        handler: toggleSidebar,
      },
    ];
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

<Header titleHidden={collapsed} />
<main>
  <Sidebar sidebarHidden={collapsed} />
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
