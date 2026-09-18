<script lang="ts">
  import FolderCheck from "@lucide/svelte/icons/folder-check";
  import FolderSync from "@lucide/svelte/icons/folder-sync";
  import { notekeeper } from "@/app/notekeeper.svelte";
  import { time } from "@/app/state/time.svelte";
  import {
    getCharacterCount,
    getWordCount,
    getStorageUsedBytes,
  } from "@/lib/stats";
  import {
    formatWordCount,
    formatCharacterCount,
    formatStorageUsedBytes,
    formatRelativeDate,
    formatDate,
  } from "@/lib/formatting";
  import Chip from "./Chip.svelte";

  const activeNote = $derived(notekeeper.activeNote);
  const edited = $derived(notekeeper.unsavedEditsPresent);

  function getFormattedDate({
    relative = false,
    field,
  }: {
    relative?: boolean;
    field: "createdAt" | "updatedAt";
  }): string {
    if (relative) void time.now;
    if (activeNote === null) return "";

    const prefix = relative
      ? { createdAt: "Created ", updatedAt: "Updated " }[field]
      : "";

    const formatter = relative ? formatRelativeDate : formatDate;
    return `${prefix}${formatter(activeNote[field])}`;
  }

  const createdAt = $derived(getFormattedDate({ field: "createdAt" }));
  const createdAtRelative = $derived(
    getFormattedDate({ field: "createdAt", relative: true }),
  );

  const updatedAt = $derived(getFormattedDate({ field: "updatedAt" }));
  const updatedAtRelative = $derived(
    getFormattedDate({ field: "updatedAt", relative: true }),
  );

  const content = $derived(activeNote?.content ?? "");
  const wordCount = $derived.by(() => {
    const wordCount = getWordCount(content);
    return formatWordCount(wordCount);
  });
  const characterCount = $derived.by(() => {
    const characterCount = getCharacterCount(content);
    return formatCharacterCount(characterCount);
  });
  const storageUsed = $derived.by(() => {
    const storageUsedBytes = getStorageUsedBytes(content);
    return formatStorageUsedBytes(storageUsedBytes);
  });

  const noteCount = $derived.by(() => {
    const noteCount = notekeeper.notes.length;
    return `${noteCount} ${noteCount === 1 ? "note" : "notes"}`;
  });
  const totalStorageUsed = $derived.by(() => {
    const storageUsedBytes = notekeeper.storageUsedBytes;
    return `${formatStorageUsedBytes(storageUsedBytes)} total`;
  });
</script>

<footer id="status-bar" class="flex border-t border-border px-4 py-2">
  <div class="flex items-center gap-2">
    <div
      class="text-icon transition-colors hover:cursor-help hover:text-icon-hover"
      title={edited ? "Saving..." : "Saved"}
    >
      {#if edited}
        <FolderSync size={20} />
      {:else}
        <FolderCheck size={20} />
      {/if}
    </div>
    {#if activeNote !== null}
      <div title={createdAt}>
        <Chip>{createdAtRelative}</Chip>
      </div>
      <div title={updatedAt}>
        <Chip>{updatedAtRelative}</Chip>
      </div>
    {/if}
  </div>
  <div class="ml-auto flex items-center gap-2">
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
