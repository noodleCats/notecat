<script lang="ts">
  interface Props {
    noteTitle: string;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let { noteTitle, onConfirm, onCancel }: Props = $props();

  let confirmButton = $state<HTMLButtonElement>();

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      onCancel();
    } else if (e.key === "Enter") {
      onConfirm();
    }
  }

  // Auto-focus the confirm button when the modal opens
  $effect(() => {
    confirmButton?.focus();
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="backdrop" onclick={handleBackdropClick} role="presentation">
  <div class="modal">
    <h2>Delete note?</h2>
    <p>
      Are you sure you want to delete "{noteTitle}"? This action cannot be
      undone.
    </p>
    <div class="button-group">
      <button class="button-cancel" onclick={onCancel}>Cancel</button>
      <button
        bind:this={confirmButton}
        class="button-confirm"
        onclick={onConfirm}
      >
        Delete
      </button>
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
    padding: 1.5rem;
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
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button-cancel {
    background-color: var(--color-bg-button);

    &:hover {
      background-color: var(--color-bg-button-hover);
    }
  }

  .button-confirm {
    background-color: var(--color-bg-delete);

    &:hover {
      background-color: var(--color-bg-delete-hover);
    }
  }
</style>
