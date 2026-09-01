<script lang="ts">
  import { onMount } from "svelte";
  import { notekeeper } from "../app/notekeeper.svelte";
  import { createNoteAndFocus } from "../app/commands";
  import {
    sidebarState,
    setSidebarWidth,
    toggleSidebarVisibility,
  } from "../app/state/sidebar.svelte";
  import NoteItem from "./NoteItem.svelte";
  import Icon from "./Icon.svelte";
  import panelLeftIcon from "../assets/panel-left.svg?raw";
  import plusIcon from "../assets/plus.svg?raw";

  const notes = $derived(notekeeper.notes);
  const activeNote = $derived(notekeeper.activeNote);
  const sidebarVisible = $derived(sidebarState.visibility === "visible");

  const buttonStyle = [
    "p-1.5 bg-none text-icon hover:text-icon-hover rounded-sm",
    "hover:bg-bg-hover hover:cursor-pointer transition-colors",
  ];

  // assigned with bind:this, and only accessed in
  // an event listener that gets attached in onMount so I guess that's fine
  let sidebar: HTMLElement = null!;
  let resizer: HTMLDivElement = null!;

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
      <button
        class={buttonStyle}
        type="button"
        title="New note"
        onclick={createNoteAndFocus}
      >
        <Icon icon={plusIcon} />
      </button>
    </div>
    <div class="ml-auto flex">
      <button
        class={buttonStyle}
        type="button"
        title="Toggle sidebar"
        onclick={toggleSidebarVisibility}
      >
        <Icon icon={panelLeftIcon} />
      </button>
    </div>
  </div>

  <nav class="flex-1 overflow-y-scroll p-3" id="note-list">
    {#if notes.length === 0}
      <p class="p-3 text-center text-sm text-text-secondary">No notes yet</p>
    {:else}
      {#each notes as note (note.id)}
        <NoteItem {note} isActive={note.id === activeNote?.id} />
      {/each}
    {/if}
  </nav>
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
    overflow: hidden;
    opacity: 1;
    transition:
      max-width 0.05s,
      opacity 0.1s;
  }

  #note-list {
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

  #sidebar.collapsed #note-list {
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
    transition-delay: 0s;
  }

  @media (prefers-reduced-motion: reduce) {
    #sidebar,
    .hideable-button,
    #note-list {
      transition: none;
    }
  }
</style>
