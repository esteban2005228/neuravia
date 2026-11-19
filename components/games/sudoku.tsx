"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTime, shuffle, Stat, useTimer, Won } from "./shared";

/** n = box rows × box cols. Removing `holes` cells. */
const LEVELS = {
  "4x4": { br: 2, bc: 2, holes: 8 },
  "6x6": { br: 2, bc: 3, holes: 18 },
  "9x9": { br: 3, bc: 3, holes: 42 },
} as const;
type Level = keyof typeof LEVELS;

function generate(level: Level) {
  const { br, bc, holes } = LEVELS[level];
  const n = br * bc;
  const pattern = (r: number, c: number) => (bc * (r % br) + Math.floor(r / br) + c) % n;
  // Rows can be shuffled within bands of `br` rows; columns within stacks of `bc` columns.
  const rows = shuffle([...Array(n / br).keys()]).flatMap((band) => shuffle([...Array(br).keys()]).map((r) => band * br + r));
  const cols = shuffle([...Array(n / bc).keys()]).flatMap((stack) => shuffle([...Array(bc).keys()]).map((c) => stack * bc + c));
  const nums = shuffle([...Array(n).keys()].map((x) => x + 1));
  const solution = rows.map((r) => cols.map((c) => nums[pattern(r, c)]));
  const givens = solution.map((row) => row.map((v) => v as number | null));
  for (const i of shuffle([...Array(n * n).keys()]).slice(0, holes)) givens[Math.floor(i / n)][i % n] = null;
  return { n, br, bc, givens };
}

function conflicts(grid: (number | null)[][], br: number, bc: number) {
  const n = grid.length;
  const bad = new Set<string>();
  const check = (cells: [number, number][]) => {
    const seen = new Map<number, [number, number]>();
    for (const [r, c] of cells) {
      const v = grid[r][c];
      if (v == null) continue;
      const prev = seen.get(v);
      if (prev) {
        bad.add(`${r}-${c}`);
        bad.add(`${prev[0]}-${prev[1]}`);
      } else seen.set(v, [r, c]);
    }
  };
  for (let i = 0; i < n; i++) {
    check([...Array(n).keys()].map((c) => [i, c]));
    check([...Array(n).keys()].map((r) => [r, i]));
  }
  for (let r0 = 0; r0 < n; r0 += br)
    for (let c0 = 0; c0 < n; c0 += bc)
      check([...Array(br * bc).keys()].map((k) => [r0 + Math.floor(k / bc), c0 + (k % bc)]));
  return bad;
}

export function Sudoku() {
  const [level, setLevel] = useState<Level>("4x4");
  const [puzzle, setPuzzle] = useState(() => generate("4x4"));
  const [grid, setGrid] = useState(() => puzzle.givens.map((r) => [...r]));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [round, setRound] = useState(0);

  const { n, br, bc, givens } = puzzle;
  const bad = conflicts(grid, br, bc);
  const done = grid.every((row) => row.every((v) => v != null)) && bad.size === 0;
  const seconds = useTimer(!done, round);

  function restart(next: Level = level) {
    const p = generate(next);
    setLevel(next);
    setPuzzle(p);
    setGrid(p.givens.map((r) => [...r]));
    setSelected(null);
    setRound((r) => r + 1);
  }

  function put(value: number | null) {
    if (!selected || done) return;
    const [r, c] = selected;
    if (givens[r][c] != null) return;
    setGrid((g) => g.map((row, i) => (i === r ? row.map((v, j) => (j === c ? value : v)) : row)));
  }

  return (
    <div className="space-y-4" onKeyDown={(e) => {
      const v = Number(e.key);
      if (v >= 1 && v <= n) put(v);
      if (e.key === "Backspace" || e.key === "Delete") put(null);
    }}>
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(LEVELS) as Level[]).map((l) => (
          <Button key={l} size="sm" variant={l === level ? "default" : "outline"} onClick={() => restart(l)}>
            {l}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => restart()}>
          Nuevo
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Llena la cuadrícula para que cada fila, columna y bloque tenga los números del 1 al {n} sin repetir.
      </p>
      <div className="flex">
        <Stat label="Tiempo" value={formatTime(seconds)} />
      </div>
      {done && <Won>¡Sudoku resuelto en {formatTime(seconds)}!</Won>}
      <div
        className="grid w-fit overflow-hidden rounded-xl border-2 border-foreground/60 bg-card"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      >
        {grid.map((row, r) =>
          row.map((v, c) => {
            const given = givens[r][c] != null;
            const isSel = selected?.[0] === r && selected?.[1] === c;
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => setSelected([r, c])}
                className={cn(
                  "flex items-center justify-center border border-border text-lg font-semibold",
                  n === 9 ? "size-9 sm:size-11" : "size-12 sm:size-14",
                  (c + 1) % bc === 0 && c !== n - 1 && "border-r-2 border-r-foreground/60",
                  (r + 1) % br === 0 && r !== n - 1 && "border-b-2 border-b-foreground/60",
                  given ? "text-foreground" : "text-primary",
                  isSel && "bg-lavender/40",
                  bad.has(`${r}-${c}`) && "bg-amber/40",
                )}
              >
                {v ?? ""}
              </button>
            );
          }),
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {[...Array(n).keys()].map((i) => (
          <Button key={i} type="button" variant="outline" className="size-11 text-lg" onClick={() => put(i + 1)}>
            {i + 1}
          </Button>
        ))}
        <Button type="button" variant="ghost" onClick={() => put(null)}>
          Borrar
        </Button>
      </div>
    </div>
  );
}
