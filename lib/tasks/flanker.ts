import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";

import type { FlankerTrial } from "@/lib/scoring/flanker";
import { button, shuffle, type TaskDefinition, type TimelineNode } from "./types";

type Direction = "left" | "right";
type Spec = { congruent: boolean; direction: Direction };

const LEFT = "&#8592;";
const RIGHT = "&#8594;";
const RESPONSE_LIMIT_MS = 2000;
const PRACTICE_PER_CELL = 2; // 8 practice trials
const TEST_PER_CELL = 12; // 48 test trials

function arrows({ congruent, direction }: Spec) {
  const center = direction === "left" ? LEFT : RIGHT;
  const flank = congruent ? center : direction === "left" ? RIGHT : LEFT;
  return `<div class="flanker-arrows">${flank}${flank}${center}${flank}${flank}</div>`;
}

function cells(perCell: number): Spec[] {
  const out: Spec[] = [];
  for (const congruent of [true, false]) {
    for (const direction of ["left", "right"] as Direction[]) {
      for (let i = 0; i < perCell; i++) out.push({ congruent, direction });
    }
  }
  return shuffle(out);
}

export const flankerTask: TaskDefinition<FlankerTrial> = {
  code: "A2_flanker",
  version: "1.0.0",
  build(jsPsych, collect) {
    const choices = [`${LEFT} Izquierda`, `Derecha ${RIGHT}`];
    let lastCorrect = false;

    const fixation: TimelineNode = {
      type: HtmlButtonResponsePlugin,
      stimulus: '<div class="fixation">+</div>',
      choices: [],
      trial_duration: 500,
      response_ends_trial: false,
    };

    const trialFor = (spec: Spec, phase: "practice" | "test"): TimelineNode => ({
      type: HtmlButtonResponsePlugin,
      stimulus: arrows(spec),
      choices,
      button_html: (choice: string) => button(choice),
      trial_duration: RESPONSE_LIMIT_MS,
      on_finish: (data: { response: number | null; rt: number | null }) => {
        const response: Direction | null = data.response === 0 ? "left" : data.response === 1 ? "right" : null;
        lastCorrect = response === spec.direction;
        collect({
          phase,
          congruent: spec.congruent,
          direction: spec.direction,
          response,
          rt: data.rt === null ? null : Math.round(data.rt),
          correct: lastCorrect,
        });
      },
    });

    const feedback: TimelineNode = {
      type: HtmlButtonResponsePlugin,
      stimulus: () =>
        lastCorrect
          ? '<p style="font-size:1.5rem">¡Correcto!</p>'
          : '<p style="font-size:1.5rem">Recuerda: fíjate solo en la flecha del centro.</p>',
      choices: [],
      trial_duration: 900,
      response_ends_trial: false,
    };

    const intro: TimelineNode = {
      type: HtmlButtonResponsePlugin,
      stimulus: `
        <h2>Flechas</h2>
        <p>Verás una fila de cinco flechas. Toca el botón que indica hacia dónde apunta <strong>la flecha del centro</strong>.</p>
        <p>Ignora las flechas de los lados, a veces apuntan al lado contrario.</p>
        <div class="flanker-arrows" style="margin:1rem 0">${RIGHT}${RIGHT}${LEFT}${RIGHT}${RIGHT}</div>
        <p>En este ejemplo la respuesta es <strong>Izquierda</strong>. Responde lo más rápido que puedas sin equivocarte.</p>`,
      choices: ["Empezar práctica"],
      button_html: (choice: string) => button(choice),
    };

    const ready: TimelineNode = {
      type: HtmlButtonResponsePlugin,
      stimulus:
        "<h2>Muy bien</h2><p>Ahora empieza la prueba. Ya no verás si acertaste. Dura unos 3 minutos.</p>",
      choices: ["Empezar prueba"],
      button_html: (choice: string) => button(choice),
    };

    const practice = cells(PRACTICE_PER_CELL).flatMap((spec) => [fixation, trialFor(spec, "practice"), feedback]);
    const test = cells(TEST_PER_CELL).flatMap((spec) => [fixation, trialFor(spec, "test")]);

    void jsPsych;
    return [intro, ...practice, ready, ...test];
  },
};
