import { z } from "zod";

import { clampIndex, levelFor } from "@/lib/scoring/levels";
import { pick } from "./random";
import type { Subscale } from "./types";

/**
 * Digital adaptation of "Evaluación de Atención" (Rehabilitación Neuropsicológica).
 * Item content comes from the instrument; this file is shared by the client
 * (to present items) and the server (to score them from raw responses).
 */
export const ATTENTION_CODE = "ATT_instrument" as const;
export const ATTENTION_VERSION = "1.1";

// 1. Selective: count how many times the target appears. 5 series with a different random count each,
// within the instrument's range (2 to 12).
export const SELECTIVE_TARGET = "★";
export const SELECTIVE_DISTRACTORS = ["☆", "✦", "◆", "●"];
export const SELECTIVE_SERIES = 5;
export const SELECTIVE_MIN = 2;
export const SELECTIVE_MAX = 12;
export const SELECTIVE_STIMULUS_MS = 550;
export const SELECTIVE_GAP_MS = 250;

// 2. Focalized: find the 3 hidden stars. 2 = under 30 s, 1 = 30-60 s, 0 = longer or not found.
export const FOCALIZED_STARS = 3;
export const FOCALIZED_LIMIT_MS = 90_000;

// 3. Sustained: listen/read once, then answer.
export const SUSTAINED_TEXT =
  "Esta mañana fui a una tienda pequeña donde compré pan y leche. Mientras pagaba, sonó el teléfono del cajero dos veces y una persona entró rápidamente al lugar. Después de recibir mi cambio, salí y noté que el cielo estaba nublado.";
export const SUSTAINED_QUESTIONS = [
  {
    question: "¿Qué notó al salir de la tienda?",
    options: ["Que el cielo estaba nublado", "Que estaba lloviendo", "Un perro en la puerta", "Que la calle estaba vacía"],
    answer: 0,
  },
  {
    question: "¿Qué fue a comprar a la tienda?",
    options: ["Pan y huevos", "Pan y leche", "Leche y café", "Tortillas"],
    answer: 1,
  },
  {
    question: "¿Cuántas veces sonó el teléfono del cajero?",
    options: ["Una", "Dos", "Tres", "Ninguna"],
    answer: 1,
  },
];

// 4. Divided: words appear one by one; press the button on every color word (7 targets).
export const DIVIDED_TEXT =
  "Ayer vi un pájaro azul en el jardín y después pasó un coche rojo muy rápido frente a la casa. Más tarde encontré una flor amarilla cerca de la ventana, mientras un perro negro cruzaba la calle. Luego apareció una pelota verde rodando por la banqueta y un globo rojo se elevó en el cielo. Finalmente, vi una mochila blanca junto a una bicicleta.";
export const DIVIDED_WORDS = DIVIDED_TEXT.split(/\s+/);
const COLOR_WORDS = new Set(["azul", "rojo", "amarilla", "negro", "verde", "blanca"]);
export const DIVIDED_TARGETS = DIVIDED_WORDS.map((w, i) => [w, i] as const)
  .filter(([w]) => COLOR_WORDS.has(w.toLowerCase().replace(/[.,]/g, "")))
  .map(([, i]) => i);
export const DIVIDED_WORD_MS = 650;
export const DIVIDED_GRACE_MS = 650;

// 5. Alternating: follow three instructions, each changing color and shape.
export const ALTERNATING_COLORS = [
  { key: "blue", label: "Azul", hex: "#3f86b5" },
  { key: "red", label: "Rojo", hex: "#d9534f" },
  { key: "yellow", label: "Amarillo", hex: "#e6c227" },
  { key: "green", label: "Verde", hex: "#4caf7a" },
] as const;
export const ALTERNATING_SHAPES = [
  { key: "circle", label: "Círculo" },
  { key: "triangle", label: "Triángulo" },
  { key: "square", label: "Cuadrado" },
  { key: "star", label: "Estrella" },
] as const;
export type AlternatingColor = (typeof ALTERNATING_COLORS)[number]["key"];
export type AlternatingShape = (typeof ALTERNATING_SHAPES)[number]["key"];
export const ALTERNATING_STEPS = 3;
const SHAPE_NOUN: Record<AlternatingShape, string> = {
  circle: "un círculo",
  triangle: "un triángulo",
  square: "un cuadrado",
  star: "una estrella",
};
const STEP_LEAD = ["Toma", "Ahora toma", "Finalmente toma"];
/** Instruction text for a step, e.g. "Ahora toma el color verde y dibuja una estrella." */
export function alternatingText(step: number, color: AlternatingColor, shape: AlternatingShape) {
  const label = ALTERNATING_COLORS.find((c) => c.key === color)!.label.toLowerCase();
  return `${STEP_LEAD[step] ?? "Toma"} el color ${label} y dibuja ${SHAPE_NOUN[shape]}.`;
}

const colorKeys = ALTERNATING_COLORS.map((c) => c.key) as [AlternatingColor, ...AlternatingColor[]];
const shapeKeys = ALTERNATING_SHAPES.map((c) => c.key) as [AlternatingShape, ...AlternatingShape[]];

export const attentionResponsesSchema = z.object({
  selective: z
    .array(
      z.object({
        count: z.number().int().min(SELECTIVE_MIN).max(SELECTIVE_MAX),
        answer: z.number().int().min(0).max(99).nullable(),
      }),
    )
    .length(SELECTIVE_SERIES),
  focalized: z.object({ found: z.number().int().min(0).max(FOCALIZED_STARS), ms: z.number().nonnegative().max(600_000) }),
  sustained: z.array(z.number().int().min(0).max(3).nullable()).length(SUSTAINED_QUESTIONS.length),
  divided: z.object({ presses: z.array(z.number().nonnegative().max(600_000)).max(200) }),
  alternating: z
    .array(
      z.object({
        expected: z.object({ color: z.enum(colorKeys), shape: z.enum(shapeKeys) }),
        color: z.string().max(10).nullable(),
        shape: z.string().max(10).nullable(),
      }),
    )
    .length(ALTERNATING_STEPS),
});
export type AttentionResponses = z.infer<typeof attentionResponsesSchema>;

export function scoreAttention(raw: unknown) {
  const r = attentionResponsesSchema.parse(raw);

  const selective = r.selective.filter((s) => s.answer === s.count).length;

  const focalized =
    r.focalized.found < FOCALIZED_STARS ? 0 : r.focalized.ms < 30_000 ? 2 : r.focalized.ms <= 60_000 ? 1 : 0;

  const sustained = r.sustained.reduce<number>((sum, a, i) => sum + (a === SUSTAINED_QUESTIONS[i].answer ? 2 : 0), 0);

  // A press counts for the first target whose window contains it; other presses are false alarms.
  const hitTargets = new Set<number>();
  let falseAlarms = 0;
  for (const t of [...r.divided.presses].sort((a, b) => a - b)) {
    const target = DIVIDED_TARGETS.find((i) => {
      const start = i * DIVIDED_WORD_MS;
      return !hitTargets.has(i) && t >= start && t <= start + DIVIDED_WORD_MS + DIVIDED_GRACE_MS;
    });
    if (target === undefined) falseAlarms++;
    else hitTargets.add(target);
  }
  const divided = Math.max(0, hitTargets.size * 2 - falseAlarms);

  const alternating = r.alternating.reduce<number>(
    (sum, a) => sum + (a.color === a.expected.color ? 1 : 0) + (a.shape === a.expected.shape ? 1 : 0),
    0,
  );

  const subscales: Subscale[] = [
    { key: "selective", label: "Atención selectiva", score: selective, max: SELECTIVE_SERIES },
    { key: "focalized", label: "Atención focalizada", score: focalized, max: 2 },
    { key: "sustained", label: "Atención sostenida", score: sustained, max: SUSTAINED_QUESTIONS.length * 2 },
    { key: "divided", label: "Atención dividida", score: divided, max: DIVIDED_TARGETS.length * 2 },
    { key: "alternating", label: "Atención alternante", score: alternating, max: ALTERNATING_STEPS * 2 },
  ];
  const rawScore = subscales.reduce((s, x) => s + x.score, 0);
  const max = subscales.reduce((s, x) => s + x.max, 0);
  const indexScore = clampIndex((rawScore / max) * 100);

  return {
    trials: r,
    metrics: {
      subscales,
      max_score: max,
      divided_hits: hitTargets.size,
      divided_false_alarms: falseAlarms,
      focalized_seconds: Math.round(r.focalized.ms / 1000),
    },
    rawScore,
    indexScore,
    level: levelFor(indexScore),
  };
}

// ---------------------------------------------------------------------------
// Random content for each run (client side). The server scores what was shown.
// ---------------------------------------------------------------------------

/** Distinct target counts for the selective series. */
export function randomSelectiveCounts() {
  const range = Array.from({ length: SELECTIVE_MAX - SELECTIVE_MIN + 1 }, (_, i) => SELECTIVE_MIN + i);
  return pick(range, SELECTIVE_SERIES);
}

/** Three steps, each with a different color and a different shape. */
export function randomAlternatingSteps() {
  const colors = pick(colorKeys, ALTERNATING_STEPS);
  const shapes = pick(shapeKeys, ALTERNATING_STEPS);
  return colors.map((color, i) => ({ color, shape: shapes[i], text: alternatingText(i, color, shapes[i]) }));
}
