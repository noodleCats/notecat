<script lang="ts">
  interface Props {
    noteTitle: string;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let { noteTitle, onConfirm, onCancel }: Props = $props();

  function handleConfirm() {
    onConfirm();
  }

  function handleCancel() {
    onCancel();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  }
</script>

<div
  class="backdrop"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === 'Escape' && handleCancel()}
  role="presentation"
>
  <div class="modal">
    <h2>Delete Note?</h2>
    <p>Delete "{noteTitle}"?</p>
    <div class="button-group">
      <button class="btn-cancel" onclick={handleCancel}>Cancel</button>
      <button class="btn-confirm" onclick={handleConfirm}>Delete</button>
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
    background-color: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 2rem;
    max-width: 400px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  }

  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: var(--primary-color);
  }

  p {
    margin: 0 0 1.5rem 0;
    color: var(--secondary-color);
    font-size: 0.95rem;
  }

  .button-group {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    font-family: inherit;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-cancel {
    background-color: var(--hover-color);
    color: var(--primary-color);
  }

  .btn-cancel:hover {
    background-color: var(--active-color);
  }

  .btn-confirm {
    background-color: #d32f2f;
    color: white;
  }

  .btn-confirm:hover {
    background-color: #b71c1c;
  }
</style>
