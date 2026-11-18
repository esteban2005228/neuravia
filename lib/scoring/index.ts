import { digitSpanTrialsSchema, scoreDigitSpan } from "./digit-span";
import { flankerTrialsSchema, scoreFlanker } from "./flanker";

export const TASK_SCORERS = {
  A2_flanker: (raw: unknown) => scoreFlanker(flankerTrialsSchema.parse(raw)),
  M2_digit_span: (raw: unknown) => scoreDigitSpan(digitSpanTrialsSchema.parse(raw)),
} as const;

export type TaskCode = keyof typeof TASK_SCORERS;

export function isTaskCode(code: string): code is TaskCode {
  return code in TASK_SCORERS;
}
