export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function Ok(): Result<void, never>;
export function Ok<T>(value: T): Result<T, never>;
export function Ok<T>(value?: T): Result<T | void, never> {
  return { ok: true, value: value as T | void };
}

export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
