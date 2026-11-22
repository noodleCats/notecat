const STORAGE_PREFIX = "notecat:";

export interface VariableStore {
  get(name: string): string | null;
  set(name: string, value: string | null): void;
}

class Variables implements VariableStore {
  private target: Storage;
  private values = new Map<string, string>();

  constructor(target: Storage) {
    this.target = target;

    for (let index = 0; index < target.length; index += 1) {
      const key = target.key(index);
      if (key === null || !key.startsWith(STORAGE_PREFIX)) continue;

      const value = target.getItem(key);
      if (value !== null)
        this.values.set(key.slice(STORAGE_PREFIX.length), value);
    }
  }

  get(name: string): string | null {
    return this.values.get(name) ?? null;
  }

  set(name: string, value: string | null): void {
    if (value === null) this.values.delete(name);
    else this.values.set(name, value);

    try {
      if (value === null) this.target.removeItem(STORAGE_PREFIX + name);
      else this.target.setItem(STORAGE_PREFIX + name, value);
    } catch (err) {
      console.warn(`Could not persist variable '${name}':`, err);
    }
  }
}

function createMemoryStorage(): Storage {
  const items = new Map<string, string>();

  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
    key: (index) => [...items.keys()][index] ?? null,
  };
}

function createVariables(target: () => Storage): Variables {
  // In some environments, just reading `window.localStorage` throws a `SecurityError`,
  // which is why `target` is `() => Storage` instead of `Storage` so that
  // the throw happens when the argument is evaluated inside `try`
  try {
    return new Variables(target());
  } catch (err) {
    console.warn("Storage unavailable, falling back to memory:", err);
    return new Variables(createMemoryStorage());
  }
}

let local: Variables | undefined;
let session: Variables | undefined;

export const variables = {
  get local(): VariableStore {
    return (local ??= createVariables(() => localStorage));
  },
  get session(): VariableStore {
    return (session ??= createVariables(() => sessionStorage));
  },
};
