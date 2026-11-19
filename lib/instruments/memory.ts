import { z } from "zod";

import { clampIndex, levelFor } from "@/lib/scoring/levels";
import type { Subscale } from "./types";

/**
 * Digital adaptation of "Evaluación de Memoria" (Rehabilitación Neuropsicológica).
 * Shared by the client (presentation) and the server (scoring from raw responses).
 */
export const MEMORY_CODE = "MEM_instrument" as const;
export const MEMORY_VERSION = "1.2";

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

// 6. Procedural: serial reaction time task. Numbers 1–5 flash on a 3x3 grid in random cells, then hide;
// the person taps the cells in order. Each of the 3 rounds shows the numbers for less time and allows less
// time to answer. A correct, in-time answer moves on to the next round; a miss is retried with a new
// arrangement, up to 3 attempts per round. Learning the procedure shows as faster, first-try answers.
export const PROCEDURAL_GRID = 9;
export const PROCEDURAL_LENGTH = 5;
export const PROCEDURAL_ROUNDS = 3;
export const PROCEDURAL_ATTEMPTS = 3;
export const PROCEDURAL_SHOW_MS = [3000, 2000, 1500];
export const PROCEDURAL_LIMIT_MS = [7000, 5500, 4500];
export const PROCEDURAL_MAX_MS = 15_000;

const cell = z.number().int().min(0).max(PROCEDURAL_GRID - 1);
const proceduralTrial = z.object({
  round: z.number().int().min(0).max(PROCEDURAL_ROUNDS - 1),
  positions: z
    .array(cell)
    .length(PROCEDURAL_LENGTH)
    .refine((p) => new Set(p).size === PROCEDURAL_LENGTH, "Cells must be distinct"),
  taps: z.array(cell).max(PROCEDURAL_LENGTH),
  rt: z.number().nonnegative().max(PROCEDURAL_MAX_MS).nullable(),
});
export type ProceduralTrial = z.infer<typeof proceduralTrial>;

/** Right cells, right order, within the round's time limit. Used by the client to decide a retry. */
export const proceduralTrialOk = (t: ProceduralTrial) =>
  t.taps.length === PROCEDURAL_LENGTH &&
  t.taps.every((c, i) => c === t.positions[i]) &&
  t.rt !== null &&
  t.rt <= PROCEDURAL_LIMIT_MS[t.round];

/** Checks the trials follow the flow: next round after a hit or after the last attempt, never otherwise. */
function proceduralFlowValid(trials: ProceduralTrial[]) {
  let round = 0;
  let attempt = 0;
  for (const t of trials) {
    if (round >= PROCEDURAL_ROUNDS || t.round !== round) return false;
    attempt++;
    if (proceduralTrialOk(t) || attempt === PROCEDURAL_ATTEMPTS) {
      round++;
      attempt = 0;
    }
  }
  return round === PROCEDURAL_ROUNDS;
}

const orderList = <T extends z.ZodTypeAny>(item: T, max: number) => z.array(item.nullable()).max(max);

export const memoryResponsesSchema = z.object({
  shortTerm: z.array(orderList(z.enum(["lapiz", "reloj", "cuchara", "llave"]), 4)).min(1).max(2),
  working: z.array(z.string().max(20)).length(WORKING_TRIALS.length),
  sensory: z.array(orderList(z.enum(["soft", "loud"]), 3)).length(SENSORY_TRIALS.length),
  semantic: z.array(z.boolean().nullable()).length(SEMANTIC_ITEMS.length),
  episodic: orderList(z.enum(["take", "move", "palms"]), 3),
  procedural: z
    .array(proceduralTrial)
    .min(PROCEDURAL_ROUNDS)
    .max(PROCEDURAL_ROUNDS * PROCEDURAL_ATTEMPTS)
    .refine(proceduralFlowValid, "Procedural trials do not follow the round/attempt flow"),
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
  // Per round: 3 points on the first attempt, 2 on the second, 1 on the third, 0 if never solved.
  const proceduralRounds = Array.from({ length: PROCEDURAL_ROUNDS }, (_, round) => {
    const attempts = r.procedural.filter((t) => t.round === round);
    const hit = attempts.findIndex(proceduralTrialOk);
    return {
      points: hit < 0 ? 0 : PROCEDURAL_ATTEMPTS - hit,
      attempts: attempts.length,
      ms: hit < 0 ? null : Math.round(attempts[hit].rt!),
    };
  });
  const procedural = proceduralRounds.reduce((n, x) => n + x.points, 0);
  // Time of the solved attempt in each round; a drop from round 1 to 3 shows learning.
  const proceduralRoundMs = proceduralRounds.map((x) => x.ms);
  const [firstMs, , lastMs] = proceduralRoundMs;
  const proceduralGainPct =
    firstMs && lastMs !== null ? Math.round(((firstMs - lastMs) / firstMs) * 100) : null;
  const longTerm = r.longTerm.filter((a, i) => a === LONG_TERM_QUESTIONS[i].answer).length;

  const subscales: Subscale[] = [
    { key: "short_term", label: "Memoria a corto plazo", score: shortTerm, max: 4 },
    { key: "working", label: "Memoria de trabajo", score: working, max: WORKING_TRIALS.reduce((n, t) => n + t.expected.length, 0) },
    { key: "sensory", label: "Memoria sensorial", score: sensory, max: SENSORY_TRIALS.length * 3 },
    { key: "semantic", label: "Memoria semántica", score: semantic, max: SEMANTIC_ITEMS.length },
    { key: "episodic", label: "Memoria episódica", score: episodic, max: EPISODIC_ACTIONS.length },
    { key: "procedural", label: "Memoria procedimental", score: procedural, max: PROCEDURAL_ROUNDS * PROCEDURAL_ATTEMPTS },
    { key: "long_term", label: "Memoria a largo plazo", score: longTerm, max: LONG_TERM_QUESTIONS.length },
  ];
  const rawScore = subscales.reduce((s, x) => s + x.score, 0);
  const max = subscales.reduce((s, x) => s + x.max, 0);
  const indexScore = clampIndex((rawScore / max) * 100);

  return {
    trials: r,
    metrics: {
      subscales,
      max_score: max,
      short_term_trials: r.shortTerm.length,
      procedural_round_ms: proceduralRoundMs,
      procedural_attempts: proceduralRounds.map((x) => x.attempts),
      procedural_gain_pct: proceduralGainPct,
    },
    rawScore,
    indexScore,
    level: levelFor(indexScore),
  };
}
