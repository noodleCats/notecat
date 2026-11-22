<script lang="ts">
  import Undo2 from "@lucide/svelte/icons/undo-2";
  import Trash from "@lucide/svelte/icons/trash";
  import { requestDeleteNote, restoreNote } from "@/app/commands";
  import { time } from "@/app/state/time.svelte";
  import { formatPreview, formatRelativeDate } from "@/lib/formatting";
  import type { Note } from "@/shared/note";

  interface Props {
    note: Note;
  }

  let { note }: Props = $props();

  const preview = $derived(formatPreview(note.content));

  const deletedAtFormatted = $derived(
    note.deletedAt === undefined
      ? ""
      : formatRelativeDate(note.deletedAt, time.now),
  );

  const actionStyle = "cursor-pointer border-none bg-none px-1.5 py-1";
</script>

<div
  class="trash-item relative rounded-md px-3 py-2 transition-colors hover:bg-bg-hover"
  data-note-id={note.id}
>
  <div class="min-w-0 pr-16">
    <p class={["truncate", note.title ? "text-text" : "text-text-secondary"]}>
      {note.title || "Untitled"}
    </p>
    {#if preview}
      <p class="truncate text-sm text-text-secondary">{preview}</p>
    {/if}
    <p class="mt-0.5 text-xs text-text-tertiary">
      Trashed {deletedAtFormatted}
    </p>
  </div>

  <div class="actions absolute top-1/2 right-2 flex -translate-y-1/2">
    <button
      class={["action", actionStyle]}
      title="Restore note"
      aria-label="Restore note"
      onclick={() => restoreNote(note)}
    >
      <Undo2 size={16} />
    </button>
    <button
      class={["action danger", actionStyle]}
      title="Delete forever"
      aria-label="Delete forever"
      onclick={() => requestDeleteNote(note)}
    >
      <Trash size={16} />
    </button>
  </div>
</div>

<style>
  .actions {
    opacity: 0;
    transition: opacity var(--default-transition-duration);
  }

  .trash-item:is(:hover, :focus-within) .actions {
    opacity: 1;
  }

  .action {
    color: var(--color-icon);
    transition: color var(--default-transition-duration);

    &:is(:hover, :focus-visible) {
      color: var(--color-icon-hover);
    }

    &.danger:is(:hover, :focus-visible) {
      color: var(--color-danger-hover);
    }
  }
</style>
