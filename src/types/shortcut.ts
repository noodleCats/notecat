// note to future self: macOS keyboard shortcuts are oriented more
// around the 'command' key (event.metaKey for a KeyboardEvent) so
// don't assume those three will always be enough
export type Shortcut = {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
};

export type ShortcutDef = Shortcut & {
  action: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
};
