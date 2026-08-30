<script lang="ts">
  import { onMount } from "svelte";
  import { notekeeper } from "../app/notekeeper.svelte";
  import {
    sidebarState,
    setSidebarWidth,
    toggleSidebarVisibility,
  } from "../app/state/sidebar.svelte";
  import NoteItem from "./NoteItem.svelte";
  import Icon from "./Icon.svelte";
  import panelLeftIcon from "../assets/panel-left.svg?raw";
  import plusIcon from "../assets/plus.svg?raw";
  import { createNoteAndFocus } from "../app/commands";

  const notes = $derived(notekeeper.notes);
  const activeNote = $derived(notekeeper.activeNote);
  const sidebarVisible = $derived(sidebarState.visibility === "visible");

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

<aside id="sidebar" class:collapsed={!sidebarVisible} bind:this={sidebar}>
  <div id="button-panel">
    <div id="button-panel-left">
      <button
        class="button"
        type="button"
        title="New note"
        onclick={createNoteAndFocus}
      >
        <Icon icon={plusIcon} />
      </button>
    </div>
    <div id="button-panel-right">
      <button
        class="button"
        type="button"
        title="Toggle sidebar"
        onclick={toggleSidebarVisibility}
      >
        <Icon icon={panelLeftIcon} />
      </button>
    </div>
  </div>

  <nav id="note-list">
    {#if notes.length === 0}
      <p class="empty-state-text">No notes yet</p>
    {:else}
      {#each notes as note (note.id)}
        <NoteItem {note} isActive={note.id === activeNote?.id} />
      {/each}
    {/if}
  </nav>
</aside>
<div id="resizer" bind:this={resizer} class:disabled={!sidebarVisible}></div>

<style>
  #sidebar {
    width: 240px;
    min-width: 240px;
    background-color: var(--color-bg-sidebar);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    transition:
      width var(--default-transition-duration),
      min-width var(--default-transition-duration);

    #button-panel-left button {
      max-width: 32px;
      opacity: 1;
      transition:
        max-width 0.05s,
        padding 0.05s,
        opacity 0.1s,
        color var(--default-transition-duration);
    }

    #note-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.75rem;
      opacity: 1;
      transition: opacity 0.05s 0.05s;
    }

    &.collapsed {
      width: 52px !important;
      min-width: 52px;

      #button-panel-left button {
        max-width: 0;
        padding: 0;
        opacity: 0;
        overflow: hidden;
        pointer-events: none;
        visibility: hidden;
      }

      #note-list {
        opacity: 0;
        transition: opacity 0.05s;
        pointer-events: none;
        visibility: hidden;
      }
    }

    #button-panel {
      display: flex;
      padding: 0.375rem 0.625rem;
      border-bottom: 1px solid var(--color-border);

      div {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      div#button-panel-left {
        justify-self: flex-start;
      }

      div#button-panel-right {
        justify-self: flex-end;
        margin-left: auto;
      }
    }

    .empty-state-text {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin: 0;
      padding: 0.75rem;
      text-align: center;
    }
  }

  .button {
    padding: 0.375rem;
    border-radius: 4px;
    background: none;
    color: var(--color-icon);
    transition: color var(--default-transition-duration);

    &:hover {
      color: var(--color-icon-hover);
      background-color: var(--color-bg-hover);
      cursor: pointer;
    }
  }

  #resizer {
    position: relative;
    width: 8px;
    cursor: col-resize;
    margin-inline: -4px;

    &.disabled {
      display: none;
    }
  }
</style>
