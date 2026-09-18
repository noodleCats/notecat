<script lang="ts">
  import FolderCheck from "@lucide/svelte/icons/folder-check";
  import FolderSync from "@lucide/svelte/icons/folder-sync";
  import { notekeeper } from "@/app/notekeeper.svelte";
  import { time } from "@/app/state/time.svelte";
  import { getCharacterCount, getWordCount, getByteSize } from "@/lib/stats";
  import {
    formatCount,
    formatByteSize,
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
      <div title={getFormattedDate({ field: "createdAt" })}>
        <Chip>{getFormattedDate({ field: "createdAt", relative: true })}</Chip>
      </div>
      <div title={getFormattedDate({ field: "updatedAt" })}>
        <Chip>{getFormattedDate({ field: "updatedAt", relative: true })}</Chip>
      </div>
    {/if}
  </div>
  <div class="ml-auto flex items-center gap-2">
    {#if activeNote !== null}
      {const content = $derived(activeNote.content)}
      <Chip>{formatCount(getWordCount(content), "word")}</Chip>
      <Chip>{formatCount(getCharacterCount(content), "character")}</Chip>
      <Chip>{formatByteSize(getByteSize(content))}</Chip>
    {:else}
      <Chip>{formatCount(notekeeper.notes.length, "note")}</Chip>
      <Chip>{formatByteSize(notekeeper.byteSize)} total</Chip>
    {/if}
  </div>
</footer>
