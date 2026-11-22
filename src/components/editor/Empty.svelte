<script lang="ts">
  import Icon from "@/components/ui/Icon.svelte";
  import Kbd from "@/components/ui/Kbd.svelte";
  import { notekeeper } from "@/app/notekeeper.svelte";
  import { createNoteAndFocus } from "@/app/commands";
  import notecatLogo from "@/assets/logo.svg?raw";

  const hasNotes = $derived(notekeeper.notes.length > 0);
</script>

<div
  id="empty"
  class="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center"
>
  <div class="text-text-tertiary opacity-20">
    <Icon icon={notecatLogo} --width="10rem" --height="8.75rem" />
  </div>
  <div class="flex flex-col items-center gap-3 text-text-secondary">
    <p>{hasNotes ? "Pick a note from the sidebar, or" : "No notes yet."}</p>
    <button
      type="button"
      class="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-text transition-colors hover:bg-bg-hover"
      onclick={createNoteAndFocus}
    >
      <span>{hasNotes ? "start a new one" : "Create your first note"}</span>
      <Kbd key="N" alt />
    </button>
  </div>
</div>
