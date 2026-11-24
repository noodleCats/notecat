<script lang="ts">
  import Check from "@lucide/svelte/icons/check";
  import Refresh from "@lucide/svelte/icons/refresh-ccw";
  import { notekeeper } from "@/app/notekeeper.svelte";
  import { editorState } from "@/app/state/editor.svelte";
  import { getCharacterCount, getWordCount, getByteSize } from "@/lib/stats";
  import { formatCount, formatByteSize } from "@/lib/formatting";

  const activeNote = $derived(notekeeper.activeNote);
  const edited = $derived(notekeeper.unsavedEditsPresent);
  const hasNotes = $derived(notekeeper.allNotes.length > 0);

  // How long the "Saved" label stays up after a save before fading out
  const SAVED_LINGER_MS = 1_000;

  // Only show the label after a save, not on load or when switching notes
  let showSaved = $state(false);
  let wasEdited = false;
  $effect(() => {
    if (edited) {
      wasEdited = true;
      showSaved = false;
      return;
    }
    if (!wasEdited) return;
    wasEdited = false;
    showSaved = true;
    const timer = setTimeout(() => (showSaved = false), SAVED_LINGER_MS);
    return () => clearTimeout(timer);
  });
  const labelVisible = $derived(edited || showSaved);

  // Counts the selection while there is one, otherwise the whole note
  const content = $derived.by(() => {
    if (activeNote === null) return "";
    const { start, end } = editorState.selection;
    return editorState.textareaFocused && start !== end
      ? activeNote.content.slice(start, end)
      : activeNote.content;
  });
  const words = $derived(formatCount(getWordCount(content), "word"));
  const characters = $derived(
    formatCount(getCharacterCount(content), "character"),
  );
  const bytes = $derived(formatByteSize(getByteSize(content)));
</script>

<div class="flex items-center gap-4 text-sm text-text-secondary tabular-nums">
  {#if activeNote !== null}
    <!-- Purely a visual cue; the label is too fleeting to interact with -->
    <div
      class="pointer-events-none flex items-center gap-1.5 select-none"
      aria-hidden="true"
    >
      <!-- Label before the icon so the icon stays put as the label's width
           changes (the header is right-aligned) -->
      <span
        class={[
          "whitespace-nowrap text-text-tertiary",
          // Appear instantly to match the icon swap, but fade out slowly
          labelVisible
            ? "opacity-100"
            : "opacity-0 transition-opacity duration-500",
        ]}
      >
        {edited ? "Saving…" : "Saved"}
      </span>
      <span class="text-icon">
        {#if edited}
          <Refresh size={16} />
        {:else}
          <Check size={16} />
        {/if}
      </span>
    </div>
    <span class="whitespace-nowrap">
      {`${words} · ${characters} · ${bytes}`}
    </span>
  {:else if hasNotes}
    <p class="text-sm text-text-tertiary tabular-nums">
      {formatCount(notekeeper.notes.length, "note")}
      {#if notekeeper.trash.length > 0}
        ({notekeeper.trash.length} trashed)
      {/if}
      · {formatByteSize(notekeeper.byteSize)} total
    </p>
  {/if}
</div>
