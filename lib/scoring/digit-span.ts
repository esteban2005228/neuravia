import { z } from "zod";

import { clampIndex, levelFor } from "./levels";

export const DIGIT_SPAN_MIN = 3;
export const DIGIT_SPAN_MAX = 9;
export const DIGIT_SPAN_TRIALS_PER_LENGTH = 2;
export const DIGIT_SPAN_MAX_SCORE = (DIGIT_SPAN_MAX - DIGIT_SPAN_MIN + 1) * DIGIT_SPAN_TRIALS_PER_LENGTH;

export const digitSpanTrialSchema = z.object({
  phase: z.enum(["practice", "test"]),
  length: z.number().int().min(2).max(DIGIT_SPAN_MAX),
  sequence: z.string().regex(/^\d+$/),
  response: z.string().max(20),
  correct: z.boolean(),
});
export const digitSpanTrialsSchema = z.array(digitSpanTrialSchema).min(1).max(40);
export type DigitSpanTrial = z.infer<typeof digitSpanTrialSchema>;

export function normalizeDigits(input: string) {
  return input.replace(/\D/g, "");
}

/**
 * Forward digit span: lengths 3 to 9, two trials each, stops when both
 * trials of a length fail. Raw score = correct trials (max 14); span = longest
 * length with at least one correct trial. Index = raw / 14 * 100.
 */
export function scoreDigitSpan(trials: DigitSpanTrial[]) {
  const test = trials
    .filter((t) => t.phase === "test")
    .map((t) => ({ ...t, correct: normalizeDigits(t.response) === t.sequence && t.sequence.length === t.length }));
  const correct = test.filter((t) => t.correct);
  const span = correct.reduce((max, t) => Math.max(max, t.length), 0);
  const index = clampIndex((correct.length / DIGIT_SPAN_MAX_SCORE) * 100);

  return {
    trials: test,
    rawScore: correct.length,
    indexScore: index,
    level: levelFor(index),
    metrics: {
      total_trials: test.length,
      correct: correct.length,
      max_score: DIGIT_SPAN_MAX_SCORE,
      span,
    },
  };
}

/** True when both trials at the given length were answered wrong (stop rule). */
export function shouldStop(trials: DigitSpanTrial[], length: number) {
  const atLength = trials.filter((t) => t.phase === "test" && t.length === length);
  return atLength.length >= DIGIT_SPAN_TRIALS_PER_LENGTH && atLength.every((t) => !t.correct);
}
