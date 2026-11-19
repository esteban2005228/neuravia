import { describe, expect, it } from "vitest";

import {
  DIVIDED_TARGETS,
  DIVIDED_WORD_MS,
  SUSTAINED_QUESTIONS,
  randomAlternatingSteps,
  randomSelectiveCounts,
  scoreAttention,
  type AttentionResponses,
} from "./attention";
import {
  PROCEDURAL_ROUNDS,
  SEMANTIC_ITEMS,
  WORKING_LENGTHS,
  longTermQuestions,
  randomEpisodicActions,
  randomLongTermFact,
  randomObjectOrder,
  randomSensoryTrials,
  randomWorkingSequence,
  scoreMemory,
  workingExpected,
  type MemoryResponses,
} from "./memory";

const perfectAttention = (): AttentionResponses => ({
  selective: randomSelectiveCounts().map((count) => ({ count, answer: count })),
  focalized: { found: 3, ms: 12_000 },
  sustained: SUSTAINED_QUESTIONS.map((q) => q.answer),
  divided: { presses: DIVIDED_TARGETS.map((i) => i * DIVIDED_WORD_MS + 300) },
  alternating: randomAlternatingSteps().map((s) => ({ expected: { color: s.color, shape: s.shape }, color: s.color, shape: s.shape })),
});

describe("scoreAttention", () => {
  it("gives 100 for a perfect run and finds the 7 color words", () => {
    expect(DIVIDED_TARGETS).toHaveLength(7);
    const result = scoreAttention(perfectAttention());
    expect(result.indexScore).toBe(100);
    expect(result.metrics.max_score).toBe(33);
  });

  it("scores time bands, false alarms and partial figures", () => {
    const r = perfectAttention();
    r.focalized = { found: 3, ms: 45_000 };
    r.divided.presses = [...r.divided.presses, 0];
    r.alternating[0] = { expected: { color: "blue", shape: "circle" }, color: "blue", shape: "square" };
    r.selective[0] = { count: 7, answer: 6 };
    const subs = Object.fromEntries(scoreAttention(r).metrics.subscales.map((s) => [s.key, s.score]));
    expect(subs).toMatchObject({ selective: 4, focalized: 1, divided: 13, alternating: 5, sustained: 6 });
  });

  it("random content stays within the instrument's rules", () => {
    for (let i = 0; i < 50; i++) {
      const counts = randomSelectiveCounts();
      expect(new Set(counts).size).toBe(5);
      expect(counts.every((c) => c >= 2 && c <= 12)).toBe(true);
      const steps = randomAlternatingSteps();
      expect(new Set(steps.map((s) => s.color)).size).toBe(3);
      expect(new Set(steps.map((s) => s.shape)).size).toBe(3);
    }
    expect(randomAlternatingSteps()[1].text).toMatch(/^Ahora toma el color \w+ y dibuja una? \p{L}+\.$/u);
  });
});

const SEQUENCE = [4, 0, 7, 2, 5];
const hit = (round: number, rt: number) => ({ round, positions: [...SEQUENCE], taps: [...SEQUENCE], rt });
const miss = (round: number) => ({ round, positions: [...SEQUENCE], taps: [4, 0, 2, 7, 5], rt: 3000 });

const FACT = { name: "Laura", age: 32, city: "Puebla", pet: "perro", petName: "Max" } as const;

const perfectMemory = (): MemoryResponses => {
  const shown = randomObjectOrder();
  const episodic = randomEpisodicActions();
  return {
    shortTerm: [{ shown, given: [...shown] }],
    working: WORKING_LENGTHS.map((n) => {
      const sequence = randomWorkingSequence(n);
      return { sequence, answer: workingExpected(sequence).join("-") };
    }),
    sensory: randomSensoryTrials().map((played) => ({ played, given: [...played] })),
    semantic: SEMANTIC_ITEMS.map((s) => s.answer),
    episodic: { shown: episodic, given: [...episodic] },
    procedural: Array.from({ length: PROCEDURAL_ROUNDS }, (_, round) => hit(round, 4000 - round * 500)),
    longTerm: { fact: { ...FACT }, answers: longTermQuestions(FACT).map((q) => q.answer) },
  };
};

describe("scoreMemory", () => {
  it("gives 100 for a perfect run", () => {
    const result = scoreMemory(perfectMemory());
    expect(result.indexScore).toBe(100);
    expect(result.metrics.max_score).toBe(46);
  });

  it("takes the best short-term trial, ignores late or misordered procedural answers and reads loose working answers", () => {
    const r = perfectMemory();
    r.shortTerm = [
      { shown: ["lapiz", "reloj", "cuchara", "llave"], given: ["reloj", "lapiz", "cuchara", "llave"] },
      { shown: ["cuchara", "lapiz", "llave", "reloj"], given: ["cuchara", "lapiz", "llave", null] },
    ];
    r.working[0] = { sequence: ["B", "3", "A", "1"], answer: "13 ab" };
    r.longTerm.answers[1] = "Gato";
    // Round 1 on the second try, round 2 never (third try too slow), round 3 first try.
    r.procedural = [miss(0), hit(0, 3800), miss(1), miss(1), hit(1, 6000), hit(2, 2700)];
    const result = scoreMemory(r);
    const subs = Object.fromEntries(result.metrics.subscales.map((s) => [s.key, s.score]));
    expect(subs).toMatchObject({ short_term: 3, working: 13, procedural: 5, long_term: 3 });
    expect(result.metrics.procedural_round_ms).toEqual([3800, null, 2700]);
    expect(result.metrics.procedural_attempts).toEqual([2, 3, 1]);
    expect(result.metrics.procedural_gain_pct).toBe(29);
  });

  it("random content stays within the instrument's rules", () => {
    for (let i = 0; i < 50; i++) {
      const seq = randomWorkingSequence(5);
      expect(seq.filter((x) => /\d/.test(x))).toHaveLength(2);
      expect(seq).not.toEqual(workingExpected(seq));
      const sensory = randomSensoryTrials().map((t) => t.join());
      expect(new Set(sensory).size).toBe(3);
      const first = randomObjectOrder();
      expect(randomObjectOrder(first)).not.toEqual(first);
      const fact = randomLongTermFact();
      expect(scoreMemory({ ...perfectMemory(), longTerm: { fact, answers: longTermQuestions(fact).map((q) => q.answer) } }).indexScore).toBe(100);
    }
  });

  it("rejects a pet or city outside the lists", () => {
    const r = perfectMemory();
    (r.longTerm.fact as { city: string }).city = "París";
    expect(() => scoreMemory(r)).toThrow();
  });

  it("rejects procedural trials that break the retry flow", () => {
    const r = perfectMemory();
    r.procedural = [hit(0, 3000), hit(0, 3000), hit(1, 3000), hit(2, 3000)]; // repeated a solved round
    expect(() => scoreMemory(r)).toThrow();
    r.procedural = [miss(0), hit(1, 3000), hit(2, 3000)]; // skipped a retry
    expect(() => scoreMemory(r)).toThrow();
  });
});
