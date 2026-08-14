import type { Modal } from "../../types/modal";

/** A button ID, or `null` when the modal is dismissed without a selection */
type ModalResult = string | null;

export const modalState = $state<{ modal: Modal | null }>({
  modal: null,
});

let resolveModal: ((result: ModalResult) => void) | undefined;

export function showModal(modal: Modal): Promise<ModalResult> {
  if (modalState.modal !== null) return Promise.resolve(null);

  return new Promise((resolve) => {
    resolveModal = resolve;
    modalState.modal = modal;
  });
}

export function closeModal(result: ModalResult): void {
  modalState.modal = null;

  resolveModal?.(result);
  resolveModal = undefined;
}
