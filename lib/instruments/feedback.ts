import type { ResultLevel } from "@/lib/scoring/levels";

/** One sentence under the score, like the summary in the reference design. */
export const LEVEL_SUMMARY: Record<ResultLevel, string> = {
  strength: "Tu resultado fue muy bueno. Mantener la actividad mental diaria ayuda a conservarlo.",
  expected: "Tu resultado fue bueno. Mantener la actividad mental diaria ayuda a conservarlo.",
  watch: "Hay áreas que conviene practicar. Repite la evaluación en unas semanas para ver tu avance.",
  refer: "Algunas áreas salieron bajas. Te sugerimos comentar este resultado con un profesional de la salud.",
};

/** Practical suggestions for each subtype, used for the weakest ones. */
export const SUBSCALE_TIPS: Record<string, string[]> = {
  selective: ["Haz una cosa a la vez y evita el ruido de fondo.", "Practica sopas de letras y Busca el símbolo en Juegos."],
  focalized: ["Ordena tu espacio antes de empezar una tarea.", "Practica Busca el símbolo para entrenar la búsqueda visual."],
  sustained: ["Trabaja en bloques de 25 minutos con pausas de 5.", "Lee un texto corto y resume en voz alta lo que entendiste."],
  divided: ["Evita hacer varias cosas a la vez cuando necesites precisión.", "Haz pausas cortas cada 20 o 30 minutos."],
  alternating: ["Haz ejercicios que cambien de regla, como clasificar objetos por color y luego por forma.", "Antes de cambiar de tarea, termina y anota dónde te quedaste."],
  short_term: ["Repite en voz alta lo que necesitas recordar.", "Practica el Memorama en Juegos."],
  working: ["Haz cálculos mentales sencillos, como sumar los precios en el súper.", "Practica Secuencia de colores en Juegos."],
  sensory: ["Presta atención a los sonidos de tu entorno y nómbralos.", "Reduce el ruido cuando necesites escuchar con atención."],
  semantic: ["Lee sobre temas que te interesen y coméntalos con alguien.", "Juega a decir palabras de una categoría (frutas, animales) en un minuto."],
  episodic: ["Al final del día, recuerda en orden lo que hiciste.", "Escribe un diario breve de tus actividades."],
  procedural: ["Practica rutinas paso a paso hasta que salgan sin pensar.", "Aprende una actividad manual nueva, como una receta o un instrumento."],
  long_term: ["Repasa lo importante en días distintos, no todo el mismo día.", "Asocia la información nueva con algo que ya conoces."],
};

export const GENERAL_SUGGESTIONS = [
  "Duerme de 7 a 9 horas.",
  "Muévete al menos 30 minutos casi todos los días.",
  "Practica los minijuegos unos minutos al día.",
];

/** Suggestions for the two weakest subtypes (below 80 %), or general ones if all are fine. */
export function suggestionsFor(subscales: { key: string; score: number; max: number }[]) {
  const weak = [...subscales]
    .filter((s) => s.max > 0 && s.score / s.max < 0.8)
    .sort((a, b) => a.score / a.max - b.score / b.max)
    .slice(0, 2);
  const tips = weak.flatMap((s) => SUBSCALE_TIPS[s.key] ?? []);
  return tips.length ? tips : GENERAL_SUGGESTIONS;
}
