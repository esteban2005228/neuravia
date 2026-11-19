"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shuffle, Stat, Won } from "./shared";

const SYMBOLS = ["◆", "◇", "▲", "△", "●", "○", "■", "□", "★", "☆", "▼", "▽"];
const ROUND_SECONDS = 60;
const GRID = 36;

function board() {
  const target = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const targets = 4 + Math.floor(Math.random() * 3);
  const others = SYMBOLS.filter((s) => s !== target);
  const cells = shuffle([
    ...Array(targets).fill(target),
    ...Array.from({ length: GRID - targets }, () => others[Math.floor(Math.random() * others.length)]),
  ]).map((s, id) => ({ id, s }));
  return { target, targets, cells };
}

/** Attention game: find every copy of the target symbol among similar ones before time runs out. */
export function SymbolHunt() {
  const [started, setStarted] = useState(false);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [state, setState] = useState(board);
  const [hits, setHits] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);

  const running = started && left > 0;

  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [running, left]);

  function start() {
    setState(board());
    setHits(new Set());
    setScore(0);
    setErrors(0);
    setLeft(ROUND_SECONDS);
    setStarted(true);
  }

  function pick(id: number, s: string) {
    if (!running || hits.has(id)) return;
    if (s !== state.target) {
      setErrors((e) => e + 1);
      setWrong(id);
      setTimeout(() => setWrong(null), 300);
      return;
    }
    const next = new Set(hits).add(id);
    setScore((x) => x + 1);
    if (next.size === state.targets) {
      setState(board());
      setHits(new Set());
    } else setHits(next);
  }

  const finished = started && left === 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Toca todas las figuras iguales al objetivo. Cuando las encuentres todas aparece un tablero nuevo. Tienes{" "}
        {ROUND_SECONDS} segundos.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Stat label="Objetivo" value={<span className="text-2xl">{state.target}</span>} />
        <Stat label="Tiempo" value={left} />
        <Stat label="Aciertos" value={score} />
        <Stat label="Errores" value={errors} />
      </div>
      {finished && <Won>Encontraste {score} figuras con {errors} errores.</Won>}
      <div className="grid w-fit grid-cols-6 gap-1.5 rounded-xl border bg-card p-2">
        {state.cells.map((cell) => (
          <button
            key={`${state.target}-${cell.id}`}
            type="button"
            onClick={() => pick(cell.id, cell.s)}
            disabled={!running}
            className={cn(
              "flex size-11 items-center justify-center rounded-lg text-2xl sm:size-14 sm:text-3xl",
              hits.has(cell.id) ? "bg-cyan/50" : "hover:bg-muted",
              wrong === cell.id && "bg-amber/50",
              !running && "opacity-40",
            )}
          >
            {cell.s}
          </button>
        ))}
      </div>
      {!running && <Button onClick={start}>{finished ? "Jugar de nuevo" : "Empezar"}</Button>}
    </div>
  );
}
