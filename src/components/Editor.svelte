<script lang="ts">
  import { notekeeper } from "../lib/notekeeper.svelte";

  let titleInputRef = $state<HTMLInputElement | undefined>();
  let textareaRef = $state<HTMLTextAreaElement | undefined>();
  let resizeTick = $state(false);

  // Handle textarea auto-resize
  function resizeTextarea() {
    if (!textareaRef || !titleInputRef) return;

    const parentElement = textareaRef.parentElement;
    const scrollTop = parentElement?.scrollTop ?? 0;

    const titleInputStyle = window.getComputedStyle(titleInputRef);
    const minHeight =
      parentElement !== null
        ? parentElement.clientHeight -
          titleInputRef.offsetHeight -
          parseFloat(titleInputStyle.marginBottom) -
          1
        : 0;

    textareaRef.style.height = "0px";
    const contentHeight = textareaRef.scrollHeight;
    textareaRef.style.height = `${Math.max(contentHeight, minHeight)}px`;

    if (parentElement !== null) {
      parentElement.scrollTop = scrollTop;
    }
  }

  // Debounced save
  let saveTimeoutId: number | undefined;
  function debouncedSave() {
    if (saveTimeoutId !== undefined) {
      clearTimeout(saveTimeoutId);
    }
    saveTimeoutId = setTimeout(() => {
      notekeeper.saveActiveNote();
    }, 200);
  }

  // Handle title input
  function handleTitleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    notekeeper.updateActiveNote("title", target.value);
    debouncedSave();
  }

  // Handle textarea input
  function handleTextareaInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    notekeeper.updateActiveNote("content", target.value);
    resizeTextarea();
    debouncedSave();
  }

  // Handle Enter key in title - move to textarea
  function handleTitleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      textareaRef?.focus();
    }
  }

  // Public methods for parent to call
  export function focusTitle() {
    titleInputRef?.focus();
    titleInputRef?.select();
  }

  // Reactive effect: resize textarea when content changes
  $effect(() => {
    if (notekeeper.getActiveNote() !== null) {
      resizeTextarea();
    }
  });

  // Handle window resize
  $effect(() => {
    const handleWindowResize = () => {
      if (!resizeTick) {
        requestAnimationFrame(() => {
          resizeTextarea();
          resizeTick = false;
        });
        resizeTick = true;
      }
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  });
</script>

<div id="editor">
  {#if notekeeper.getActiveNote()}
    {@const note = notekeeper.getActiveNote()}
    <input
      bind:this={titleInputRef}
      type="text"
      id="editor-title-input"
      value={note?.title || ""}
      oninput={handleTitleInput}
      onkeydown={handleTitleKeydown}
      placeholder="Title"
    />

    <textarea
      bind:this={textareaRef}
      id="editor-textarea"
      value={note?.content || ""}
      oninput={handleTextareaInput}
      spellcheck="false"
      placeholder="Write your notes here..."
    ></textarea>
  {/if}
</div>

<style>
  #editor {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 2rem;
    overflow-y: scroll;
  }

  #editor-title-input {
    color: var(--primary-color);
    background-color: var(--background-color);
    font-family: inherit;
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.4;
    border: none;
    outline: none;
    padding: 2rem 0 0.5rem 0;
    width: 100%;
    max-width: 50rem;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 1rem;
  }

  #editor-title-input::placeholder {
    color: var(--secondary-color);
  }

  #editor-textarea {
    color: var(--primary-color);
    background-color: var(--background-color);
    font-family: inherit;
    font-size: 1.25rem;
    line-height: 1.6;
    resize: none;
    outline: none;
    border: none;
    padding: 0;
    padding-bottom: 50vh;
    width: 100%;
    max-width: 50rem;
    overflow: hidden;
    flex-shrink: 0;
  }

  #editor-textarea::placeholder {
    color: var(--secondary-color);
  }

  #editor-textarea::selection {
    color: var(--background-color);
    background-color: var(--primary-color);
  }
</style>
