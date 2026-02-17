<script lang="ts">
  import { onMount } from "svelte";
  import { initializeNotes, getActiveNote } from "./lib/notes.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Editor from "./components/Editor.svelte";
  import StatusBar from "./components/StatusBar.svelte";
  import leftIcon from "./assets/chevron-left.svg?raw";
  import rightIcon from "./assets/chevron-right.svg?raw";
  import "./style.css";

  let editorComponent = $state<Editor>();
  let showEditor = $state(false);
  let isSidebarHidden = $state(false);

  function toggleSidebar() {
    isSidebarHidden = !isSidebarHidden;
  }

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

    // Keyboard shortcut for toggling sidebar
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };

    document.addEventListener("newNote", handleNewNote);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("newNote", handleNewNote);
      document.removeEventListener("keydown", handleKeyDown);
    };
  });

  // Update showEditor when active note changes
  $effect(() => {
    void getActiveNote();
    showEditor = getActiveNote() !== null;
  });
</script>

<Sidebar {isSidebarHidden} />

{#if showEditor}
  <main id="editor-pane" class:sidebar-hidden={isSidebarHidden}>
    <button
      id="sidebar-toggle"
      type="button"
      onclick={toggleSidebar}
      title={isSidebarHidden ? "Show sidebar" : "Hide sidebar"}
    >
      {#if isSidebarHidden}
        {@html rightIcon}
      {:else}
        {@html leftIcon}
      {/if}
    </button>
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
    transition: margin-left var(--transition-delay);
    position: relative;
  }

  #editor-pane.sidebar-hidden {
    margin-left: 0;
  }

  #sidebar-toggle {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    width: 32px;
    height: 32px;
    background-color: var(--sidebar-background);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    color: var(--secondary-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    z-index: 10;
    transition: background-color var(--transition-delay);
  }

  #sidebar-toggle:hover {
    background-color: var(--hover-color);
  }
</style>
