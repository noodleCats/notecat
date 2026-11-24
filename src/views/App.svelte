<script lang="ts">
  import { onMount } from "svelte";
  import { notekeeper } from "@/app/notekeeper.svelte";
  import { registerAppShortcuts } from "@/app/shortcuts";
  import { setTickInterval } from "@/app/state/time.svelte";
  import { modalState } from "@/app/state/modal.svelte";
  import Header from "@/components/header/Header.svelte";
  import Sidebar from "@/components/sidebar/Sidebar.svelte";
  import Editor from "@/components/editor/Editor.svelte";
  import Print from "@/components/editor/Print.svelte";
  import Empty from "@/components/editor/Empty.svelte";
  import Modal from "@/components/ui/Modal.svelte";
  import QuickSwitcher from "@/components/switcher/QuickSwitcher.svelte";
  import { switcherState } from "@/app/state/switcher.svelte";

  const activeNote = $derived(notekeeper.activeNote);

  onMount(() => {
    const cleanups: (() => void)[] = [
      registerAppShortcuts(),
      setTickInterval(),
    ];

    return () => cleanups.forEach((cleanup) => cleanup());
  });
</script>

<svelte:head>
  <title>{activeNote ? `${activeNote.title} | Notecat` : `Notecat`}</title>
</svelte:head>

<Header />
<main class="flex min-h-0 flex-1">
  <Sidebar />
  {#if activeNote !== null}
    <Editor note={activeNote} />
  {:else}
    <Empty />
  {/if}

  {#if switcherState.open}
    <QuickSwitcher />
  {/if}

  {#if modalState.modal !== null}
    <Modal {...modalState.modal} />
  {/if}
</main>

{#if activeNote !== null}
  <Print note={activeNote} />
{/if}
