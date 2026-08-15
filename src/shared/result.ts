export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof value.then === "function"
  );
}

export function ok(): Result<void, never>;
export function ok<T>(value: T): Result<T, never>;
export function ok<T>(value?: T): Result<T | void, never> {
  return { ok: true, value: value as T | void };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function tryResult<T>(fn: () => Promise<T>): Promise<Result<T>>;
export function tryResult<T>(fn: () => T): Result<T>;
export function tryResult(fn: () => unknown): unknown {
  try {
    const result = fn();

    if (isPromiseLike(result)) {
      return Promise.resolve(result).then(ok, (e) => err(toError(e)));
    }
    return ok(result);
  } catch (e) {
    return err(toError(e));
  }
}
