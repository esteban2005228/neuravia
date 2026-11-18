import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import SurveyHtmlFormPlugin from "@jspsych/plugin-survey-html-form";

import {
  DIGIT_SPAN_MAX,
  DIGIT_SPAN_MIN,
  DIGIT_SPAN_TRIALS_PER_LENGTH,
  normalizeDigits,
  shouldStop,
  type DigitSpanTrial,
} from "@/lib/scoring/digit-span";
import { button, type TaskDefinition, type TimelineNode } from "./types";

const DIGIT_ON_MS = 800;
const DIGIT_SOA_MS = 1000;

/** Random digits 1-9 with no immediate repeats. */
function randomSequence(length: number) {
  let out = "";
  while (out.length < length) {
    const d = String(1 + Math.floor(Math.random() * 9));
    if (d !== out.at(-1)) out += d;
  }
  return out;
}

export const digitSpanTask: TaskDefinition<DigitSpanTrial> = {
  code: "M2_digit_span",
  version: "1.0.0",
  build(jsPsych, collect) {
    const recorded: DigitSpanTrial[] = [];
    let stopped = false;
    let lastCorrect = false;

    const record = (trial: DigitSpanTrial) => {
      recorded.push(trial);
      collect(trial);
    };

    const sequenceTrials = (sequence: string, phase: "practice" | "test"): TimelineNode[] => {
      const nodes: TimelineNode[] = [
        {
          type: HtmlKeyboardResponsePlugin,
          stimulus: '<div class="fixation">+</div>',
          choices: "NO_KEYS",
          trial_duration: 700,
        },
      ];
      for (const digit of sequence) {
        nodes.push({
          type: HtmlKeyboardResponsePlugin,
          stimulus: `<div class="digit">${digit}</div>`,
          choices: "NO_KEYS",
          stimulus_duration: DIGIT_ON_MS,
          trial_duration: DIGIT_SOA_MS,
        });
      }
      nodes.push({
        type: SurveyHtmlFormPlugin,
        preamble: "<p>Escribe los números en el mismo orden.</p>",
        html: '<input type="text" name="answer" inputmode="numeric" autocomplete="off" maxlength="20" />',
        autofocus: "answer",
        button_label: "Listo",
        on_finish: (data: { response: { answer?: string } }) => {
          const response = normalizeDigits(data.response?.answer ?? "");
          lastCorrect = response === sequence;
          record({ phase, length: sequence.length, sequence, response, correct: lastCorrect });
        },
      });
      return nodes;
    };

    const intro: TimelineNode = {
      type: HtmlButtonResponsePlugin,
      stimulus: `
        <h2>Números</h2>
        <p>Verás aparecer números uno por uno. Cuando terminen, escríbelos <strong>en el mismo orden</strong>.</p>
        <p>Las series se van haciendo más largas. No uses papel ni repitas en voz alta.</p>`,
      choices: ["Empezar práctica"],
      button_html: (choice: string) => button(choice),
    };

    const practiceFeedback: TimelineNode = {
      type: HtmlButtonResponsePlugin,
      stimulus: () =>
        lastCorrect
          ? "<h2>¡Correcto!</h2><p>Ahora empieza la prueba.</p>"
          : "<h2>Casi</h2><p>Recuerda escribir los números en el mismo orden en que aparecieron. Ahora empieza la prueba.</p>",
      choices: ["Empezar prueba"],
      button_html: (choice: string) => button(choice),
    };

    const test: TimelineNode[] = [];
    for (let length = DIGIT_SPAN_MIN; length <= DIGIT_SPAN_MAX; length++) {
      for (let k = 0; k < DIGIT_SPAN_TRIALS_PER_LENGTH; k++) {
        const isLastOfLength = k === DIGIT_SPAN_TRIALS_PER_LENGTH - 1;
        const nodes = sequenceTrials(randomSequence(length), "test");
        test.push({
          timeline: nodes,
          conditional_function: () => !stopped,
          on_timeline_finish: () => {
            if (isLastOfLength && shouldStop(recorded, length)) stopped = true;
          },
        });
      }
    }

    void jsPsych;
    return [intro, ...sequenceTrials(randomSequence(2), "practice"), practiceFeedback, ...test];
  },
};
