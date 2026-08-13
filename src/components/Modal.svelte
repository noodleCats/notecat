<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { Modal } from "../types/modal";
  import { closeModal } from "../core/state/modal.svelte";

  let { title, content, buttons }: Modal = $props();

  let modalElement = $state<HTMLDivElement>();
  let lastButtonRef = $state<HTMLButtonElement>();
  let previouslyFocusedElement: HTMLElement | null = null;

  function getFocusableElements(): HTMLElement[] {
    if (!modalElement) return [];
    const selector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(modalElement.querySelectorAll<HTMLElement>(selector));
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== "Tab" && event.key !== "Escape") return;

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeModal(null);
      return;
    }

    const focusableElements = getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (focusableElements.length === 0) {
      event.preventDefault();
    }
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement?.focus();
    }
  }

  function onclick(event: MouseEvent) {
    if (event.target === event.currentTarget) closeModal(null);
  }

  onMount(() => {
    previouslyFocusedElement = document.activeElement as HTMLElement | null;
    (lastButtonRef ?? modalElement)?.focus();
  });

  onDestroy(() => previouslyFocusedElement?.focus());
</script>

<svelte:window {onkeydown} />

<div class="backdrop" {onclick} role="presentation">
  <div
    bind:this={modalElement}
    class="modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    tabindex="-1"
  >
    <h2 id="dialog-title">{title}</h2>
    <p>{content}</p>
    {#if buttons.length > 0}
      <div class="button-group">
        {#each buttons.slice(0, -1) as button}
          <button
            class={button.variant === "danger"
              ? "button-danger"
              : "button-default"}
            onclick={() => closeModal(button.id)}
          >
            {button.label}
          </button>
        {/each}

        <button
          bind:this={lastButtonRef}
          class={buttons.at(-1)!.variant === "danger"
            ? "button-danger"
            : "button-default"}
          onclick={() => closeModal(buttons.at(-1)!.id)}
        >
          {buttons.at(-1)!.label}
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal {
    background-color: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 1.25rem;
    max-width: 400px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  }

  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: var(--color-text);
  }

  p {
    margin: 0 0 1.5rem 0;
    color: var(--color-text-secondary);
    font-size: 0.95rem;
  }

  .button-group {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  button {
    color: var(--color-text);
    font-size: 0.95rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button-default {
    background-color: var(--color-bg-button);

    &:hover {
      background-color: var(--color-bg-button-hover);
    }
  }

  .button-danger {
    color: var(--color-white);
    background-color: var(--color-bg-delete);

    &:hover {
      background-color: var(--color-bg-delete-hover);
    }
  }
</style>
