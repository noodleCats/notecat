<script lang="ts">
  import { notekeeper } from "../core/notekeeper.svelte";
  import {
    getCharacterCount,
    getWordCount,
    getStorageUsedBytes,
  } from "../utils/stats";
  import {
    formatWordCount,
    formatCharacterCount,
    formatStorageUsedBytes,
    formatRelativeDate,
  } from "../utils/formatting";
  import Chip from "./Chip.svelte";
  import Icon from "./Icon.svelte";
  import folderCheckIcon from "../assets/folder-check.svg?raw";
  import folderSyncIcon from "../assets/folder-sync.svg?raw";
  import { onMount } from "svelte";

  const DATE_UPDATE_INTERVAL_MS = 60000;

  let now = $state(Date.now());
  let activeNote = $derived(notekeeper.activeNote);
  let edited = $derived(notekeeper.unsavedEditsPresent);

  const createdAtFormatted = $derived.by(() => {
    void now;
    return activeNote
      ? `Created ${formatRelativeDate(activeNote.createdAt)}`
      : "";
  });
  const updatedAtFormatted = $derived.by(() => {
    void now;
    return activeNote
      ? `Updated ${formatRelativeDate(activeNote.updatedAt)}`
      : "";
  });

  const wordCountFormatted = $derived.by(() => {
    const wordCount = getWordCount(activeNote?.content ?? "");
    return formatWordCount(wordCount);
  });
  const characterCountFormatted = $derived.by(() => {
    const characterCount = getCharacterCount(activeNote?.content ?? "");
    return formatCharacterCount(characterCount);
  });
  const storageUsedFormatted = $derived.by(() => {
    const storageUsedBytes = getStorageUsedBytes(activeNote?.content ?? "");
    return formatStorageUsedBytes(storageUsedBytes);
  });

  const noteCountFormatted = $derived.by(() => {
    const noteCount = notekeeper.notes.length;
    return `${noteCount} ${noteCount === 1 ? "note" : "notes"}`;
  });
  const totalStorageUsedFormatted = $derived.by(() => {
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
    {#if activeNote !== null}
      <Chip content={createdAtFormatted} />
      <Chip content={updatedAtFormatted} />
    {/if}
  </div>
  <div id="status-bar-right">
    {#if activeNote !== null}
      <Chip content={wordCountFormatted} />
      <Chip content={characterCountFormatted} />
      <Chip content={storageUsedFormatted} />
    {:else}
      <Chip content={noteCountFormatted} />
      <Chip content={totalStorageUsedFormatted} />
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
