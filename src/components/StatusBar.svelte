<script lang="ts">
  import notekeeper from "../lib/notekeeper.svelte";
  import { getTextStats } from "../utils/stats";
  import {
    formatTextStats,
    formatRelativeDate,
    formatStorageUsedBytes,
  } from "../utils/formatting";
  import Chip from "./Chip.svelte";

  const DATE_UPDATE_INTERVAL_MS = 60000;

  let { activeNote = false } = $props();

  // Derived formatted dates
  const createdAtFormatted = $derived.by(() => {
    const note = notekeeper.activeNote;
    return note ? `Created ${formatRelativeDate(note.createdAt)}` : "";
  });
  const updatedAtFormatted = $derived.by(() => {
    const note = notekeeper.activeNote;
    return note ? `Updated ${formatRelativeDate(note.updatedAt)}` : "";
  });

  // Derived stats from active note
  const textStats = $derived.by(() => {
    const note = notekeeper.activeNote;
    return note ? getTextStats(note.content) : getTextStats("");
  });
  const formattedStats = $derived(formatTextStats(textStats));

  // Stats to display if there is no active note
  const noteCountFormatted = $derived.by(() => {
    const noteCount = notekeeper.notes.length;
    return `${noteCount} ${noteCount === 1 ? "note" : "notes"}`;
  });
  const storageUsedFormatted = $derived.by(() => {
    const storageUsedBytes = notekeeper.getStorageUsedBytes();
    return `${formatStorageUsedBytes(storageUsedBytes)} total`;
  });

  // Refresh relative dates every 60 seconds
  $effect(() => {
    const intervalId = setInterval(() => {
      // Force re-evaluation of the derived values by accessing them
      // (Svelte will re-run the $derived blocks)
      void createdAtFormatted;
      void updatedAtFormatted;
    }, DATE_UPDATE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  });
</script>

<footer id="status-bar">
  <div id="status-bar-left">
    {#if activeNote}
      <Chip content={createdAtFormatted} />
      <Chip content={updatedAtFormatted} />
    {/if}
  </div>
  <div id="status-bar-right">
    {#if activeNote}
      <Chip content={formattedStats.wordCount} />
      <Chip content={formattedStats.characterCount} />
      <Chip content={formattedStats.storageUsed} />
    {:else}
      <Chip content={noteCountFormatted} />
      <Chip content={storageUsedFormatted} />
    {/if}
  </div>
</footer>

<style>
  #status-bar {
    display: flex;
    flex-direction: row;
    padding: 0.5rem 1rem;
    border-top: 1px solid var(--color-border);

    div {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }

  #status-bar-left {
    justify-self: flex-start;
  }

  #status-bar-right {
    justify-self: flex-end;
    margin-left: auto;
  }
</style>
