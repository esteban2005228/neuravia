/** Random helpers for building each run's content on the client. Never used for scoring. */

export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pick = <T>(items: readonly T[], n: number): T[] => shuffle(items).slice(0, n);

/** A shuffled copy that differs from the given order (when that is possible). */
export function reorder<T>(items: readonly T[], avoid: readonly T[] = items): T[] {
  if (new Set(items).size < 2) return [...items];
  let a: T[];
  do a = shuffle(items);
  while (a.every((x, i) => x === avoid[i]));
  return a;
}
