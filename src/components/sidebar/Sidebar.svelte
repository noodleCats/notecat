<script lang="ts">
  import { onMount } from "svelte";
  import Plus from "@lucide/svelte/icons/plus";
  import { notekeeper } from "@/app/notekeeper.svelte";
  import { createNoteAndFocus } from "@/app/commands";
  import { sidebarState, setSidebarWidth } from "@/app/state/sidebar.svelte";
  import NoteItem from "@/components/sidebar/NoteItem.svelte";
  import SidebarFooter from "@/components/sidebar/SidebarFooter.svelte";

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

  const MIN_WIDTH = 240;
  const KEYBOARD_STEP = 16;

  function maxWidth() {
    const parentWidth = sidebar.parentElement?.offsetWidth ?? window.innerWidth;
    return Math.max(parentWidth * 0.5, MIN_WIDTH);
  }

  function clampWidth(width: number) {
    return Math.min(Math.max(width, MIN_WIDTH), maxWidth());
  }

  function onresize(resizeEvent: MouseEvent) {
    resizeEvent.preventDefault();

    const startX = resizeEvent.clientX;
    const startWidth = sidebar.offsetWidth;

    let latestX = startX;
    let rafId: number | null = null;
    let newWidth: number | null = null;

    const onMouseMove = (moveEvent: MouseEvent) => {
      latestX = moveEvent.clientX;

      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        newWidth = clampWidth(startWidth + latestX - startX);
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

  function onResizerKeydown(event: KeyboardEvent) {
    // Not offsetWidth: it lags behind mid-transition when the key repeats
    const current = sidebarState.width;
    const target = {
      ArrowLeft: current - KEYBOARD_STEP,
      ArrowRight: current + KEYBOARD_STEP,
      Home: MIN_WIDTH,
      End: maxWidth(),
    }[event.key];

    if (target === undefined) return;
    event.preventDefault();

    const newWidth = clampWidth(target);
    sidebar.style.width = `${newWidth}px`;
    setSidebarWidth(newWidth);
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
  inert={!sidebarVisible}
  id="sidebar"
  bind:this={sidebar}
>
  <div class="flex items-center gap-1 border-b border-border px-2 py-1.5">
    <button
      type="button"
      class="cursor-pointer rounded-sm p-1.5 text-icon transition-colors hover:bg-bg-sidebar-hover hover:text-icon-hover"
      title="New note"
      aria-label="New note"
      onclick={createNoteAndFocus}
    >
      <Plus size={20} />
    </button>
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
    {#each notes as note (note.id)}
      <NoteItem
        {note}
        isActive={note.id === activeNote?.id}
        tabbable={note.id === tabbableId}
      />
    {/each}
  </nav>

  <SidebarFooter />
</aside>
<!-- Window splitter pattern: a focusable separator is interactive -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="relative -mx-1.5 w-3 cursor-col-resize"
  class:hidden={!sidebarVisible}
  id="resizer"
  role="separator"
  aria-label="Resize sidebar"
  aria-controls="sidebar"
  aria-orientation="vertical"
  aria-valuenow={Math.round(sidebarState.width)}
  aria-valuemin={MIN_WIDTH}
  tabindex="0"
  bind:this={resizer}
  onkeydown={onResizerKeydown}
></div>

<style>
  #sidebar {
    width: 240px;
    min-width: 240px;
    transition:
      width var(--default-transition-duration),
      min-width var(--default-transition-duration),
      border-right-width var(--default-transition-duration);
  }

  #sidebar > :global(*) {
    opacity: 1;
    transition: opacity 0.05s 0.05s;
  }

  /* Hides fully; the toggle lives in the header */
  #sidebar.collapsed {
    width: 0 !important;
    min-width: 0;
    border-right-width: 0;
  }

  #sidebar.collapsed > :global(*) {
    opacity: 0;
    visibility: hidden;
    transition-delay: 0s;
  }

  @media (prefers-reduced-motion: reduce) {
    #sidebar,
    #sidebar > :global(*) {
      transition: none;
    }
  }
</style>
