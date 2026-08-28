<script lang="ts">
  import type { Note } from "../types/note.ts";
  import { notekeeper } from "../app/notekeeper.svelte.ts";
  import { formatRelativeDate } from "../lib/formatting.ts";
  import xIcon from "../assets/x.svg?raw";
  import trashIcon from "../assets/trash.svg?raw";
  import Icon from "./Icon.svelte";
  import { requestDeleteNote } from "../app/commands.ts";

  interface Props {
    note: Note;
    isActive: boolean;
  }

  let { note, isActive }: Props = $props();

  const updatedAtFormatted = $derived.by(() => {
    const result = formatRelativeDate(note.updatedAt);
    return result.ok ? result.value : "Invalid date";
  });

  async function onclick() {
    await notekeeper.selectNote(note.id);
  }

  async function onCloseClick(event: MouseEvent) {
    event.stopPropagation();
    await notekeeper.closeActiveNote();
  }

  async function onDeleteClick(event: MouseEvent | KeyboardEvent) {
    event.stopPropagation();
    await requestDeleteNote(note);
  }
</script>

<div
  class="note-item"
  class:active={isActive}
  {onclick}
  onkeydown={(e) => {
    if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement))
      onclick();
    if (e.key === "Delete") onDeleteClick(e);
  }}
  role="button"
  tabindex="0"
  data-note-id={note.id}
>
  <div class="note-item-info">
    {#if note.title}
      <p class="note-item-title">{note.title}</p>
    {:else}
      <p class="note-item-title untitled">Untitled</p>
    {/if}

    <p class="note-item-date">{updatedAtFormatted}</p>
  </div>

  {#if isActive}
    <button
      class="action"
      title="Close note"
      onclick={onCloseClick}
      aria-label="Close note"
    >
      <Icon icon={xIcon} --width="16px" --height="16px" />
    </button>
  {:else}
    <button
      class="action"
      title="Delete note"
      onclick={onDeleteClick}
      aria-label="Delete note"
    >
      <Icon icon={trashIcon} --width="16px" --height="16px" />
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
    &:focus-visible,
    &.active {
      background-color: var(--color-bg-hover);
    }
  }

  .note-item-info {
    width: calc(100% - 1.5rem);
  }

  .note-item-title {
    font-size: 1rem;
    font-weight: 500;
    margin: 0 0 0.25rem 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &.untitled {
      color: var(--color-text-secondary);
    }
  }

  .note-item-date {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .action {
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

  .note-item:is(:hover, :focus-visible) .action {
    opacity: 1;
  }

  .action:is(:hover, :focus-visible) {
    opacity: 1;
    color: var(--color-text);
  }
</style>
