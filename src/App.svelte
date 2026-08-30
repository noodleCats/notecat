<script lang="ts">
  import { onMount } from "svelte";
  import { notekeeper } from "./app/notekeeper.svelte";
  import { registerAppShortcuts } from "./app/shortcuts";
  import { setDateUpdateInterval } from "./app/state/time.svelte";
  import { addKeyboardEventListener } from "./app/state/keyboard.svelte";
  import { sidebarState } from "./app/state/sidebar.svelte";
  import { modalState } from "./app/state/modal.svelte";
  import Header from "./components/Header.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Editor from "./components/Editor.svelte";
  import Empty from "./components/Empty.svelte";
  import Modal from "./components/Modal.svelte";
  import StatusBar from "./components/StatusBar.svelte";

  onMount(() => {
    const unregisterShortcuts = registerAppShortcuts();
    const clearDateUpdateInterval = setDateUpdateInterval();
    const removeKeyboardEventListener = addKeyboardEventListener();
    return () => {
      unregisterShortcuts();
      clearDateUpdateInterval();
      removeKeyboardEventListener();
    };
  });
</script>

<Header />
<main class="flex flex-1 min-h-0">
  <Sidebar sidebarHidden={sidebarState.visibility === "hidden"} />
  {#if notekeeper.activeNote !== null}
    <Editor />
  {:else}
    <Empty />
  {/if}

  {#if modalState.modal !== null}
    <Modal {...modalState.modal} />
  {/if}
</main>
<StatusBar />
