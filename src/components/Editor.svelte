<script lang="ts">
  import { untrack } from "svelte";
  import { notekeeper } from "../core/notekeeper.svelte";

  let titleInput = $state<HTMLInputElement | undefined>();
  let textarea = $state<HTMLTextAreaElement | undefined>();
  let resizeTick = false;

  function resizeTextarea() {
    if (!textarea || !titleInput) return;

    const parentElement = textarea.parentElement;
    const scrollTop = parentElement?.scrollTop ?? 0;
    const titleInputStyle = window.getComputedStyle(titleInput);

    let minHeight;
    if (parentElement !== null) {
      minHeight =
        parentElement.clientHeight -
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

    if (parentElement !== null) {
      parentElement.scrollTop = scrollTop;
    }
  }

  function handleTitleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    notekeeper.updateActiveNote("title", target.value);
  }

  function handleTextareaInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    notekeeper.updateActiveNote("content", target.value);
    resizeTextarea();
  }

  function handleTitleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      textarea?.focus();
    }
  }

  function handleWindowResize() {
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
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  });
</script>

<div id="editor">
  {#if notekeeper.activeNote !== null}
    {@const note = notekeeper.activeNote}
    <input
      bind:this={titleInput}
      type="text"
      id="editor-title-input"
      value={note?.title || ""}
      oninput={handleTitleInput}
      onkeydown={handleTitleKeydown}
      placeholder="Title"
    />

    <textarea
      bind:this={textarea}
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

  #editor-title-input,
  #editor-textarea {
    color: var(--color-text);
    background-color: var(--color-bg);
    font-family: inherit;
    border: none;
    outline: none;
    width: 100%;
    max-width: 50rem;

    &::placeholder {
      color: var(--color-text-secondary);
    }

    &::selection {
      color: var(--color-bg);
      background-color: var(--color-text);
    }
  }

  #editor-title-input {
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.4;
    padding: 2rem 0 0.5rem 0;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 1rem;
  }

  #editor-textarea {
    font-size: 1.25rem;
    line-height: 1.6;
    resize: none;
    padding: 0;
    padding-bottom: 50vh;
    overflow: hidden;
    flex-shrink: 0;
  }
</style>
