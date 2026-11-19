"use client";

import dynamic from "next/dynamic";

// Stimuli are randomized and use browser audio, so the runner renders only in the browser.
export const InstrumentView = dynamic(() => import("./instrument-runner").then((m) => m.InstrumentRunner), {
  ssr: false,
  loading: () => <p className="text-center text-muted-foreground">Cargando…</p>,
});
