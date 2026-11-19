"use client";

import { useEffect, useState } from "react";

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Seconds counted while `running`; starts again from 0 whenever `resetKey` changes. */
export function useTimer(running: boolean, resetKey: unknown) {
  const [tick, setTick] = useState({ key: resetKey, seconds: 0 });
  useEffect(() => {
    if (!running) return;
    const id = setInterval(
      () => setTick((t) => ({ key: resetKey, seconds: t.key === resetKey ? t.seconds + 1 : 1 })),
      1000,
    );
    return () => clearInterval(id);
  }, [running, resetKey]);
  return tick.key === resetKey ? tick.seconds : 0;
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-2 text-center">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

export function Won({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="rounded-xl border border-cyan bg-cyan/20 p-4 text-center font-semibold">
      {children}
    </div>
  );
}
