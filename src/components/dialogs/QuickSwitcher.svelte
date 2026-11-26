<script lang="ts">
  import SearchIcon from "@lucide/svelte/icons/search";
  import { notekeeper } from "@/app/notekeeper.svelte";
  import {
    closeSwitcher,
    switcherState,
    setSwitcherQuery,
  } from "@/app/state/switcher.svelte";
  import { time } from "@/app/state/time.svelte";
  import {
    formatCount,
    formatDate,
    formatPreview,
    formatShortRelativeDate,
  } from "@/lib/formatting";
  import { searchNotes, type SearchMatch } from "@/lib/search";
  import type { Note } from "@/shared/note";
  import Dialog from "@/components/ui/Dialog.svelte";
  import Highlight from "@/components/ui/Highlight.svelte";

  /** Rows shown at first, and added by each "Show more" */
  const RESULT_LIMIT = 50;
  const SHOW_MORE_ID = "switcher-show-more";

  let limit = $state(RESULT_LIMIT);

  const query = $derived(switcherState.query);
  const found = $derived(searchNotes(notekeeper.notes, query, limit));

  // With no query, this doubles as a switcher for recent notes
  const items = $derived<{ note: Note; match?: SearchMatch }[]>(
    found?.results ??
      notekeeper.notes.slice(0, limit).map((note) => ({ note })),
  );

  const total = $derived(found?.total ?? notekeeper.notes.length);
  const remaining = $derived(total - items.length);

  // "Show more" sits after the notes as one more selectable row
  const rowCount = $derived(items.length + (remaining > 0 ? 1 : 0));

  let selectedIndex = $state(0);
  // Results can shrink underneath the selection, e.g. when a note is trashed
  const activeIndex = $derived(Math.min(selectedIndex, rowCount - 1));
  const activeNote = $derived(items[activeIndex]?.note);
  const showMoreActive = $derived(
    remaining > 0 && activeIndex === items.length,
  );
  const activeId = $derived(
    activeNote
      ? `switcher-result-${activeNote.id}`
      : showMoreActive
        ? SHOW_MORE_ID
        : undefined,
  );

  let input: HTMLInputElement;

  function openNote(note: Note) {
    closeSwitcher();
    void notekeeper.selectNote(note.id);
  }

  // The selection stays at the same index, landing on the first new note
  function showMore() {
    limit += RESULT_LIMIT;
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      selectedIndex = Math.min(activeIndex + 1, rowCount - 1);
    } else if (event.key === "ArrowUp") {
      selectedIndex = Math.max(activeIndex - 1, 0);
    } else if (event.key === "Enter") {
      if (showMoreActive) showMore();
      else if (activeNote) openNote(activeNote);
    } else if (
      event.key === "Escape" ||
      (event.key === "k" && event.ctrlKey && !event.altKey && !event.shiftKey)
    ) {
      closeSwitcher();
    } else if (event.key !== "Tab") {
      // Tab is swallowed to keep focus here, the panel's only control
      return;
    }
    event.preventDefault();
  }

  // Keyed by id, not index: "Show more" hands its index to the first new note
  $effect(() => {
    if (activeId) {
      document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
    }
  });

  function onopen() {
    input.focus();
    input.select();
  }
</script>

<Dialog
  aria-label="Search notes"
  ondismiss={closeSwitcher}
  {onopen}
  layout="px-4 pt-[12vh]"
  class="flex h-fit max-h-[min(36rem,76vh)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-bg-sidebar shadow-md"
>
  <div class="flex items-center gap-3 px-4">
    <span class="shrink-0 text-icon"><SearchIcon size={20} /></span>
    <input
      bind:this={input}
      type="text"
      role="combobox"
      class="min-w-0 flex-1 bg-transparent py-4 text-lg text-text outline-none placeholder:text-text-secondary"
      placeholder="Search notes"
      aria-label="Search notes"
      aria-expanded="true"
      aria-controls="switcher-results"
      aria-autocomplete="list"
      aria-activedescendant={activeId}
      autocomplete="off"
      spellcheck="false"
      value={query}
      oninput={(event) => {
        setSwitcherQuery(event.currentTarget.value);
        selectedIndex = 0;
        limit = RESULT_LIMIT;
      }}
      {onkeydown}
    />
  </div>

  {#if items.length > 0}
    <ul
      id="switcher-results"
      role="listbox"
      aria-label="Notes"
      class="min-h-0 overflow-y-auto border-t border-border p-2"
      onmousedown={(event) => event.preventDefault()}
    >
      {#each items as { note, match }, index (note.id)}
        {const selected = $derived(index === activeIndex)}
        {const preview = $derived(
          match?.snippet?.text ?? formatPreview(note.content),
        )}
        <!-- Keyboard users choose rows from the input (combobox pattern) -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <li
          id="switcher-result-{note.id}"
          role="option"
          aria-selected={selected}
          class={[
            "cursor-pointer rounded-lg px-3 py-2",
            selected && "bg-bg-active",
          ]}
          onpointermove={() => (selectedIndex = index)}
          onclick={() => openNote(note)}
        >
          <div class="flex items-center gap-2">
            <p
              class={[
                "min-w-0 flex-1 truncate",
                note.title ? "text-text" : "text-text-secondary",
                selected && "font-semibold",
              ]}
            >
              {#if note.title}
                <Highlight text={note.title} ranges={match?.titleRanges} />
              {:else}
                Untitled
              {/if}
            </p>
            <time
              class="shrink-0 text-xs text-text-tertiary tabular-nums"
              datetime={new Date(note.updatedAt).toISOString()}
              title="Edited {formatDate(note.updatedAt)}"
            >
              {formatShortRelativeDate(note.updatedAt, time.now)}
            </time>
          </div>
          {#if preview}
            <p class="mt-0.5 truncate text-sm text-text-secondary">
              <Highlight text={preview} ranges={match?.snippet?.ranges} />
            </p>
          {/if}
        </li>
      {/each}
      {#if remaining > 0}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <li
          id={SHOW_MORE_ID}
          role="option"
          aria-selected={showMoreActive}
          class={[
            "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm",
            showMoreActive && "bg-bg-active",
          ]}
          onpointermove={() => (selectedIndex = items.length)}
          onclick={showMore}
        >
          <span
            class={[
              "min-w-0 flex-1 truncate text-text-secondary",
              showMoreActive && "font-semibold text-text",
            ]}
          >
            Show {Math.min(remaining, RESULT_LIMIT)} more
          </span>
          <span class="shrink-0 text-xs text-text-tertiary tabular-nums">
            {items.length} of {total}
          </span>
        </li>
      {/if}
    </ul>
  {:else}
    <p
      class="border-t border-border px-4 py-8 text-center text-sm text-text-secondary"
    >
      {query.trim() ? `No notes match “${query.trim()}”.` : "No notes yet."}
    </p>
  {/if}

  <p class="sr-only" aria-live="polite">
    {query.trim() ? formatCount(total, "matching note") : ""}
  </p>
</Dialog>
