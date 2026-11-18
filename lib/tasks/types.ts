import type { JsPsych } from "jspsych";

export type TimelineNode = Record<string, unknown>;

/** A task builds its jsPsych timeline and pushes clean trial records into `collect`. */
export type TaskDefinition<TTrial> = {
  code: string;
  version: string;
  build: (jsPsych: JsPsych, collect: (trial: TTrial) => void) => TimelineNode[];
};

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const button = (label: string) => `<button class="jspsych-btn">${label}</button>`;
