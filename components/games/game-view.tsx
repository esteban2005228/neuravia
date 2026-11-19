"use client";

import dynamic from "next/dynamic";

import type { GameSlug } from "./catalog";

// Boards are random, so they render only in the browser (no hydration mismatch).
const loading = () => <p className="text-muted-foreground">Cargando…</p>;
const VIEWS: Record<GameSlug, React.ComponentType> = {
  memorama: dynamic(() => import("./memory-match").then((m) => m.MemoryMatch), { ssr: false, loading }),
  secuencia: dynamic(() => import("./sequence").then((m) => m.Sequence), { ssr: false, loading }),
  "sopa-de-letras": dynamic(() => import("./word-search").then((m) => m.WordSearch), { ssr: false, loading }),
  "busca-el-simbolo": dynamic(() => import("./symbol-hunt").then((m) => m.SymbolHunt), { ssr: false, loading }),
  sudoku: dynamic(() => import("./sudoku").then((m) => m.Sudoku), { ssr: false, loading }),
};

export function GameView({ slug }: { slug: GameSlug }) {
  const View = VIEWS[slug];
  return <View />;
}
