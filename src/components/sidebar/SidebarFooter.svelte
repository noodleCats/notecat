<script lang="ts">
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import Trash from "@lucide/svelte/icons/trash";
  import { notekeeper } from "@/app/notekeeper.svelte";
  import { requestEmptyTrash } from "@/app/commands";
  import { sidebarState, toggleTrashOpen } from "@/app/state/sidebar.svelte";
  import TrashItem from "@/components/sidebar/TrashItem.svelte";

  const open = $derived(sidebarState.trashOpen);
  const trashedNotes = $derived(notekeeper.trash);

  const buttonStyle =
    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-bg-sidebar-hover";
</script>

<!--
  The drawer opens upward from the footer. The note list above stays
  top-anchored, so opening it only shrinks the list's visible area and
  never moves a note.
-->
<div class="border-t border-border" id="sidebar-footer">
  <div class="drawer" class:open inert={!open}>
    <div class="min-h-0 overflow-hidden">
      <div
        class="flex max-h-[40vh] flex-col gap-0.5 overflow-y-auto p-3 pb-1"
        id="trash-drawer"
      >
        {#if trashedNotes.length === 0}
          <p class="p-3 text-center text-sm text-text-secondary">
            Trash is empty
          </p>
        {:else}
          {#each trashedNotes as note (note.id)}
            <TrashItem {note} />
          {/each}
        {/if}
      </div>
    </div>
  </div>

  <!-- The toggle keeps its size, so opening never shifts the row -->
  <div class="flex items-center gap-1 px-2 py-1.5">
    <button
      type="button"
      class={[buttonStyle, "text-text-secondary hover:text-text"]}
      aria-expanded={open}
      aria-controls="trash-drawer"
      onclick={toggleTrashOpen}
    >
      <Trash size={16} />
      <span>Trash</span>
      {#if trashedNotes.length > 0}
        <span class="text-text-tertiary">{trashedNotes.length}</span>
      {/if}
      <span class="chevron flex" class:open><ChevronUp size={16} /></span>
    </button>
    {#if trashedNotes.length > 0}
      <!-- Stays mounted and fades with the drawer rather than popping in -->
      <button
        type="button"
        class={[
          buttonStyle,
          "empty-trash ml-auto text-danger hover:text-danger-hover",
        ]}
        class:open
        inert={!open}
        onclick={requestEmptyTrash}
      >
        Empty trash
      </button>
    {/if}
  </div>
</div>

<style>
  .drawer {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--default-transition-duration);

    &.open {
      grid-template-rows: 1fr;
    }
  }

  .chevron {
    transition: rotate var(--default-transition-duration);

    &.open {
      rotate: 180deg;
    }
  }

  .empty-trash {
    opacity: 0;
    transition:
      opacity var(--default-transition-duration),
      color var(--default-transition-duration),
      background-color var(--default-transition-duration);

    &.open {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .drawer,
    .chevron,
    .empty-trash {
      transition: none;
    }
  }
</style>
