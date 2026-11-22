<script lang="ts">
  import { onMount } from "svelte";
  import PanelLeft from "@lucide/svelte/icons/panel-left";
  import Plus from "@lucide/svelte/icons/plus";
  import { notekeeper } from "@/app/notekeeper.svelte";
  import { createNoteAndFocus } from "@/app/commands";
  import {
    sidebarState,
    setSidebarWidth,
    toggleSidebarVisibility,
  } from "@/app/state/sidebar.svelte";
  import NoteItem from "@/components/sidebar/NoteItem.svelte";
  import SidebarFooter from "@/components/sidebar/SidebarFooter.svelte";
  import IconButton from "@/components/ui/IconButton.svelte";

  const notes = $derived(notekeeper.notes);
  const activeNote = $derived(notekeeper.activeNote);
  const sidebarVisible = $derived(sidebarState.visibility === "visible");

  // The note list is a single Tab stop; arrow keys move between rows.
  // The stop is the last row focused, else the active note, else the first.
  let lastFocusedId = $state<string | null>(null);
  const tabbableId = $derived(
    notes.find((note) => note.id === lastFocusedId)?.id ??
      activeNote?.id ??
      notes[0]?.id,
  );

  function rowOf(target: EventTarget | null): HTMLElement | null {
    return target instanceof HTMLElement
      ? target.closest<HTMLElement>("[data-note-id]")
      : null;
  }

  function onListFocusin(event: FocusEvent) {
    const id = rowOf(event.target)?.dataset.noteId;
    if (id) lastFocusedId = id;
  }

  function onListKeydown(event: KeyboardEvent) {
    const row = rowOf(event.target);
    if (!row) return;

    const rows = [
      ...noteList.querySelectorAll<HTMLElement>(":scope > [data-note-id]"),
    ];
    const index = rows.indexOf(row);
    const next = {
      ArrowDown: rows[index + 1],
      ArrowUp: rows[index - 1],
      Home: rows[0],
      End: rows.at(-1),
    }[event.key];

    if (next === undefined) return;
    event.preventDefault();
    next.focus();
  }

  // assigned with bind:this, and only accessed in
  // an event listener that gets attached in onMount so I guess that's fine
  let sidebar: HTMLElement;
  let resizer: HTMLDivElement;
  let noteList: HTMLElement;

  let startX: number;
  let startWidth: number;
  let parentWidth: number;

  function onresize(resizeEvent: MouseEvent) {
    resizeEvent.preventDefault();

    startX = resizeEvent.clientX;
    startWidth = sidebar?.offsetWidth;
    parentWidth = sidebar.parentElement?.offsetWidth ?? window.innerWidth;

    const minWidth = 240;
    const maxWidth = Math.max(parentWidth * 0.5, minWidth);

    let latestX = startX;
    let rafId: number | null = null;
    let newWidth: number | null = null;

    const onMouseMove = (moveEvent: MouseEvent) => {
      latestX = moveEvent.clientX;

      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        const delta = latestX - startX;

        newWidth = Math.min(Math.max(startWidth + delta, minWidth), maxWidth);
        sidebar.style.width = `${newWidth}px`;

        rafId = null;
      });
    };

    const onMouseUp = () => {
      if (newWidth) {
        setSidebarWidth(newWidth);
      }
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  onMount(() => {
    sidebar.style.width = `${sidebarState.width}px`;

    resizer.addEventListener("mousedown", onresize);
    return () => {
      resizer.removeEventListener("mousedown", onresize);
    };
  });
</script>

<aside
  class="flex flex-col overflow-hidden border-r border-border bg-bg-sidebar"
  class:collapsed={!sidebarVisible}
  id="sidebar"
  bind:this={sidebar}
>
  <div class="flex border-b border-border px-2 py-1.5">
    <div class="hideable-button flex">
      <IconButton
        title="New note"
        ariaLabel="New note"
        onclick={createNoteAndFocus}><Plus size={20} /></IconButton
      >
    </div>
    <div class="ml-auto flex">
      <IconButton
        title="Toggle sidebar"
        ariaLabel="Toggle sidebar"
        onclick={toggleSidebarVisibility}><PanelLeft size={20} /></IconButton
      >
    </div>
  </div>

  <!-- tabindex -1: Firefox otherwise makes the scroller its own Tab stop -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions (delegated from the rows) -->
  <nav
    class="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
    id="note-list"
    tabindex="-1"
    bind:this={noteList}
    onfocusin={onListFocusin}
    onkeydown={onListKeydown}
  >
    {#if notes.length === 0}
      <p class="p-3 text-center text-sm text-text-secondary">No notes yet</p>
    {:else}
      {#each notes as note (note.id)}
        <NoteItem
          {note}
          isActive={note.id === activeNote?.id}
          tabbable={note.id === tabbableId}
        />
      {/each}
    {/if}
  </nav>

  <SidebarFooter />
</aside>
<div
  class="relative -mx-1.5 w-3 cursor-col-resize"
  class:hidden={!sidebarVisible}
  id="resizer"
  bind:this={resizer}
></div>

<style>
  #sidebar {
    width: 240px;
    min-width: 240px;
    transition:
      width var(--default-transition-duration),
      min-width var(--default-transition-duration);
  }

  .hideable-button {
    max-width: 32px;
    opacity: 1;
    transition:
      max-width 0.05s,
      opacity 0.1s;
  }

  #note-list,
  :global(#sidebar-footer) {
    opacity: 1;
    transition: opacity 0.05s 0.05s;
  }

  #sidebar.collapsed {
    width: 48px !important;
    min-width: 48px;
  }

  #sidebar.collapsed .hideable-button {
    max-width: 0;
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
  }

  #sidebar.collapsed #note-list,
  #sidebar.collapsed :global(#sidebar-footer) {
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
    transition-delay: 0s;
  }

  @media (prefers-reduced-motion: reduce) {
    #sidebar,
    .hideable-button,
    #note-list,
    :global(#sidebar-footer) {
      transition: none;
    }
  }
</style>
