export type ShortcutKeys = {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
};

export type Shortcut = ShortcutKeys & {
  action: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
};
