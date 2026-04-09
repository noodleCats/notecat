<script lang="ts">
  import notekeeper from "../lib/notekeeper.svelte";
  import { getTextStats } from "../utils/stats";
  import {
    formatTextStats,
    formatRelativeDate,
    formatStorageUsedBytes,
  } from "../utils/formatting";
  import Chip from "./Chip.svelte";
  import Icon from "./Icon.svelte";
  import folderCheckIcon from "../assets/folder-check.svg?raw";
  import folderSyncIcon from "../assets/folder-sync.svg?raw";
  import { onMount } from "svelte";

  const DATE_UPDATE_INTERVAL_MS = 60000;

  let now = $state(Date.now());
  let activeNotePresent = $derived(notekeeper.activeNote !== null);
  let edited = $derived(notekeeper.unsavedEditsPresent);

  const createdAtFormatted = $derived.by(() => {
    void now;
    const note = notekeeper.activeNote;
    return note ? `Created ${formatRelativeDate(note.createdAt)}` : "";
  });
  const updatedAtFormatted = $derived.by(() => {
    void now;
    const note = notekeeper.activeNote;
    return note ? `Updated ${formatRelativeDate(note.updatedAt)}` : "";
  });

  const textStats = $derived.by(() => {
    const note = notekeeper.activeNote;
    return note ? getTextStats(note.content) : getTextStats("");
  });
  const formattedStats = $derived(formatTextStats(textStats));

  const noteCountFormatted = $derived.by(() => {
    const noteCount = notekeeper.notes.length;
    return `${noteCount} ${noteCount === 1 ? "note" : "notes"}`;
  });
  const storageUsedFormatted = $derived.by(() => {
    const storageUsedBytes = notekeeper.storageUsedBytes;
    return `${formatStorageUsedBytes(storageUsedBytes)} total`;
  });

  onMount(() => {
    const intervalId = setInterval(() => {
      now = Date.now();
    }, DATE_UPDATE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  });
</script>

<footer id="status-bar">
  <div id="status-bar-left">
    <div id="db-status" title={edited ? "Saving..." : "Saved"}>
      {#if edited}
        <Icon icon={folderSyncIcon} --width="20px" --height="20px" />
      {:else}
        <Icon icon={folderCheckIcon} --width="20px" --height="20px" />
      {/if}
    </div>
    {#if activeNotePresent}
      <Chip content={createdAtFormatted} />
      <Chip content={updatedAtFormatted} />
    {/if}
  </div>
  <div id="status-bar-right">
    {#if activeNotePresent}
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

  #db-status {
    color: var(--color-text-secondary);

    &:hover {
      cursor: help;
    }
  }
</style>
