import { describe, expect, it } from "vitest";

import {
  ALTERNATING_STEPS,
  DIVIDED_TARGETS,
  DIVIDED_WORD_MS,
  SELECTIVE_COUNTS,
  SUSTAINED_QUESTIONS,
  scoreAttention,
  type AttentionResponses,
} from "./attention";
import {
  EPISODIC_ACTIONS,
  LONG_TERM_QUESTIONS,
  PROCEDURAL_TRIALS,
  SEMANTIC_ITEMS,
  SENSORY_TRIALS,
  SHORT_TERM_TRIALS,
  WORKING_TRIALS,
  expectedProcedural,
  scoreMemory,
  type MemoryResponses,
} from "./memory";

const perfectAttention = (): AttentionResponses => ({
  selective: [...SELECTIVE_COUNTS],
  focalized: { found: 3, ms: 12_000 },
  sustained: SUSTAINED_QUESTIONS.map((q) => q.answer),
  divided: { presses: DIVIDED_TARGETS.map((i) => i * DIVIDED_WORD_MS + 300) },
  alternating: ALTERNATING_STEPS.map((s) => ({ color: s.color, shape: s.shape })),
});

describe("scoreAttention", () => {
  it("gives 100 for a perfect run and finds the 7 color words", () => {
    expect(DIVIDED_TARGETS).toHaveLength(7);
    const result = scoreAttention(perfectAttention());
    expect(result.indexScore).toBe(100);
    expect(result.metrics.max_score).toBe(36);
  });

  it("scores time bands, false alarms and partial figures", () => {
    const r = perfectAttention();
    r.focalized = { found: 3, ms: 45_000 };
    r.divided.presses = [...r.divided.presses, 0];
    r.alternating[0] = { color: "blue", shape: "square" };
    r.selective[0] = 3;
    const subs = Object.fromEntries(scoreAttention(r).metrics.subscales.map((s) => [s.key, s.score]));
    expect(subs).toMatchObject({ selective: 7, focalized: 1, divided: 13, alternating: 5, sustained: 6 });
  });
});

const perfectMemory = (): MemoryResponses => ({
  shortTerm: [SHORT_TERM_TRIALS[0]],
  working: WORKING_TRIALS.map((t) => t.expected.join("-")),
  sensory: SENSORY_TRIALS.map((t) => [...t]),
  semantic: SEMANTIC_ITEMS.map((s) => s.answer),
  episodic: EPISODIC_ACTIONS.map((a) => a.key),
  procedural: PROCEDURAL_TRIALS.map((t) => t.map((k) => ({ response: expectedProcedural(k), rt: 800 }))),
  longTerm: LONG_TERM_QUESTIONS.map((q) => q.answer),
});

describe("scoreMemory", () => {
  it("gives 100 for a perfect run", () => {
    const result = scoreMemory(perfectMemory());
    expect(result.indexScore).toBe(100);
    expect(result.metrics.max_score).toBe(46);
  });

  it("takes the best short-term trial, ignores late procedural answers and reads loose working answers", () => {
    const r = perfectMemory();
    r.shortTerm = [["reloj", "lapiz", "cuchara", "llave"], ["cuchara", "lapiz", "llave", null]];
    r.working[0] = "13 ab";
    r.procedural[2][0] = { response: "table", rt: 5000 };
    const subs = Object.fromEntries(scoreMemory(r).metrics.subscales.map((s) => [s.key, s.score]));
    expect(subs).toMatchObject({ short_term: 3, working: 13, procedural: 8 });
  });
});
