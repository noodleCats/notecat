<script lang="ts">
  import X from "@lucide/svelte/icons/x";
  import Trash from "@lucide/svelte/icons/trash";
  import { notekeeper } from "@/app/notekeeper.svelte";
  import { trashNote } from "@/app/commands";
  import { time } from "@/app/state/time.svelte";
  import { formatPreview, formatRelativeDate } from "@/lib/formatting";
  import type { Note } from "@/shared/note";

  interface Props {
    note: Note;
    isActive: boolean;
  }

  let { note, isActive }: Props = $props();

  const preview = $derived(formatPreview(note.content));

  const updatedAtFormatted = $derived(
    formatRelativeDate(note.updatedAt, time.now),
  );

  const actionStyle =
    "py-1 px-2 bg-none border-none absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer";

  async function onclick() {
    await notekeeper.selectNote(note.id);
  }

  async function onCloseClick(event: MouseEvent) {
    event.stopPropagation();
    await notekeeper.closeActiveNote();
  }

  async function onTrashClick(event: MouseEvent | KeyboardEvent) {
    event.stopPropagation();
    await trashNote(note);
  }
</script>

<div
  class={[
    "relative cursor-pointer rounded-md px-3 py-2",
    "transition-colors",
    isActive ? "bg-bg-active" : "hover:bg-bg-hover focus-visible:bg-bg-hover",
  ]}
  {onclick}
  onkeydown={(e) => {
    if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement))
      onclick();
    if (e.key === "Delete") onTrashClick(e);
  }}
  role="button"
  tabindex="0"
  aria-current={isActive ? "true" : undefined}
  data-note-id={note.id}
>
  <div class="min-w-0 pr-6">
    <p
      class={[
        "truncate",
        note.title ? "text-text" : "text-text-secondary",
        isActive && "font-semibold",
      ]}
    >
      {note.title || "Untitled"}
    </p>
    {#if preview}
      <p class="truncate text-sm text-text-secondary">{preview}</p>
    {/if}
    <p class="mt-0.5 text-xs text-text-tertiary">{updatedAtFormatted}</p>
  </div>

  {#if isActive}
    <button
      class={["action", actionStyle]}
      title="Close note"
      onclick={onCloseClick}
      aria-label="Close note"
    >
      <X size={16} />
    </button>
  {:else}
    <button
      class={["action", actionStyle]}
      title="Move to trash"
      onclick={onTrashClick}
      aria-label="Move to trash"
    >
      <Trash size={16} />
    </button>
  {/if}
</div>

<style>
  .action {
    color: var(--color-icon);
    opacity: 0;
    transition:
      color var(--default-transition-duration),
      opacity var(--default-transition-duration);
  }

  *:is(:hover, :focus-visible) > .action {
    opacity: 1;
  }

  .action:is(:hover, :focus-visible) {
    color: var(--color-icon-hover);
    opacity: 1;
  }
</style>
