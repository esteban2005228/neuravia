"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTime, shuffle, Stat, useTimer, Won } from "./shared";

const SYMBOLS = ["🌙", "⭐", "🌿", "🐚", "🍋", "🎈", "🦋", "🌊", "🍇", "🔔"];
const LEVELS = { facil: 6, medio: 8, dificil: 10 } as const;
type Level = keyof typeof LEVELS;

function deal(pairs: number) {
  return shuffle(shuffle(SYMBOLS).slice(0, pairs).flatMap((s, i) => [{ id: i * 2, s }, { id: i * 2 + 1, s }]));
}

export function MemoryMatch() {
  const [level, setLevel] = useState<Level>("facil");
  const [cards, setCards] = useState(() => deal(LEVELS.facil));
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [round, setRound] = useState(0);

  const done = matched.size === LEVELS[level];
  const seconds = useTimer(moves > 0 && !done, round);

  function restart(next: Level = level) {
    setLevel(next);
    setCards(deal(LEVELS[next]));
    setOpen([]);
    setMatched(new Set());
    setMoves(0);
    setRound((r) => r + 1);
  }

  function flip(index: number) {
    if (open.length === 2 || open.includes(index) || matched.has(cards[index].s)) return;
    const next = [...open, index];
    setOpen(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next;
      if (cards[a].s === cards[b].s) {
        setMatched((m) => new Set(m).add(cards[a].s));
        setOpen([]);
      } else {
        setTimeout(() => setOpen([]), 800);
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(LEVELS) as Level[]).map((l) => (
          <Button key={l} size="sm" variant={l === level ? "default" : "outline"} onClick={() => restart(l)}>
            {l === "facil" ? "Fácil" : l === "medio" ? "Medio" : "Difícil"}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => restart()}>
          Reiniciar
        </Button>
      </div>
      <div className="flex gap-3">
        <Stat label="Movimientos" value={moves} />
        <Stat label="Tiempo" value={formatTime(seconds)} />
        <Stat label="Parejas" value={`${matched.size}/${LEVELS[level]}`} />
      </div>
      {done && <Won>¡Encontraste todas las parejas en {moves} movimientos!</Won>}
      <div className={cn("grid gap-2 sm:gap-3", LEVELS[level] > 6 ? "grid-cols-4 sm:grid-cols-5" : "grid-cols-3 sm:grid-cols-4")}>
        {cards.map((card, i) => {
          const visible = open.includes(i) || matched.has(card.s);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => flip(i)}
              aria-label={visible ? card.s : "Carta boca abajo"}
              className={cn(
                "flex aspect-square items-center justify-center rounded-xl border text-3xl transition-colors sm:text-4xl",
                visible ? "bg-card" : "bg-gradient-to-br from-cyan/70 via-blue/60 to-lavender/70 hover:opacity-90",
                matched.has(card.s) && "border-cyan bg-cyan/20",
              )}
            >
              {visible ? card.s : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
