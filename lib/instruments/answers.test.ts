import { describe, expect, it } from "vitest";

import { describeAnswers, describeAttention, describeMemory } from "./answers";
import { DIVIDED_TARGETS, DIVIDED_WORD_MS, SUSTAINED_QUESTIONS } from "./attention";
import { SEMANTIC_ITEMS } from "./memory";

const attention = {
  selective: [
    { count: 7, answer: 7 },
    { count: 3, answer: 4 },
    { count: 9, answer: 9 },
    { count: 2, answer: 2 },
    { count: 12, answer: null },
  ],
  focalized: { found: 3, ms: 21_000 },
  sustained: SUSTAINED_QUESTIONS.map((q) => q.answer),
  divided: { presses: [...DIVIDED_TARGETS.slice(1).map((i) => i * DIVIDED_WORD_MS + 300), 5] },
  alternating: [
    { expected: { color: "green", shape: "star" }, color: "green", shape: "star" },
    { expected: { color: "blue", shape: "circle" }, color: "red", shape: "circle" },
    { expected: { color: "yellow", shape: "square" }, color: "yellow", shape: "square" },
  ],
};

const memory = {
  shortTerm: [{ shown: ["reloj", "lapiz", "llave", "cuchara"], given: ["reloj", "lapiz", "llave", "cuchara"] }],
  working: [
    { sequence: ["B", "3", "A", "1"], answer: "13ab" },
    { sequence: ["C", "2", "E", "4"], answer: "2-4-E-C" },
    { sequence: ["D", "7", "A", "1", "C"], answer: "1-7-A-C-D" },
  ],
  sensory: [
    { played: ["soft", "loud", "soft"], given: ["soft", "loud", "soft"] },
    { played: ["loud", "loud", "soft"], given: ["loud", "soft", null] },
    { played: ["soft", "soft", "soft"], given: ["soft", "soft", "soft"] },
  ],
  semantic: SEMANTIC_ITEMS.map((s) => s.answer),
  episodic: { shown: ["clap", "lamp", "water"], given: ["clap", "water", "lamp"] },
  procedural: [
    { round: 0, positions: [4, 0, 7, 2, 5], taps: [4, 0, 2, 7, 5], rt: 3000 },
    { round: 0, positions: [1, 2, 3, 4, 5], taps: [1, 2, 3, 4, 5], rt: 3000 },
    { round: 1, positions: [1, 2, 3, 4, 5], taps: [1, 2, 3, 4, 5], rt: 3000 },
    { round: 2, positions: [1, 2, 3, 4, 5], taps: [1, 2, 3, 4, 5], rt: 2000 },
  ],
  longTerm: {
    fact: { name: "Laura", age: 32, city: "Puebla", pet: "gato", petName: "Max" },
    answers: ["Laura", "Perro", "Puebla", "Max"],
  },
};

const wrong = (sections: NonNullable<ReturnType<typeof describeAttention>>) =>
  Object.fromEntries(sections.map((s) => [s.title, s.rows.filter((r) => !r.ok).length]));

describe("answer history", () => {
  it("describes attention answers and marks mistakes", () => {
    const sections = describeAttention(attention)!;
    expect(wrong(sections)).toEqual({
      "Atención selectiva": 2,
      "Atención focalizada": 0,
      "Atención sostenida": 0,
      "Atención dividida": 1,
      "Atención alternante": 1,
    });
    expect(sections[3].note).toMatch(/1 vez/);
    expect(sections[4].rows[1]).toMatchObject({ given: "Rojo, Círculo", expected: "Azul, Círculo" });
  });

  it("describes memory answers and marks mistakes", () => {
    const sections = describeMemory(memory)!;
    expect(wrong(sections)).toEqual({
      "Memoria a corto plazo": 0,
      "Memoria de trabajo": 1,
      "Memoria sensorial": 1,
      "Memoria semántica": 0,
      "Memoria episódica": 1,
      "Memoria procedimental": 1,
      "Memoria a largo plazo": 1,
    });
    expect(sections[1].rows[1]).toMatchObject({ given: "2-4-E-C", expected: "2-4-C-E" });
    expect(sections[5].rows[1].prompt).toBe("Ronda 1, intento 2 (límite 7 s)");
    expect(sections[6].note).toContain("Laura tiene 32 años, vive en Puebla y tiene un gato llamado Max.");
  });

  it("returns null for older answer formats and other tests", () => {
    expect(describeAttention({ selective: [2, 4, 5, 10, 3, 6, 8, 12] })).toBeNull();
    expect(describeAnswers("A2_flanker", [])).toBeNull();
  });
});
