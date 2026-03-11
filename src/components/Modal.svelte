<script lang="ts">
  import { tick } from "svelte";

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
  let firstButtonRef = $state<HTMLButtonElement>();

  function getFocusableElements(): HTMLElement[] {
    if (!modalElement) return [];
    const selector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(modalElement.querySelectorAll<HTMLElement>(selector));
  }

  function handleKeydown(event: KeyboardEvent) {
    const focusableElements = getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        break;
      case "Tab":
        if (focusableElements.length === 0) {
          event.preventDefault();
        }
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }

        break;
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      buttons[0].onClick();
    }
  }

  $effect(() => {
    tick().then(() => {
      firstButtonRef?.focus();
    });
  });
</script>

<svelte:window onkeydown={handleKeydown} />

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
    onkeydown={handleKeydown}
  >
    <h2 id="dialog-title">{title}</h2>
    <p>{content}</p>
    <div class="button-group">
      <button
        bind:this={firstButtonRef}
        class={buttons[0].variant === "danger"
          ? "button-danger"
          : "button-default"}
        onclick={buttons[0].onClick}
      >
        {buttons[0].label}
      </button>
      {#each buttons.slice(1) as button}
        <button
          class={button.variant === "danger"
            ? "button-danger"
            : "button-default"}
          onclick={button.onClick}
        >
          {button.label}
        </button>
      {/each}
    </div>
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
