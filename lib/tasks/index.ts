import { digitSpanTask } from "./digit-span";
import { flankerTask } from "./flanker";

export const TASKS = {
  A2_flanker: flankerTask,
  M2_digit_span: digitSpanTask,
} as const;
