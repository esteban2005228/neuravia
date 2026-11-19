"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function shuffled<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const randomInt = (max: number) => Math.floor(Math.random() * max);
export const now = () => performance.now();

/** Wait helper that is cancelled when the component unmounts. */
export function useSleep() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return (ms: number) =>
    new Promise<void>((resolve) => {
      timers.current.push(setTimeout(resolve, ms));
    });
}

// ---------------------------------------------------------------------------
// Audio: speech for spoken instructions, short synthesized sounds for stimuli.
// ---------------------------------------------------------------------------

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-MX";
  u.rate = 0.95;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("es"));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

let ctx: AudioContext | null = null;
function audio() {
  if (typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** A clap: a short burst of filtered noise. */
export function playClap(intensity: "soft" | "loud") {
  const ac = audio();
  if (!ac) return;
  const length = Math.floor(ac.sampleRate * 0.12);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1500;
  const gain = ac.createGain();
  gain.gain.value = intensity === "loud" ? 1 : 0.12;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}

/** A knock on a table: a low, short thump. */
export function playKnock() {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.frequency.setValueAtTime(180, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.12);
  gain.gain.setValueAtTime(0.9, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.16);
}

/** Unlocks audio on iOS/Safari; call from a click. */
export function primeAudio() {
  audio();
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.getVoices();
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function SectionIntro({
  number,
  total,
  title,
  children,
  onStart,
  startLabel = "Empezar",
}: {
  number: number;
  total: number;
  title: string;
  children: React.ReactNode;
  onStart: () => void;
  startLabel?: string;
}) {
  return (
    <div className="space-y-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Ejercicio {number} de {total}
      </p>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="space-y-3 text-lg leading-relaxed">{children}</div>
      <Button
        size="lg"
        onClick={() => {
          primeAudio();
          onStart();
        }}
      >
        {startLabel}
      </Button>
    </div>
  );
}

export function Stage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center", className)}>
      {children}
    </div>
  );
}

export function Progress({ value, total, label }: { value: number; total: number; label?: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      {label ?? "Reactivo"} {Math.min(value + 1, total)} de {total}
    </p>
  );
}

export function Choice({
  options,
  onPick,
  columns = 2,
}: {
  options: readonly string[];
  onPick: (index: number) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className={cn("grid w-full max-w-xl gap-3", columns === 2 && "sm:grid-cols-2")}>
      {options.map((o, i) => (
        <Button key={o} variant="outline" size="lg" className="h-auto min-h-14 whitespace-normal py-3 text-lg" onClick={() => onPick(i)}>
          {o}
        </Button>
      ))}
    </div>
  );
}

/** Puts items in order by tapping them; tapping a placed item removes it. */
export function OrderPicker<K extends string>({
  options,
  slots,
  render,
  onDone,
  doneLabel = "Listo",
}: {
  options: readonly K[];
  slots: number;
  render: (key: K) => React.ReactNode;
  onDone: (order: (K | null)[]) => void;
  doneLabel?: string;
}) {
  const [order, setOrder] = useState<K[]>([]);
  return (
    <div className="w-full max-w-2xl space-y-6">
      <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))` }}>
        {Array.from({ length: slots }, (_, i) => (
          <li key={i}>
            <button
              type="button"
              disabled={!order[i]}
              onClick={() => setOrder((o) => o.filter((_, j) => j !== i))}
              className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed bg-card p-2 text-sm"
            >
              <span className="text-xs text-muted-foreground">{i + 1}</span>
              {order[i] ? render(order[i]) : null}
            </button>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap justify-center gap-3">
        {options.map((key) => (
          <Button
            key={key}
            variant="outline"
            className="h-auto min-h-16 flex-col gap-1 px-4 py-2 whitespace-normal"
            disabled={order.includes(key) || order.length >= slots}
            onClick={() => setOrder((o) => [...o, key])}
          >
            {render(key)}
          </Button>
        ))}
      </div>
      <div className="flex justify-center gap-3">
        <Button variant="ghost" onClick={() => setOrder([])} disabled={!order.length}>
          Borrar
        </Button>
        <Button
          size="lg"
          onClick={() => onDone(Array.from({ length: slots }, (_, i) => order[i] ?? null))}
          disabled={!order.length}
        >
          {doneLabel}
        </Button>
      </div>
    </div>
  );
}
