export type Subscale = { key: string; label: string; score: number; max: number };

export function isSubscaleList(value: unknown): value is Subscale[] {
  return (
    Array.isArray(value) &&
    value.every(
      (s) => s && typeof s.key === "string" && typeof s.label === "string" && typeof s.score === "number" && typeof s.max === "number",
    )
  );
}
