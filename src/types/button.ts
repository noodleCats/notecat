export interface Button {
  label: string;
  onclick: () => void;
  variant?: "default" | "danger";
}
