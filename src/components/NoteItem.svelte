<script lang="ts">
  import type { Note } from "../types/note.ts";
  import notekeeper from "../lib/notekeeper.svelte";
  import { formatDate } from "../utils/formatting";
  import xIcon from "../assets/x.svg?raw";
  import trashIcon from "../assets/trash.svg?raw";
  import Icon from "./Icon.svelte";

  interface Props {
    note: Note;
    isActive: boolean;
  }

  let { note, isActive }: Props = $props();

  function handleSelect() {
    notekeeper.selectNote(note.id);
  }

  function handleCloseClick(event: MouseEvent) {
    event.stopPropagation();
    notekeeper.closeActiveNote();
  }

  function handleDeleteClick(event: MouseEvent) {
    event.stopPropagation();
    const deleteEvent = new CustomEvent("requestDelete", {
      detail: {
        noteId: note.id,
        noteTitle: note.title || "Untitled",
      },
    });
    document.dispatchEvent(deleteEvent);
  }
</script>

<div
  class="note-item"
  class:active={isActive}
  onclick={handleSelect}
  onkeydown={(e) => e.key === "Enter" && handleSelect()}
  role="button"
  tabindex="0"
  data-note-id={note.id}
>
  <p class="note-item-title">{note.title || "Untitled"}</p>
  <p class="note-item-date">{formatDate(note.updatedAt)}</p>

  {#if isActive}
    <button
      class="action-button"
      title="Close note"
      onclick={handleCloseClick}
      aria-label="Close note"
    >
      <Icon icon={xIcon} />
    </button>
  {:else}
    <button
      class="action-button"
      title="Delete note"
      onclick={handleDeleteClick}
      aria-label="Delete note"
    >
      <Icon icon={trashIcon} />
    </button>
  {/if}
</div>

<style>
  .note-item {
    position: relative;
    padding: 0.6rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 0.25rem;
    transition: background-color 0.2s;

    &:hover,
    &.active {
      background-color: var(--color-bg-hover);
    }
  }

  .note-item-title {
    font-size: 1rem;
    font-weight: 500;
    margin: 0 0 0.25rem 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .note-item-date {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .action-button {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    opacity: 0;
    transition:
      opacity 0.2s,
      color 0.2s;
  }

  .note-item:hover .action-button {
    opacity: 1;
  }

  .action-button:hover {
    color: var(--color-text);
  }
</style>
