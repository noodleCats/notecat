<script lang="ts">
  import { tick, untrack } from "svelte";
  import { notekeeper } from "../app/notekeeper.svelte";
  import { editorState } from "../app/state/editor.svelte";

  let titleInput = $state<HTMLInputElement>();
  let textarea = $state<HTMLTextAreaElement>();
  let resizeTick = false;

  function resizeTextarea({
    scrollPosition = "pixel"
  }: {
    scrollPosition?: "pixel" | "relative"
  } = {}) {
    if (!textarea || !titleInput) return;

    const scrollContainer = document.getElementById("editor");
    const scrollTop = scrollContainer?.scrollTop ?? 0;
    const oldMaxScroll =
      (scrollContainer?.scrollHeight ?? 0) -
      (scrollContainer?.clientHeight ?? 0);
    const scrollProgress = oldMaxScroll > 0 ? scrollTop / oldMaxScroll : 0

    const titleInputStyle = window.getComputedStyle(titleInput);

    let minHeight;
    if (scrollContainer !== null) {
      minHeight =
        scrollContainer.clientHeight -
        titleInput.offsetHeight -
        parseFloat(titleInputStyle.marginBottom) -
        1;
      // -1 is needed to stop the scroll bar from flickering when resizing.
      // Math.floor didn't work
    } else {
      minHeight = 0;
    }

    textarea.style.height = "0px";
    const contentHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.max(contentHeight, minHeight)}px`;

    if (scrollContainer !== null) {
      const newMaxScroll =
        scrollContainer.scrollHeight - scrollContainer.clientHeight;

      scrollContainer.scrollTop = scrollPosition === "relative"
        ? scrollProgress * newMaxScroll
        : scrollTop;
    }
  }

  function onTitleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    notekeeper.updateActiveNote("title", target.value);
  }

  function onTextareaInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    notekeeper.updateActiveNote("content", target.value);
    resizeTextarea();
  }

  function onTitleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      textarea?.focus();
    }
  }

  function onresize() {
    if (!resizeTick) {
      requestAnimationFrame(() => {
        resizeTextarea();
        resizeTick = false;
      });
      resizeTick = true;
    }
  }

  export function focusTitle() {
    titleInput?.focus();
    titleInput?.select();
  }

  $effect(() => {
    if (notekeeper.activeNote !== null) {
      untrack(() => resizeTextarea());
    }
  });

  $effect(() => {
    void editorState.font;
    untrack(() => resizeTextarea({ scrollPosition: "relative" }));
  });

  $effect(() => {
    if (editorState.titleFocusRequest === 0) return;

    void tick().then(() => focusTitle());
  });
</script>

<svelte:window {onresize} />

<div id="editor" class="flex flex-1 flex-col items-center px-8 overflow-y-scroll">
  {#if notekeeper.activeNote !== null}
    {const note = $derived(notekeeper.activeNote)}
    <div class={[
      "text-text bg-bg flex flex-col h-fit w-full max-w-3xl", 
      editorState.font === "monospace" && "font-mono"
    ]}>
      <input
        bind:this={titleInput}
        type="text"
        id="title-input"
        class="text-2xl font-semibold pt-8 pb-2 mb-4 border-b border-border"
        value={note?.title || ""}
        oninput={onTitleInput}
        onkeydown={onTitleKeydown}
        placeholder="Title"
      />

      <textarea
        bind:this={textarea}
        id="textarea"
        class="text-xl/8 resize-none pb-[50vh] overflow-hidden shrink-0" 
        value={note?.content || ""}
        oninput={onTextareaInput}
        spellcheck="false"
        placeholder="Write your notes here..."
      ></textarea>
    </div>
  {/if}
</div>

{#if notekeeper.activeNote !== null}
  {const note = $derived(notekeeper.activeNote)}
  <article class="print">
    {#if note.title}
      <h1>{note.title}</h1>
    {/if}
    <div class="print-content">{note.content}</div>
  </article>
{/if}

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

  .print {
    display: none;
  }

  @page {
    margin: 18mm;
  }

  @media print {
    :global(#app) {
      display: block;
      width: auto;
      height: auto;
      color: #000;
      background: #fff;
    }

    :global(main) {
      display: block;
    }

    :global(#header),
    :global(#sidebar),
    :global(#resizer),
    :global(#status-bar),
    :global(#editor),
    :global(#empty) {
      display: none !important;
    }

    .print {
      display: block;
      max-width: 44rem;
      margin: 0;
      color: #000;
      background: #fff;
    }

    .print h1 {
      margin: 0 0 12pt;
      font-size: 20pt;
      line-height: 1.2;
    }

    .print-content {
      font-size: 12pt;
      line-height: 1.5;
      white-space: pre-wrap;
      overflow-wrap: break-word;
    }
  }
</style>
