<script lang="ts">
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Trash from "@lucide/svelte/icons/trash";
  import { notekeeper } from "@/app/notekeeper.svelte";
  import { setSidebarView, sidebarState } from "@/app/state/sidebar.svelte";

  const showingTrash = $derived(sidebarState.view === "trash");
  const trashCount = $derived(notekeeper.trash.length);
</script>

<div class="border-t border-border px-2 py-1.5" id="sidebar-footer">
  <button
    type="button"
    class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-sidebar-hover hover:text-text"
    onclick={() => setSidebarView(showingTrash ? "notes" : "trash")}
  >
    {#if showingTrash}
      <ArrowLeft size={16} />
      <span>Back to notes</span>
    {:else}
      <Trash size={16} />
      <span>Trash</span>
      {#if trashCount > 0}
        <span class="ml-auto text-text-tertiary">{trashCount}</span>
      {/if}
    {/if}
  </button>
</div>
