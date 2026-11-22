<script lang="ts">
  import X from "@lucide/svelte/icons/x";
  import Trash from "@lucide/svelte/icons/trash";
  import { notekeeper } from "@/app/notekeeper.svelte";
  import { trashNote } from "@/app/commands";
  import { formatPreview } from "@/lib/formatting";
  import type { Note } from "@/shared/note";
  import SidebarRow from "@/components/sidebar/SidebarRow.svelte";

  interface Props {
    note: Note;
    isActive: boolean;
    /** Whether this row is the note list's single Tab stop */
    tabbable: boolean;
  }

  let { note, isActive, tabbable }: Props = $props();

  const preview = $derived(formatPreview(note.content));

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

<SidebarRow
  class="cursor-pointer"
  title={note.title}
  {preview}
  timestamp={note.updatedAt}
  timestampLabel="Edited"
  active={isActive}
  {onclick}
  onkeydown={(e) => {
    if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement))
      onclick();
    if (e.key === "Delete") onTrashClick(e);
  }}
  role="button"
  tabindex={tabbable ? 0 : -1}
  aria-current={isActive ? "true" : undefined}
  data-note-id={note.id}
>
  {#snippet actions()}
    {#if isActive}
      <button
        type="button"
        title="Close note"
        aria-label="Close note"
        tabindex={-1}
        onclick={onCloseClick}
      >
        <X size={16} />
      </button>
    {:else}
      <button
        type="button"
        title="Move to trash"
        aria-label="Move to trash"
        tabindex={-1}
        onclick={onTrashClick}
      >
        <Trash size={16} />
      </button>
    {/if}
  {/snippet}
</SidebarRow>
