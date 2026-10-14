export type Finite = number & { readonly __brand: "Finite" };

export function isFinite(value: unknown): value is Finite {
  return typeof value === "number" && Number.isFinite(value);
}
