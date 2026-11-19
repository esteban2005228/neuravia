import {
  ALTERNATING_COLORS,
  ALTERNATING_SHAPES,
  alternatingText,
  attentionResponsesSchema,
  DIVIDED_TARGETS,
  DIVIDED_WORDS,
  dividedHits,
  FOCALIZED_STARS,
  SELECTIVE_TARGET,
  SUSTAINED_QUESTIONS,
} from "./attention";
import {
  EPISODIC_ACTIONS,
  longTermQuestions,
  longTermText,
  memoryResponsesSchema,
  OBJECTS,
  PROCEDURAL_LIMIT_MS,
  proceduralTrialOk,
  SEMANTIC_ITEMS,
  workingExpected,
  type Intensity,
} from "./memory";

/**
 * Turns the raw answers stored for a run into readable rows, one section per exercise.
 * Returns null when the run was saved by an older version whose answers have another shape.
 */
export type AnswerRow = { prompt: string; given: string; expected?: string; ok: boolean | null };
export type AnswerSection = { title: string; note?: string; rows: AnswerRow[] };

const BLANK = "Sin respuesta";
const list = (items: readonly (string | null)[]) => (items.some(Boolean) ? items.map((x) => x ?? "—").join(" → ") : BLANK);
const seconds = (ms: number | null) => (ms === null ? "sin terminar" : `${(ms / 1000).toFixed(1)} s`);
const colorLabel = (key: string | null) => ALTERNATING_COLORS.find((c) => c.key === key)?.label ?? BLANK;
const shapeLabel = (key: string | null) => ALTERNATING_SHAPES.find((s) => s.key === key)?.label ?? BLANK;
const clap = (x: Intensity | null) => (x === "loud" ? "Fuerte" : x === "soft" ? "Suave" : null);
const sameOrder = <T>(a: readonly (T | null)[], b: readonly T[]) => b.every((x, i) => a[i] === x);

export function describeAttention(raw: unknown): AnswerSection[] | null {
  const parsed = attentionResponsesSchema.safeParse(raw);
  if (!parsed.success) return null;
  const r = parsed.data;
  const { hitTargets, falseAlarms } = dividedHits(r.divided.presses);

  return [
    {
      title: "Atención selectiva",
      rows: r.selective.map((s, i) => ({
        prompt: `Serie ${i + 1}: ¿cuántas veces apareció ${SELECTIVE_TARGET}?`,
        given: s.answer === null ? BLANK : String(s.answer),
        expected: String(s.count),
        ok: s.answer === s.count,
      })),
    },
    {
      title: "Atención focalizada",
      rows: [
        {
          prompt: "Estrellas escondidas encontradas",
          given: `${r.focalized.found} de ${FOCALIZED_STARS} en ${seconds(r.focalized.ms)}`,
          ok: r.focalized.found === FOCALIZED_STARS && r.focalized.ms <= 60_000,
        },
      ],
    },
    {
      title: "Atención sostenida",
      rows: SUSTAINED_QUESTIONS.map((q, i) => ({
        prompt: q.question,
        given: r.sustained[i] === null ? BLANK : q.options[r.sustained[i]!],
        expected: q.options[q.answer],
        ok: r.sustained[i] === q.answer,
      })),
    },
    {
      title: "Atención dividida",
      note: falseAlarms ? `Tocó el botón ${falseAlarms} ${falseAlarms === 1 ? "vez" : "veces"} sin que hubiera un color.` : undefined,
      rows: DIVIDED_TARGETS.map((i) => ({
        prompt: `Palabra de color: «${DIVIDED_WORDS[i].replace(/[.,]/g, "")}»`,
        given: hitTargets.has(i) ? "La detectó" : "No la detectó",
        ok: hitTargets.has(i),
      })),
    },
    {
      title: "Atención alternante",
      rows: r.alternating.map((a, i) => ({
        prompt: alternatingText(i, a.expected.color, a.expected.shape),
        given: `${colorLabel(a.color)}, ${shapeLabel(a.shape)}`,
        expected: `${colorLabel(a.expected.color)}, ${shapeLabel(a.expected.shape)}`,
        ok: a.color === a.expected.color && a.shape === a.expected.shape,
      })),
    },
  ];
}

export function describeMemory(raw: unknown): AnswerSection[] | null {
  const parsed = memoryResponsesSchema.safeParse(raw);
  if (!parsed.success) return null;
  const r = parsed.data;
  const object = (k: keyof typeof OBJECTS | null) => (k ? OBJECTS[k].label : null);
  const action = (k: string | null) => EPISODIC_ACTIONS.find((a) => a.key === k)?.text ?? null;
  const questions = longTermQuestions(r.longTerm.fact);

  return [
    {
      title: "Memoria a corto plazo",
      rows: r.shortTerm.map((t, i) => ({
        prompt: `Intento ${i + 1}: orden de los objetos`,
        given: list(t.given.map(object)),
        expected: list(t.shown.map(object)),
        ok: sameOrder(t.given, t.shown),
      })),
    },
    {
      title: "Memoria de trabajo",
      rows: r.working.map((t) => {
        const expected = workingExpected(t.sequence).join("-");
        return {
          prompt: `Serie mostrada: ${t.sequence.join("-")}`,
          given: t.answer.trim() || BLANK,
          expected,
          ok: t.answer.toUpperCase().replace(/[^0-9A-Z]/g, "") === expected.replace(/-/g, ""),
        };
      }),
    },
    {
      title: "Memoria sensorial",
      rows: r.sensory.map((t, i) => ({
        prompt: `Ensayo ${i + 1}: orden de los aplausos`,
        given: list(t.given.map(clap)),
        expected: list(t.played.map(clap)),
        ok: sameOrder(t.given, t.played),
      })),
    },
    {
      title: "Memoria semántica",
      rows: SEMANTIC_ITEMS.map((s, i) => ({
        prompt: s.text,
        given: r.semantic[i] === null ? BLANK : r.semantic[i] ? "Correcto" : "Incorrecto",
        expected: s.answer ? "Correcto" : "Incorrecto",
        ok: r.semantic[i] === s.answer,
      })),
    },
    {
      title: "Memoria episódica",
      rows: [
        {
          prompt: "Orden de las acciones",
          given: list(r.episodic.given.map(action)),
          expected: list(r.episodic.shown.map(action)),
          ok: sameOrder(r.episodic.given, r.episodic.shown),
        },
      ],
    },
    {
      title: "Memoria procedimental",
      note: "Cada ronda se repite solo si la respuesta fue incorrecta o tardó más del tiempo límite.",
      rows: r.procedural.map((t, i) => {
        const ok = proceduralTrialOk(t);
        const attempt = r.procedural.slice(0, i + 1).filter((x) => x.round === t.round).length;
        const inOrder = t.taps.length === t.positions.length && t.taps.every((c, j) => c === t.positions[j]);
        return {
          prompt: `Ronda ${t.round + 1}, intento ${attempt} (límite ${PROCEDURAL_LIMIT_MS[t.round] / 1000} s)`,
          given: ok ? `Correcto en ${seconds(t.rt)}` : inOrder ? `Orden correcto, pero tardó ${seconds(t.rt)}` : "Orden incorrecto",
          ok,
        };
      }),
    },
    {
      title: "Memoria a largo plazo",
      note: `Dato que se mostró al inicio: «${longTermText(r.longTerm.fact)}»`,
      rows: questions.map((q, i) => ({
        prompt: q.question,
        given: r.longTerm.answers[i] ?? BLANK,
        expected: q.answer,
        ok: r.longTerm.answers[i] === q.answer,
      })),
    },
  ];
}

export function describeAnswers(taskCode: string, raw: unknown) {
  if (taskCode === "ATT_instrument") return describeAttention(raw);
  if (taskCode === "MEM_instrument") return describeMemory(raw);
  return null;
}
