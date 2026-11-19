/**
 * Everyday habits that support attention and memory. General wellbeing
 * guidance (sleep, exercise, stress, focus routines), not treatment.
 * Content should be reviewed by the Neuravia team before launch.
 */
export type Domain = "attention" | "memory";

export type Tip = { title: string; text: string };

export const DOMAIN_LABEL: Record<Domain, string> = { attention: "Atención", memory: "Memoria" };

export const GENERAL_TIPS: Tip[] = [
  { title: "Duerme de 7 a 9 horas", text: "El sueño ayuda a fijar lo aprendido y a mantener la concentración al día siguiente. Intenta acostarte y levantarte a la misma hora." },
  { title: "Muévete casi todos los días", text: "Caminar a paso rápido 30 minutos, 5 días a la semana, mejora el flujo de sangre al cerebro y el estado de ánimo." },
  { title: "Toma agua y come variado", text: "La deshidratación leve baja la concentración. Incluye frutas, verduras, legumbres y pescado en tu semana." },
  { title: "Cuida el estrés", text: "Unos minutos de respiración lenta (inhala 4 segundos, exhala 6) antes de una tarea difícil ayudan a enfocarte." },
  { title: "Mantente en contacto con otras personas", text: "Conversar, convivir y aprender con otros mantiene activa la mente." },
];

export const DOMAIN_TIPS: Record<Domain, Tip[]> = {
  attention: [
    { title: "Una sola cosa a la vez", text: "Hacer varias tareas al mismo tiempo reduce la atención. Termina una antes de empezar otra." },
    { title: "Bloques de enfoque", text: "Trabaja 25 minutos sin interrupciones y descansa 5. Después de 4 bloques, toma un descanso largo." },
    { title: "Silencia notificaciones", text: "Deja el celular en otra habitación o en modo No molestar mientras estudias o trabajas." },
    { title: "Prepara tu espacio", text: "Un lugar ordenado, con buena luz y sin ruido, facilita mantener la atención." },
    { title: "Pausas activas", text: "Levántate, estírate o mira a lo lejos cada hora. Volverás con la atención renovada." },
    { title: "Practica atención plena", text: "5 minutos al día de fijarte en tu respiración o en los sonidos a tu alrededor entrenan tu capacidad de enfocarte." },
  ],
  memory: [
    { title: "Repasa en días distintos", text: "Repasar algo hoy, en 2 días y en una semana ayuda a recordarlo mucho mejor que repasarlo varias veces seguidas." },
    { title: "Explícalo con tus palabras", text: "Contarle a alguien lo que aprendiste, o escribirlo en un resumen corto, fortalece el recuerdo." },
    { title: "Asocia y visualiza", text: "Relaciona la información nueva con algo que ya conoces o imagínala como una escena." },
    { title: "Agrupa la información", text: "Recordar 55 12 34 78 es más fácil que 55123478. Divide listas y números en bloques." },
    { title: "Usa apoyos externos", text: "Agenda, listas y alarmas liberan tu memoria para lo importante. Deja llaves y objetos siempre en el mismo lugar." },
    { title: "Aprende algo nuevo", text: "Un idioma, un instrumento o una receta nueva retan a tu memoria de forma positiva." },
  ],
};

/** For companions: phrased as things to do together with the relative. */
export const COMPANION_NOTE =
  "Puedes acompañar a tu familiar en estos hábitos: hacerlos juntos ayuda a mantenerlos.";
