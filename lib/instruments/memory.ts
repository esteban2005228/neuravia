import { z } from "zod";

import { clampIndex, levelFor } from "@/lib/scoring/levels";
import type { Subscale } from "./types";

/**
 * Digital adaptation of "Evaluación de Memoria" (Rehabilitación Neuropsicológica).
 * Shared by the client (presentation) and the server (scoring from raw responses).
 */
export const MEMORY_CODE = "MEM_instrument" as const;
export const MEMORY_VERSION = "1.0";

// 7. Long-term: shown at the very start, asked at the very end.
export const LONG_TERM_TEXT = "Laura tiene 32 años, vive en Puebla y tiene un perro llamado Max.";
export const LONG_TERM_QUESTIONS = [
  { question: "¿Cómo se llama la mujer?", options: ["Lucía", "Laura", "Sofía", "Ana"], answer: 1 },
  { question: "¿Cuántas mascotas tiene?", options: ["Ninguna", "Una", "Dos", "Tres"], answer: 1 },
  { question: "¿En dónde vive?", options: ["Oaxaca", "Toluca", "Puebla", "Querétaro"], answer: 2 },
  { question: "¿Cómo se llama su mascota?", options: ["Rocky", "Toby", "Luna", "Max"], answer: 3 },
];

// 1. Short-term: reproduce the order of 4 objects. Second trial only if the first is not perfect.
export const OBJECTS = {
  lapiz: { label: "Lápiz", icon: "✏️" },
  reloj: { label: "Reloj", icon: "⌚" },
  cuchara: { label: "Cuchara", icon: "🥄" },
  llave: { label: "Llave", icon: "🔑" },
} as const;
export type ObjectKey = keyof typeof OBJECTS;
export const SHORT_TERM_TRIALS: ObjectKey[][] = [
  ["lapiz", "reloj", "cuchara", "llave"],
  ["cuchara", "lapiz", "llave", "reloj"],
];
export const SHORT_TERM_ITEM_MS = 1500;

// 2. Working memory: numbers ascending, then letters alphabetically.
export const WORKING_TRIALS = [
  { sequence: ["B", "3", "A", "1"], expected: ["1", "3", "A", "B"] },
  { sequence: ["C", "2", "A", "4"], expected: ["2", "4", "A", "C"] },
  { sequence: ["B", "3", "A", "1", "C"], expected: ["1", "3", "A", "B", "C"] },
];
export const WORKING_ITEM_MS = 1200;

// 3. Sensory: claps that are soft or loud; report the order.
export type Intensity = "soft" | "loud";
export const SENSORY_TRIALS: Intensity[][] = [
  ["soft", "loud", "soft"],
  ["loud", "soft", "loud"],
  ["loud", "loud", "loud"],
];

// 4. Semantic: true/false statements.
export const SEMANTIC_ITEMS = [
  { text: "El perro es un animal", answer: true },
  { text: "El fuego quema", answer: true },
  { text: "La manzana es una fruta", answer: true },
  { text: "El círculo es redondo", answer: true },
];

// 5. Episodic: watch three actions, then put them in order.
export const EPISODIC_ACTIONS = [
  { key: "take", text: "Tomar el objeto con ambas manos", icon: "🙌" },
  { key: "move", text: "Elevarlo y colocarlo al otro extremo de la mesa", icon: "📦" },
  { key: "palms", text: "Colocar las palmas de las manos sobre la mesa", icon: "🖐️" },
] as const;
export const EPISODIC_ITEM_MS = 2500;

// 6. Procedural: 1 knock = touch the table, 2 knocks = raise the hand. Faster each trial.
export type ProceduralResponse = "table" | "hand";
export const PROCEDURAL_TRIALS: (1 | 2)[][] = [
  [1, 2, 1],
  [2, 2, 1],
  [1, 1, 2],
];
export const PROCEDURAL_WINDOW_MS = [3000, 2200, 1600];
export const expectedProcedural = (knocks: 1 | 2): ProceduralResponse => (knocks === 1 ? "table" : "hand");

const orderList = <T extends z.ZodTypeAny>(item: T, max: number) => z.array(item.nullable()).max(max);

export const memoryResponsesSchema = z.object({
  shortTerm: z.array(orderList(z.enum(["lapiz", "reloj", "cuchara", "llave"]), 4)).min(1).max(2),
  working: z.array(z.string().max(20)).length(WORKING_TRIALS.length),
  sensory: z.array(orderList(z.enum(["soft", "loud"]), 3)).length(SENSORY_TRIALS.length),
  semantic: z.array(z.boolean().nullable()).length(SEMANTIC_ITEMS.length),
  episodic: orderList(z.enum(["take", "move", "palms"]), 3),
  procedural: z
    .array(z.array(z.object({ response: z.enum(["table", "hand"]).nullable(), rt: z.number().nonnegative().nullable() })).length(3))
    .length(PROCEDURAL_TRIALS.length),
  longTerm: z.array(z.number().int().min(0).max(3).nullable()).length(LONG_TERM_QUESTIONS.length),
});
export type MemoryResponses = z.infer<typeof memoryResponsesSchema>;

function positionsCorrect<T>(given: (T | null)[], expected: readonly T[]) {
  return expected.reduce((n, item, i) => n + (given[i] === item ? 1 : 0), 0);
}

/** "1-3-a-b", "13AB" and "1 3 A B" all read as ["1","3","A","B"]. */
export function parseWorkingAnswer(text: string) {
  return text.toUpperCase().replace(/[^0-9A-Z]/g, "").split("");
}

export function scoreMemory(raw: unknown) {
  const r = memoryResponsesSchema.parse(raw);

  const shortTerm = Math.max(...r.shortTerm.map((given, i) => positionsCorrect(given, SHORT_TERM_TRIALS[i])));
  const working = r.working.reduce(
    (n, answer, i) => n + positionsCorrect(parseWorkingAnswer(answer), WORKING_TRIALS[i].expected),
    0,
  );
  const sensory = r.sensory.reduce((n, given, i) => n + positionsCorrect(given, SENSORY_TRIALS[i]), 0);
  const semantic = r.semantic.filter((a, i) => a === SEMANTIC_ITEMS[i].answer).length;
  const episodic = positionsCorrect(r.episodic, EPISODIC_ACTIONS.map((a) => a.key));
  const procedural = r.procedural.reduce(
    (n, trial, t) =>
      n +
      trial.filter(
        (resp, i) =>
          resp.response === expectedProcedural(PROCEDURAL_TRIALS[t][i]) &&
          resp.rt !== null &&
          resp.rt <= PROCEDURAL_WINDOW_MS[t],
      ).length,
    0,
  );
  const longTerm = r.longTerm.filter((a, i) => a === LONG_TERM_QUESTIONS[i].answer).length;

  const subscales: Subscale[] = [
    { key: "short_term", label: "Memoria a corto plazo", score: shortTerm, max: 4 },
    { key: "working", label: "Memoria de trabajo", score: working, max: WORKING_TRIALS.reduce((n, t) => n + t.expected.length, 0) },
    { key: "sensory", label: "Memoria sensorial", score: sensory, max: SENSORY_TRIALS.length * 3 },
    { key: "semantic", label: "Memoria semántica", score: semantic, max: SEMANTIC_ITEMS.length },
    { key: "episodic", label: "Memoria episódica", score: episodic, max: EPISODIC_ACTIONS.length },
    { key: "procedural", label: "Memoria procedimental", score: procedural, max: PROCEDURAL_TRIALS.length * 3 },
    { key: "long_term", label: "Memoria a largo plazo", score: longTerm, max: LONG_TERM_QUESTIONS.length },
  ];
  const rawScore = subscales.reduce((s, x) => s + x.score, 0);
  const max = subscales.reduce((s, x) => s + x.max, 0);
  const indexScore = clampIndex((rawScore / max) * 100);

  return {
    trials: r,
    metrics: { subscales, max_score: max, short_term_trials: r.shortTerm.length },
    rawScore,
    indexScore,
    level: levelFor(indexScore),
  };
}
