<script lang="ts">
  import Undo2 from "@lucide/svelte/icons/undo-2";
  import Trash from "@lucide/svelte/icons/trash";
  import { requestDeleteNote, restoreNote } from "@/app/commands";
  import type { Note } from "@/shared/note";
  import SidebarRow from "@/components/sidebar/SidebarRow.svelte";

  interface Props {
    note: Note;
  }

  let { note }: Props = $props();
</script>

<!-- Single dimmed line: trashed notes recede behind live ones -->
<SidebarRow
  title={note.title}
  timestamp={note.deletedAt ?? note.updatedAt}
  timestampLabel="Trashed"
  dimmed
  data-note-id={note.id}
>
  {#snippet actions()}
    <button
      type="button"
      title="Restore note"
      aria-label="Restore note"
      onclick={() => restoreNote(note)}
    >
      <Undo2 size={16} />
    </button>
    <button
      type="button"
      class="danger"
      title="Delete forever"
      aria-label="Delete forever"
      onclick={() => requestDeleteNote(note)}
    >
      <Trash size={16} />
    </button>
  {/snippet}
</SidebarRow>
