<script lang="ts">
  import { onMount, tick, untrack } from "svelte";
  import { notekeeper } from "../app/notekeeper.svelte";
  import { editorState, setShouldFocusTitle } from "../app/state/editor.svelte";
  import type { Note } from "../types/note";

  interface Props {
    note: Note;
  }

  let { note }: Props = $props();

  let editor: HTMLDivElement;
  let titleInput: HTMLInputElement;
  let textarea: HTMLTextAreaElement;
  let contentField: HTMLDivElement;
  let previousFont = editorState.font;

  function resizeTextarea(progress?: number) {
    if (!textarea) return;

    const scrollTop = editor.scrollTop;
    textarea.style.height = "0px";

    // clientHeight rounds fractional space up, which can create 1px of overflow
    const minHeight = Math.floor(contentField.getBoundingClientRect().height);
    textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
    editor.scrollTop =
      progress === undefined
        ? scrollTop
        : progress * (editor.scrollHeight - editor.clientHeight);
  }

  onMount(() => {
    const observer = new ResizeObserver(() => resizeTextarea());
    observer.observe(editor);
    return () => observer.disconnect();
  });

  $effect(() => {
    void note;
    untrack(() => resizeTextarea());
  });

  $effect.pre(() => {
    if (previousFont === editorState.font) return;
    previousFont = editorState.font;

    if (!editor) return;

    const maxScroll = editor.scrollHeight - editor.clientHeight;
    const progress = maxScroll > 0 ? editor.scrollTop / maxScroll : 0;

    void tick().then(() => {
      resizeTextarea(progress);
    });
  });

  $effect(() => {
    if (!editorState.shouldFocusTitle) return;

    titleInput.focus();
    titleInput.select();
    setShouldFocusTitle(false);
  });
</script>

<div
  bind:this={editor}
  id="editor"
  class="flex flex-1 flex-col items-center overflow-y-scroll px-8"
>
  <div
    class={[
      "flex min-h-full w-full max-w-3xl flex-col bg-bg text-text",
      editorState.font === "monospace" && "font-mono",
    ]}
  >
    <input
      bind:this={titleInput}
      type="text"
      id="title-input"
      class="mb-4 shrink-0 border-b border-border pt-8 pb-2 text-2xl font-semibold"
      value={note.title}
      oninput={(event) =>
        notekeeper.updateActiveNote("title", event.currentTarget.value)}
      onkeydown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          textarea.focus();
        }
      }}
      placeholder="Title"
    />

    <div bind:this={contentField} class="flex-1 text-xl/8">
      <textarea
        bind:this={textarea}
        id="textarea"
        value={note.content}
        oninput={(event) => {
          notekeeper.updateActiveNote("content", event.currentTarget.value);
          resizeTextarea();
        }}
        spellcheck="false"
        placeholder="Write your notes here..."></textarea>
    </div>
  </div>
</div>

<style>
  #title-input,
  #textarea {
    outline: none;

    &::placeholder {
      color: var(--color-text-secondary);
    }

    &::selection {
      color: var(--color-bg);
      background-color: var(--color-text);
    }
  }

  #textarea {
    display: block;
    width: 100%;
    resize: none;
    overflow: hidden;
    padding: 0 0 50vh;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
</style>
