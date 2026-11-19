"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTime, shuffle, Stat, useTimer, Won } from "./shared";

const WORD_BANK = [
  "MEMORIA", "ATENCION", "CEREBRO", "ENFOQUE", "NEURONA", "RECUERDO", "CALMA", "IDEA",
  "LECTURA", "SUEÑO", "PAUSA", "HABITO", "MENTE", "JUEGO", "PLAN", "AGUA",
];
const SIZE = 10;
const LETTERS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
const DIRS = [
  [0, 1], [1, 0], [1, 1], [-1, 1],
] as const;

type Cell = [number, number];
type Placed = { word: string; cells: Cell[] };

function build(count: number) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const grid: string[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(""));
    const placed: Placed[] = [];
    for (const word of shuffle(WORD_BANK)) {
      if (placed.length === count) break;
      for (let t = 0; t < 100; t++) {
        const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
        const r0 = Math.floor(Math.random() * SIZE);
        const c0 = Math.floor(Math.random() * SIZE);
        const cells: Cell[] = [...word].map((_, i) => [r0 + dr * i, c0 + dc * i]);
        const fits = cells.every(
          ([r, c], i) => r >= 0 && r < SIZE && c >= 0 && c < SIZE && (grid[r][c] === "" || grid[r][c] === word[i]),
        );
        if (!fits) continue;
        cells.forEach(([r, c], i) => (grid[r][c] = word[i]));
        placed.push({ word, cells });
        break;
      }
    }
    if (placed.length === count) {
      for (const row of grid) for (let c = 0; c < SIZE; c++) row[c] ||= LETTERS[Math.floor(Math.random() * LETTERS.length)];
      return { grid, placed };
    }
  }
  throw new Error("Could not build word search");
}

function lineBetween([r1, c1]: Cell, [r2, c2]: Cell): Cell[] | null {
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  const len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
  if (r1 !== r2 && c1 !== c2 && Math.abs(r2 - r1) !== Math.abs(c2 - c1)) return null;
  return Array.from({ length: len + 1 }, (_, i) => [r1 + dr * i, c1 + dc * i] as Cell);
}

const key = ([r, c]: Cell) => `${r}-${c}`;

export function WordSearch() {
  const [count, setCount] = useState(6);
  const [{ grid, placed }, setPuzzle] = useState(() => build(6));
  const [found, setFound] = useState<string[]>([]);
  const [start, setStart] = useState<Cell | null>(null);
  const [round, setRound] = useState(0);
  const [miss, setMiss] = useState(false);

  const done = found.length === placed.length;
  const seconds = useTimer(!done, round);
  const foundCells = new Set(placed.filter((p) => found.includes(p.word)).flatMap((p) => p.cells.map(key)));

  function restart(n = count) {
    setCount(n);
    setPuzzle(build(n));
    setFound([]);
    setStart(null);
    setRound((r) => r + 1);
  }

  function pick(cell: Cell) {
    if (done) return;
    if (!start) return setStart(cell);
    const line = lineBetween(start, cell);
    setStart(null);
    if (!line) return;
    const text = line.map(([r, c]) => grid[r][c]).join("");
    const hit = placed.find(
      (p) => !found.includes(p.word) && (p.word === text || p.word === [...text].reverse().join("")),
    );
    if (hit) setFound((f) => [...f, hit.word]);
    else {
      setMiss(true);
      setTimeout(() => setMiss(false), 500);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {[6, 8].map((n) => (
          <Button key={n} size="sm" variant={n === count ? "default" : "outline"} onClick={() => restart(n)}>
            {n} palabras
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => restart()}>
          Nueva sopa
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Toca la primera letra de una palabra y luego la última.</p>
      <div className="flex gap-3">
        <Stat label="Encontradas" value={`${found.length}/${placed.length}`} />
        <Stat label="Tiempo" value={formatTime(seconds)} />
      </div>
      {done && <Won>¡Encontraste todas las palabras en {formatTime(seconds)}!</Won>}
      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <div
          className={cn("grid w-fit gap-1 rounded-xl border bg-card p-2 transition-colors", miss && "border-amber")}
          style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
        >
          {grid.map((row, r) =>
            row.map((letter, c) => (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => pick([r, c])}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md font-mono text-sm font-semibold sm:size-9 sm:text-base",
                  foundCells.has(`${r}-${c}`) && "bg-cyan/50",
                  start && start[0] === r && start[1] === c && "bg-lavender text-white",
                  !foundCells.has(`${r}-${c}`) && "hover:bg-muted",
                )}
              >
                {letter}
              </button>
            )),
          )}
        </div>
        <ul className="flex flex-wrap content-start gap-2">
          {placed.map((p) => (
            <li
              key={p.word}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-semibold",
                found.includes(p.word) ? "bg-cyan/30 line-through" : "bg-card",
              )}
            >
              {p.word}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
