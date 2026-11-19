import { ATTENTION_CODE, scoreAttention } from "@/lib/instruments/attention";
import { MEMORY_CODE, scoreMemory } from "@/lib/instruments/memory";
import { digitSpanTrialsSchema, scoreDigitSpan } from "./digit-span";
import { flankerTrialsSchema, scoreFlanker } from "./flanker";

export const TASK_SCORERS = {
  A2_flanker: (raw: unknown) => scoreFlanker(flankerTrialsSchema.parse(raw)),
  M2_digit_span: (raw: unknown) => scoreDigitSpan(digitSpanTrialsSchema.parse(raw)),
  [ATTENTION_CODE]: scoreAttention,
  [MEMORY_CODE]: scoreMemory,
} as const;

export type TaskCode = keyof typeof TASK_SCORERS;

export function isTaskCode(code: string): code is TaskCode {
  return code in TASK_SCORERS;
}

export const INSTRUMENT_CODES = [ATTENTION_CODE, MEMORY_CODE] as const;
export type InstrumentCode = (typeof INSTRUMENT_CODES)[number];
export const isInstrumentCode = (code: string): code is InstrumentCode =>
  (INSTRUMENT_CODES as readonly string[]).includes(code);
