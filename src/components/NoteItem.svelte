<script lang="ts">
  import type { Note } from "../types/note.ts";
  import { notekeeper } from "../app/notekeeper.svelte.ts";
  import { formatRelativeDate } from "../lib/formatting.ts";
  import xIcon from "../assets/x.svg?raw";
  import trashIcon from "../assets/trash.svg?raw";
  import Icon from "./Icon.svelte";
  import { requestDeleteNote } from "../app/commands.ts";
  import { time } from "../app/state/time.svelte.ts";

  interface Props {
    note: Note;
    isActive: boolean;
  }

  let { note, isActive }: Props = $props();

  const updatedAtFormatted = $derived.by(() => {
    void time.now;
    const result = formatRelativeDate(note.updatedAt);
    return result.ok ? result.value : "Invalid date";
  });

  const actionStyle =
    "py-1 px-2 bg-none border-none absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer";

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
  class={[
    "relative py-2.5 px-3 rounded-md cursor-pointer mb-1",
    "transition-colors hover:bg-bg-hover focus-visible:bg-bg-hover",
    isActive && "bg-bg-hover",
  ]}
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
  <div class="w-[calc(100% - 1.5rem)]">
    {#if note.title}
      <p class="mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
        {note.title}
      </p>
    {:else}
      <p
        class="mb-1 whitespace-nowrap overflow-hidden text-ellipsis text-text-secondary"
      >
        Untitled
      </p>
    {/if}

    <p class="text-xs text-text-secondary">{updatedAtFormatted}</p>
  </div>

  {#if isActive}
    <button
      class={["action", actionStyle]}
      title="Close note"
      onclick={onCloseClick}
      aria-label="Close note"
    >
      <Icon icon={xIcon} --width="16px" --height="16px" />
    </button>
  {:else}
    <button
      class={["action", actionStyle]}
      title="Delete note"
      onclick={onDeleteClick}
      aria-label="Delete note"
    >
      <Icon icon={trashIcon} --width="16px" --height="16px" />
    </button>
  {/if}
</div>

<style>
  .action {
    color: var(--color-text-secondary);
    opacity: 0;
    transition:
      color var(--default-transition-duration),
      opacity var(--default-transition-duration);
  }

  *:is(:hover, :focus-visible) > .action {
    opacity: 1;
  }

  .action:is(:hover, :focus-visible) {
    color: var(--color-text);
    opacity: 1;
  }
</style>
