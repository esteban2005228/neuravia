import { z } from "zod";

import { clampIndex, levelFor } from "./levels";

export const flankerTrialSchema = z.object({
  phase: z.enum(["practice", "test"]),
  congruent: z.boolean(),
  direction: z.enum(["left", "right"]),
  response: z.enum(["left", "right"]).nullable(),
  rt: z.number().nonnegative().nullable(),
  correct: z.boolean(),
});
export const flankerTrialsSchema = z.array(flankerTrialSchema).min(1).max(200);
export type FlankerTrial = z.infer<typeof flankerTrialSchema>;

function mean(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

/**
 * Index = % correct test trials (responses within the time limit).
 * Reaction times and the interference effect (incongruent - congruent RT)
 * are reported as complementary metrics.
 */
export function scoreFlanker(trials: FlankerTrial[]) {
  const test = trials.filter((t) => t.phase === "test");
  // Recompute correctness from the raw response, never trust the flag.
  const checked = test.map((t) => ({ ...t, correct: t.response !== null && t.response === t.direction }));
  const correct = checked.filter((t) => t.correct);
  const accuracy = checked.length ? correct.length / checked.length : 0;

  const rtCongruent = mean(correct.filter((t) => t.congruent && t.rt !== null).map((t) => t.rt as number));
  const rtIncongruent = mean(correct.filter((t) => !t.congruent && t.rt !== null).map((t) => t.rt as number));
  const interference = rtCongruent !== null && rtIncongruent !== null ? rtIncongruent - rtCongruent : null;

  const index = clampIndex(accuracy * 100);
  return {
    trials: checked,
    rawScore: correct.length,
    indexScore: index,
    level: levelFor(index),
    metrics: {
      total_trials: checked.length,
      correct: correct.length,
      omissions: checked.filter((t) => t.response === null).length,
      accuracy: Math.round(accuracy * 1000) / 1000,
      mean_rt_congruent_ms: rtCongruent === null ? null : Math.round(rtCongruent),
      mean_rt_incongruent_ms: rtIncongruent === null ? null : Math.round(rtIncongruent),
      interference_ms: interference === null ? null : Math.round(interference),
    },
  };
}
