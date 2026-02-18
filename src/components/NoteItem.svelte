<script lang="ts">
  import type { Note } from "../types/note.ts";
  import { notekeeper } from "../lib/notekeeper.svelte";
  import { formatDate } from "../utils/formatting";

  interface Props {
    note: Note;
    isActive: boolean;
  }

  let { note, isActive }: Props = $props();

  function handleSelect() {
    notekeeper.selectNote(note.id);
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

  <button
    class="delete-button"
    title="Delete note (right-click or use button)"
    onclick={handleDeleteClick}
    aria-label="Delete note"
  >
    ×
  </button>
</div>

<style>
  .note-item {
    position: relative;
    padding: 0.75rem;
    border-radius: var(--border-radius);
    cursor: pointer;
    margin-bottom: 0.25rem;
    transition: background-color var(--transition-delay);
  }

  .note-item:hover {
    background-color: var(--hover-color);
  }

  .note-item.active {
    background-color: var(--active-color);
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
    color: var(--secondary-color);
    margin: 0;
  }

  .delete-button {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--secondary-color);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    opacity: 0;
    transition:
      opacity var(--transition-delay),
      color var(--transition-delay);
  }

  .note-item:hover .delete-button {
    opacity: 1;
  }

  .delete-button:hover {
    color: var(--primary-color);
  }
</style>
