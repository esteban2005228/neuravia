import type { Enums } from "@/lib/supabase/database.types";

export type ResultLevel = Enums<"result_level">;

/**
 * Provisional criterion cut-offs (phase 1, no norms yet):
 * >= 90 strength, 70-89 expected, 50-69 watch, < 50 refer.
 * Phase 2 replaces these with z-scores normed by age and education.
 */
export function levelFor(index: number): ResultLevel {
  if (index >= 90) return "strength";
  if (index >= 70) return "expected";
  if (index >= 50) return "watch";
  return "refer";
}

export const LEVEL_LABELS: Record<ResultLevel, { label: string; description: string; tone: "cyan" | "lavender" | "amber" | "coral" }> = {
  strength: {
    label: "Desempeño alto",
    description: "Tu desempeño en esta prueba fue alto.",
    tone: "cyan",
  },
  expected: {
    label: "Desempeño adecuado",
    description: "Tu desempeño está dentro de lo esperado.",
    tone: "lavender",
  },
  watch: {
    label: "Conviene practicar",
    description: "Conviene practicar y repetir la prueba más adelante.",
    tone: "amber",
  },
  refer: {
    label: "Sugerimos una valoración",
    description: "Te sugerimos comentar este resultado con un profesional de la salud.",
    tone: "coral",
  },
};

export function clampIndex(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
