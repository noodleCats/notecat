export interface Modal {
  title: string;
  content: string;
  buttons: Button[];
}

export interface Button {
  id: string;
  label: string;
  variant?: "default" | "danger";
}
