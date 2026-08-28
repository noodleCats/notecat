<script lang="ts">
  import { notekeeper } from "../app/notekeeper.svelte";
  import {
    getCharacterCount,
    getWordCount,
    getStorageUsedBytes,
  } from "../lib/stats";
  import {
    formatWordCount,
    formatCharacterCount,
    formatStorageUsedBytes,
    formatRelativeDate,
  } from "../lib/formatting";
  import Chip from "./Chip.svelte";
  import Icon from "./Icon.svelte";
  import folderCheckIcon from "../assets/folder-check.svg?raw";
  import folderSyncIcon from "../assets/folder-sync.svg?raw";
  import { onMount } from "svelte";

  const DATE_UPDATE_INTERVAL_MS = 60000;

  let now = $state(Date.now());
  const activeNote = $derived(notekeeper.activeNote);
  const edited = $derived(notekeeper.unsavedEditsPresent);

  const createdAt = $derived.by(() => {
    void now;
    if (activeNote === null) return "";

    const result = formatRelativeDate(activeNote.createdAt);
    return result.ok ? `Created ${result.value}` : "Invalid date";
  });
  const updatedAt = $derived.by(() => {
    void now;
    if (activeNote === null) return "";

    const result = formatRelativeDate(activeNote.updatedAt);
    return result.ok ? `Updated ${result.value}` : "Invalid date";
  });

  const wordCount = $derived.by(() => {
    const wordCount = getWordCount(activeNote?.content ?? "");
    return formatWordCount(wordCount);
  });
  const characterCount = $derived.by(() => {
    const characterCount = getCharacterCount(activeNote?.content ?? "");
    return formatCharacterCount(characterCount);
  });
  const storageUsed = $derived.by(() => {
    const storageUsedBytes = getStorageUsedBytes(activeNote?.content ?? "");
    const result = formatStorageUsedBytes(storageUsedBytes);
    return result.ok ? result.value : "Invalid size";
  });

  const noteCount = $derived.by(() => {
    const noteCount = notekeeper.notes.length;
    return `${noteCount} ${noteCount === 1 ? "note" : "notes"}`;
  });
  const totalStorageUsed = $derived.by(() => {
    const storageUsedBytes = notekeeper.storageUsedBytes;
    const result = formatStorageUsedBytes(storageUsedBytes);
    return result.ok ? `${result.value} total` : "Invalid size";
  });

  onMount(() => {
    const intervalId = setInterval(() => {
      now = Date.now();
    }, DATE_UPDATE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  });
</script>

<footer id="status-bar" class="py-2 px-4 flex border-t border-border">
  <div class="flex items-center gap-2">
    <div
      class="text-icon hover:text-icon-hover hover:cursor-help transition-colors"
      title={edited ? "Saving..." : "Saved"}
    >
      <Icon icon={edited ? folderSyncIcon : folderCheckIcon} />
    </div>
    {#if activeNote !== null}
      <Chip>{createdAt}</Chip>
      <Chip>{updatedAt}</Chip>
    {/if}
  </div>
  <div class="flex items-center gap-2 ml-auto">
    {#if activeNote !== null}
      <Chip>{wordCount}</Chip>
      <Chip>{characterCount}</Chip>
      <Chip>{storageUsed}</Chip>
    {:else}
      <Chip>{noteCount}</Chip>
      <Chip>{totalStorageUsed}</Chip>
    {/if}
  </div>
</footer>
