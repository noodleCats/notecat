import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type StorageName = "localStorage" | "sessionStorage";

function createFakeStorage(initial: Record<string, string> = {}): Storage {
  const items = new Map(Object.entries(initial));

  return {
    get length() {
      return items.size;
    },
    clear: vi.fn(() => items.clear()),
    getItem: vi.fn((key: string) => items.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      items.set(key, String(value));
    }),
    removeItem: vi.fn((key: string) => {
      items.delete(key);
    }),
    key: vi.fn((index: number) => [...items.keys()][index] ?? null),
  };
}

const originalDescriptors = new Map<
  StorageName,
  PropertyDescriptor | undefined
>();

function defineStorage(name: StorageName, descriptor: PropertyDescriptor) {
  if (!originalDescriptors.has(name))
    originalDescriptors.set(
      name,
      Object.getOwnPropertyDescriptor(globalThis, name),
    );

  Object.defineProperty(globalThis, name, {
    configurable: true,
    ...descriptor,
  });
}

function stubStorage(name: StorageName, storage: Storage) {
  defineStorage(name, { value: storage, writable: true });
}

// `variables` caches its stores at module level, so each test needs a fresh copy
async function loadVariables() {
  vi.resetModules();
  const module = await import("@/data/variables");
  return module.variables;
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  for (const [name, descriptor] of originalDescriptors) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete (globalThis as Record<string, unknown>)[name];
  }
  originalDescriptors.clear();
  vi.restoreAllMocks();
});

describe("variables", () => {
  it("loads existing prefixed keys and ignores others", async () => {
    stubStorage(
      "localStorage",
      createFakeStorage({
        "notecat:font": "mono",
        "notecat:sidebar:width": "240",
        "other:font": "serif",
        font: "sans",
      }),
    );
    const variables = await loadVariables();

    expect(variables.local.get("font")).toBe("mono");
    expect(variables.local.get("sidebar:width")).toBe("240");
    expect(variables.local.get("other:font")).toBeNull();
    expect(variables.local.get("missing")).toBeNull();
  });

  it("only strips the leading prefix from key names", async () => {
    stubStorage(
      "localStorage",
      createFakeStorage({ "notecat:a:notecat:b": "x" }),
    );
    const variables = await loadVariables();

    expect(variables.local.get("a:notecat:b")).toBe("x");
  });

  it("sets values in memory and in storage", async () => {
    const storage = createFakeStorage();
    stubStorage("localStorage", storage);
    const variables = await loadVariables();

    variables.local.set("font", "mono");

    expect(variables.local.get("font")).toBe("mono");
    expect(storage.getItem("notecat:font")).toBe("mono");
  });

  it("overwrites existing values", async () => {
    const storage = createFakeStorage({ "notecat:font": "mono" });
    stubStorage("localStorage", storage);
    const variables = await loadVariables();

    variables.local.set("font", "serif");

    expect(variables.local.get("font")).toBe("serif");
    expect(storage.getItem("notecat:font")).toBe("serif");
  });

  it("deletes values when set to null", async () => {
    const storage = createFakeStorage({ "notecat:font": "mono" });
    stubStorage("localStorage", storage);
    const variables = await loadVariables();

    variables.local.set("font", null);

    expect(variables.local.get("font")).toBeNull();
    expect(storage.getItem("notecat:font")).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith("notecat:font");
  });

  it("keeps local and session stores separate", async () => {
    const local = createFakeStorage();
    const session = createFakeStorage();
    stubStorage("localStorage", local);
    stubStorage("sessionStorage", session);
    const variables = await loadVariables();

    variables.local.set("key", "local");
    variables.session.set("key", "session");

    expect(variables.local.get("key")).toBe("local");
    expect(variables.session.get("key")).toBe("session");
    expect(local.getItem("notecat:key")).toBe("local");
    expect(session.getItem("notecat:key")).toBe("session");
  });

  it("does not touch storage until a store is first used", async () => {
    const getter = vi.fn(() => createFakeStorage());
    defineStorage("localStorage", { get: getter });
    const variables = await loadVariables();

    expect(getter).not.toHaveBeenCalled();

    variables.local.get("font");
    variables.local.get("font");

    expect(getter).toHaveBeenCalledTimes(1);
  });

  it("falls back to memory when accessing storage throws", async () => {
    defineStorage("localStorage", {
      get() {
        throw new DOMException("Access denied", "SecurityError");
      },
    });
    const variables = await loadVariables();

    expect(variables.local.get("font")).toBeNull();

    variables.local.set("font", "mono");
    expect(variables.local.get("font")).toBe("mono");

    variables.local.set("font", null);
    expect(variables.local.get("font")).toBeNull();

    expect(console.warn).toHaveBeenCalledWith(
      "Storage unavailable, falling back to memory:",
      expect.any(DOMException),
    );
  });

  it("falls back to memory when reading storage contents throws", async () => {
    const storage = createFakeStorage({ "notecat:font": "mono" });
    vi.mocked(storage.key).mockImplementation(() => {
      throw new Error("Broken storage");
    });
    stubStorage("localStorage", storage);
    const variables = await loadVariables();

    expect(variables.local.get("font")).toBeNull();

    variables.local.set("font", "serif");
    expect(variables.local.get("font")).toBe("serif");
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("keeps the value in memory when writing to storage fails", async () => {
    const storage = createFakeStorage();
    vi.mocked(storage.setItem).mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    stubStorage("localStorage", storage);
    const variables = await loadVariables();

    expect(() => variables.local.set("font", "mono")).not.toThrow();

    expect(variables.local.get("font")).toBe("mono");
    expect(console.warn).toHaveBeenCalledWith(
      "Could not persist variable 'font':",
      expect.any(DOMException),
    );
  });

  it("still deletes the value in memory when removing from storage fails", async () => {
    const storage = createFakeStorage({ "notecat:font": "mono" });
    vi.mocked(storage.removeItem).mockImplementation(() => {
      throw new Error("Broken storage");
    });
    stubStorage("localStorage", storage);
    const variables = await loadVariables();

    expect(() => variables.local.set("font", null)).not.toThrow();

    expect(variables.local.get("font")).toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });
});
