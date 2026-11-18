import { describe, expect, it } from "vitest";

import { scoreDigitSpan, shouldStop, type DigitSpanTrial } from "./digit-span";
import { scoreFlanker, type FlankerTrial } from "./flanker";
import { levelFor } from "./levels";

describe("levelFor", () => {
  it("uses the provisional cut-offs", () => {
    expect(levelFor(100)).toBe("strength");
    expect(levelFor(90)).toBe("strength");
    expect(levelFor(89)).toBe("expected");
    expect(levelFor(70)).toBe("expected");
    expect(levelFor(69)).toBe("watch");
    expect(levelFor(50)).toBe("watch");
    expect(levelFor(49)).toBe("refer");
  });
});

describe("scoreFlanker", () => {
  const trial = (over: Partial<FlankerTrial>): FlankerTrial => ({
    phase: "test",
    congruent: true,
    direction: "left",
    response: "left",
    rt: 500,
    correct: true,
    ...over,
  });

  it("ignores practice trials and recomputes correctness", () => {
    const result = scoreFlanker([
      trial({ phase: "practice", response: "right" }),
      trial({}),
      trial({ congruent: false, rt: 600 }),
      trial({ response: "right", correct: true }), // flag lies, response is wrong
      trial({ response: null, rt: null }),
    ]);
    expect(result.metrics.total_trials).toBe(4);
    expect(result.rawScore).toBe(2);
    expect(result.indexScore).toBe(50);
    expect(result.metrics.omissions).toBe(1);
    expect(result.metrics.interference_ms).toBe(100);
  });
});

describe("scoreDigitSpan", () => {
  const t = (length: number, ok: boolean): DigitSpanTrial => {
    const sequence = "123456789".slice(0, length);
    return { phase: "test", length, sequence, response: ok ? sequence : "0", correct: ok };
  };

  it("counts correct trials and the longest span", () => {
    const trials = [t(3, true), t(3, true), t(4, true), t(4, false), t(5, false), t(5, false)];
    const result = scoreDigitSpan(trials);
    expect(result.rawScore).toBe(3);
    expect(result.metrics.span).toBe(4);
    expect(result.indexScore).toBe(21);
    expect(result.level).toBe("refer");
    expect(shouldStop(trials, 5)).toBe(true);
    expect(shouldStop(trials, 4)).toBe(false);
  });

  it("accepts responses typed with spaces", () => {
    const result = scoreDigitSpan([{ phase: "test", length: 3, sequence: "582", response: "5 8 2", correct: false }]);
    expect(result.rawScore).toBe(1);
  });
});
