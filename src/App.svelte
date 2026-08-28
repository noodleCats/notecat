<script lang="ts">
  import { onMount } from "svelte";
  import { notekeeper } from "./app/notekeeper.svelte";
  import Header from "./components/Header.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Editor from "./components/Editor.svelte";
  import StatusBar from "./components/StatusBar.svelte";
  import EmptyState from "./components/EmptyState.svelte";
  import Modal from "./components/Modal.svelte";
  import { sidebarState } from "./app/state/sidebar.svelte";
  import { modalState } from "./app/state/modal.svelte";
  import { registerAppShortcuts } from "./app/shortcuts";

  onMount(() => {
    const unregisterShortcuts = registerAppShortcuts();
    return unregisterShortcuts;
  });
</script>

<Header />
<main class="flex flex-1 min-h-0">
  <Sidebar sidebarHidden={sidebarState.visibility === "hidden"} />
  {#if notekeeper.activeNote !== null}
    <Editor />
  {:else}
    <EmptyState />
  {/if}

  {#if modalState.modal !== null}
    <Modal {...modalState.modal} />
  {/if}
</main>
<StatusBar />
