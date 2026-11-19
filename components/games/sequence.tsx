"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Stat, Won } from "./shared";

const PADS = [
  { name: "Cian", className: "bg-cyan", lit: "bg-cyan brightness-110 ring-4 ring-cyan/60" },
  { name: "Azul", className: "bg-blue", lit: "bg-blue brightness-110 ring-4 ring-blue/60" },
  { name: "Lavanda", className: "bg-lavender", lit: "bg-lavender brightness-110 ring-4 ring-lavender/60" },
  { name: "Arena", className: "bg-sand", lit: "bg-sand brightness-110 ring-4 ring-sand/60" },
];

const randomPad = () => Math.floor(Math.random() * PADS.length);

type Phase = "idle" | "showing" | "input" | "over";

/** Memory game: watch a sequence of colors that grows by one each round, then repeat it. */
export function Sequence() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [lit, setLit] = useState<number | null>(null);
  const [pos, setPos] = useState(0);
  const [best, setBest] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function play(seq: number[]) {
    setPhase("showing");
    const step = Math.max(350, 750 - seq.length * 25);
    seq.forEach((pad, i) => {
      timers.current.push(setTimeout(() => setLit(pad), 600 + i * step));
      timers.current.push(setTimeout(() => setLit(null), 600 + i * step + step * 0.6));
    });
    timers.current.push(
      setTimeout(() => {
        setPos(0);
        setPhase("input");
      }, 600 + seq.length * step),
    );
  }

  function start() {
    const seq = [randomPad(), randomPad()];
    setSequence(seq);
    play(seq);
  }

  function press(pad: number) {
    if (phase !== "input") return;
    setLit(pad);
    timers.current.push(setTimeout(() => setLit(null), 200));
    if (sequence[pos] !== pad) {
      setBest((b) => Math.max(b, sequence.length - 1));
      setPhase("over");
      return;
    }
    if (pos + 1 === sequence.length) {
      const next = [...sequence, randomPad()];
      setBest((b) => Math.max(b, sequence.length));
      setSequence(next);
      play(next);
    } else setPos(pos + 1);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Observa el orden en que se iluminan los colores y repítelo. Cada ronda agrega un color más.
      </p>
      <div className="flex gap-3">
        <Stat label="Longitud" value={sequence.length} />
        <Stat label="Mejor" value={best} />
      </div>
      {phase === "over" && <Won>Recordaste una secuencia de {sequence.length - 1} colores. ¡Inténtalo otra vez!</Won>}
      <p className="text-sm font-semibold" aria-live="polite">
        {phase === "showing" ? "Observa…" : phase === "input" ? "Tu turno" : ""}
      </p>
      <div className="grid w-fit grid-cols-2 gap-3">
        {PADS.map((p, i) => (
          <button
            key={p.name}
            type="button"
            aria-label={p.name}
            onClick={() => press(i)}
            disabled={phase !== "input"}
            className={cn(
              "size-28 rounded-2xl transition-all sm:size-36",
              lit === i ? p.lit : cn(p.className, "opacity-45"),
              phase === "input" && "hover:opacity-70",
            )}
          />
        ))}
      </div>
      {(phase === "idle" || phase === "over") && <Button onClick={start}>{phase === "idle" ? "Empezar" : "Jugar de nuevo"}</Button>}
    </div>
  );
}
