import { z } from "zod";

import { clampIndex, levelFor } from "@/lib/scoring/levels";
import { pick, reorder, shuffle } from "./random";
import type { Subscale } from "./types";

/**
 * Digital adaptation of "Evaluación de Memoria" (Rehabilitación Neuropsicológica).
 * Shared by the client (presentation) and the server (scoring from raw responses).
 */
export const MEMORY_CODE = "MEM_instrument" as const;
export const MEMORY_VERSION = "1.3";

// 7. Long-term: a random fact shown at the very start and asked at the very end.
export const LONG_TERM_NAMES = ["Laura", "Lucía", "Sofía", "Ana", "Mariana", "Paola"] as const;
export const LONG_TERM_CITIES = ["Puebla", "Oaxaca", "Toluca", "Querétaro", "Morelia", "Mérida"] as const;
export const LONG_TERM_PETS = ["perro", "gato", "conejo", "perico"] as const;
export const LONG_TERM_PET_NAMES = ["Max", "Rocky", "Toby", "Bruno", "Coco", "Simón"] as const;
const longTermFact = z.object({
  name: z.enum(LONG_TERM_NAMES),
  age: z.number().int().min(18).max(60),
  city: z.enum(LONG_TERM_CITIES),
  pet: z.enum(LONG_TERM_PETS),
  petName: z.enum(LONG_TERM_PET_NAMES),
});
export type LongTermFact = z.infer<typeof longTermFact>;
export const longTermText = (f: LongTermFact) =>
  `${f.name} tiene ${f.age} años, vive en ${f.city} y tiene un ${f.pet} llamado ${f.petName}.`;
const capitalize = (w: string) => w[0].toUpperCase() + w.slice(1);
/** The 4 recall questions for a fact; `answer` is the correct option text. */
export const longTermQuestions = (f: LongTermFact) => [
  { question: "¿Cómo se llama la mujer?", answer: f.name, pool: LONG_TERM_NAMES as readonly string[] },
  { question: "¿Qué mascota tiene?", answer: capitalize(f.pet), pool: LONG_TERM_PETS.map(capitalize) },
  { question: "¿En dónde vive?", answer: f.city, pool: LONG_TERM_CITIES as readonly string[] },
  { question: "¿Cómo se llama su mascota?", answer: f.petName, pool: LONG_TERM_PET_NAMES as readonly string[] },
];
export const LONG_TERM_QUESTION_COUNT = 4;

// 1. Short-term: reproduce the order of 4 objects. Second trial (another order) only if the first is not perfect.
export const OBJECTS = {
  lapiz: { label: "Lápiz", icon: "✏️" },
  reloj: { label: "Reloj", icon: "⌚" },
  cuchara: { label: "Cuchara", icon: "🥄" },
  llave: { label: "Llave", icon: "🔑" },
} as const;
export type ObjectKey = keyof typeof OBJECTS;
const OBJECT_KEYS = Object.keys(OBJECTS) as [ObjectKey, ...ObjectKey[]];
export const SHORT_TERM_ITEM_MS = 1500;

// 2. Working memory: numbers ascending, then letters alphabetically. Random series of 4, 4 and 5 items.
export const WORKING_LENGTHS = [4, 4, 5];
export const WORKING_ITEM_MS = 1200;
const WORKING_DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const WORKING_LETTERS = ["A", "B", "C", "D", "E", "F"];
/** Expected answer: digits ascending, then letters alphabetically. */
export const workingExpected = (sequence: readonly string[]) => [
  ...sequence.filter((x) => /\d/.test(x)).sort(),
  ...sequence.filter((x) => /[A-Z]/.test(x)).sort(),
];

// 3. Sensory: 3 claps, each soft or loud at random; report the order.
export type Intensity = "soft" | "loud";
export const SENSORY_TRIALS = 3;
export const SENSORY_CLAPS = 3;

// 4. Semantic: true/false statements (presented in random order).
export const SEMANTIC_ITEMS = [
  { text: "El perro es un animal", answer: true },
  { text: "El fuego quema", answer: true },
  { text: "La manzana es una fruta", answer: true },
  { text: "El círculo es redondo", answer: true },
];

// 5. Episodic: watch three everyday actions, then put them in order. Picked at random from a pool.
export const EPISODIC_ACTIONS = [
  { key: "take", text: "Tomar el objeto con ambas manos", icon: "🙌" },
  { key: "palms", text: "Colocar las palmas de las manos sobre la mesa", icon: "🖐️" },
  { key: "clap", text: "Aplaudir dos veces", icon: "👏" },
  { key: "knock", text: "Tocar la puerta", icon: "🚪" },
  { key: "lamp", text: "Encender la lámpara", icon: "💡" },
  { key: "water", text: "Servir un vaso de agua", icon: "🥛" },
] as const;
export type ActionKey = (typeof EPISODIC_ACTIONS)[number]["key"];
const ACTION_KEYS = EPISODIC_ACTIONS.map((a) => a.key) as [ActionKey, ...ActionKey[]];
export const EPISODIC_COUNT = 3;
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

const distinct = <T>(items: T[]) => new Set(items).size === items.length;
const workingItem = z.string().regex(/^[1-9A-Z]$/);

export const memoryResponsesSchema = z.object({
  shortTerm: z
    .array(
      z.object({
        shown: z.array(z.enum(OBJECT_KEYS)).length(OBJECT_KEYS.length).refine(distinct),
        given: orderList(z.enum(OBJECT_KEYS), OBJECT_KEYS.length),
      }),
    )
    .min(1)
    .max(2),
  working: z
    .array(z.object({ sequence: z.array(workingItem).min(4).max(5).refine(distinct), answer: z.string().max(20) }))
    .length(WORKING_LENGTHS.length)
    .refine((ts) => ts.every((t, i) => t.sequence.length === WORKING_LENGTHS[i]), "Unexpected series length"),
  sensory: z
    .array(
      z.object({
        played: z.array(z.enum(["soft", "loud"])).length(SENSORY_CLAPS),
        given: orderList(z.enum(["soft", "loud"]), SENSORY_CLAPS),
      }),
    )
    .length(SENSORY_TRIALS),
  semantic: z.array(z.boolean().nullable()).length(SEMANTIC_ITEMS.length),
  episodic: z.object({
    shown: z.array(z.enum(ACTION_KEYS)).length(EPISODIC_COUNT).refine(distinct),
    given: orderList(z.enum(ACTION_KEYS), EPISODIC_COUNT),
  }),
  procedural: z
    .array(proceduralTrial)
    .min(PROCEDURAL_ROUNDS)
    .max(PROCEDURAL_ROUNDS * PROCEDURAL_ATTEMPTS)
    .refine(proceduralFlowValid, "Procedural trials do not follow the round/attempt flow"),
  longTerm: z.object({
    fact: longTermFact,
    answers: z.array(z.string().max(40).nullable()).length(LONG_TERM_QUESTION_COUNT),
  }),
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

  const shortTerm = Math.max(...r.shortTerm.map((t) => positionsCorrect(t.given, t.shown)));
  const working = r.working.reduce(
    (n, t) => n + positionsCorrect(parseWorkingAnswer(t.answer), workingExpected(t.sequence)),
    0,
  );
  const sensory = r.sensory.reduce((n, t) => n + positionsCorrect(t.given, t.played), 0);
  const semantic = r.semantic.filter((a, i) => a === SEMANTIC_ITEMS[i].answer).length;
  const episodic = positionsCorrect(r.episodic.given, r.episodic.shown);
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
  const longTerm = longTermQuestions(r.longTerm.fact).filter((q, i) => r.longTerm.answers[i] === q.answer).length;

  const subscales: Subscale[] = [
    { key: "short_term", label: "Memoria a corto plazo", score: shortTerm, max: OBJECT_KEYS.length },
    { key: "working", label: "Memoria de trabajo", score: working, max: WORKING_LENGTHS.reduce((n, l) => n + l, 0) },
    { key: "sensory", label: "Memoria sensorial", score: sensory, max: SENSORY_TRIALS * SENSORY_CLAPS },
    { key: "semantic", label: "Memoria semántica", score: semantic, max: SEMANTIC_ITEMS.length },
    { key: "episodic", label: "Memoria episódica", score: episodic, max: EPISODIC_COUNT },
    { key: "procedural", label: "Memoria procedimental", score: procedural, max: PROCEDURAL_ROUNDS * PROCEDURAL_ATTEMPTS },
    { key: "long_term", label: "Memoria a largo plazo", score: longTerm, max: LONG_TERM_QUESTION_COUNT },
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

// ---------------------------------------------------------------------------
// Random content for each run (client side). The server scores what was shown.
// ---------------------------------------------------------------------------

export function randomLongTermFact(): LongTermFact {
  return {
    name: pick(LONG_TERM_NAMES, 1)[0],
    age: 25 + Math.floor(Math.random() * 21),
    city: pick(LONG_TERM_CITIES, 1)[0],
    pet: pick(LONG_TERM_PETS, 1)[0],
    petName: pick(LONG_TERM_PET_NAMES, 1)[0],
  };
}

/** The correct option plus 3 others, shuffled. */
export const longTermOptions = (q: { answer: string; pool: readonly string[] }) =>
  shuffle([q.answer, ...pick(q.pool.filter((o) => o !== q.answer), 3)]);

export const randomObjectOrder = (avoid?: readonly ObjectKey[]) => reorder(OBJECT_KEYS, avoid ?? []);

/** Half digits, half letters (the extra item of a 5-series is a letter), never already in answer order. */
export function randomWorkingSequence(length: number) {
  const digits = pick(WORKING_DIGITS, Math.floor(length / 2));
  const letters = pick(WORKING_LETTERS, length - digits.length);
  const items = [...digits, ...letters];
  return reorder(items, workingExpected(items));
}

/** Three different soft/loud patterns. */
export function randomSensoryTrials(): Intensity[][] {
  const all: Intensity[][] = [];
  for (let i = 0; i < 2 ** SENSORY_CLAPS; i++)
    all.push(Array.from({ length: SENSORY_CLAPS }, (_, b) => ((i >> b) & 1 ? "loud" : "soft")));
  return pick(all, SENSORY_TRIALS);
}

export const randomEpisodicActions = () => pick(ACTION_KEYS, EPISODIC_COUNT);
