export interface Modal {
  title: string;
  content: string;
  buttons: ModalButton[];
}

export interface ModalButton {
  id: string;
  label: string;
  variant?: "default" | "danger";
}
