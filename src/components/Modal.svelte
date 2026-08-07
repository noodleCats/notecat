<script lang="ts">
  import { onMount } from "svelte";

  interface Button {
    label: string;
    onClick: () => void;
    variant?: "default" | "danger";
  }

  interface Props {
    title: string;
    content: string;
    buttons: Button[];
  }

  let { title, content, buttons }: Props = $props();

  let modalElement = $state<HTMLDivElement>();
  let lastButtonRef = $state<HTMLButtonElement>();

  function getFocusableElements(): HTMLElement[] {
    if (!modalElement) return [];
    const selector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(modalElement.querySelectorAll<HTMLElement>(selector));
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== "Tab") return;

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

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      buttons[0].onClick();
    }
  }

  onMount(() => {
    lastButtonRef?.focus();
  });
</script>

<svelte:window {onkeydown} />

<div
  class="backdrop"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === "Escape" && buttons[0].onClick()}
  role="presentation"
>
  <div
    bind:this={modalElement}
    class="modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    tabindex="-1"
    {onkeydown}
  >
    <h2 id="dialog-title">{title}</h2>
    <p>{content}</p>
    {#if buttons.length > 0}
      <div class="button-group">
        <button
          class={buttons.at(0)!.variant === "danger"
            ? "button-danger"
            : "button-default"}
          onclick={buttons.at(0)!.onClick}
        >
          {buttons.at(0)!.label}
        </button>

        {#each buttons.slice(1, -1) as button}
          <button
            class={button.variant === "danger"
              ? "button-danger"
              : "button-default"}
            onclick={button.onClick}
          >
            {button.label}
          </button>
        {/each}

        {#if buttons.length >= 2}
          <button
            bind:this={lastButtonRef}
            class={buttons.at(-1)!.variant === "danger"
              ? "button-danger"
              : "button-default"}
            onclick={buttons.at(-1)!.onClick}
          >
            {buttons.at(-1)!.label}
          </button>
        {/if}
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
    z-index: 1000;
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
