export const GAMES = [
  { slug: "memorama", name: "Memorama", domain: "Memoria", text: "Encuentra las parejas recordando dónde estaba cada carta." },
  { slug: "secuencia", name: "Secuencia de colores", domain: "Memoria", text: "Repite una secuencia de colores que crece cada ronda." },
  { slug: "sopa-de-letras", name: "Sopa de letras", domain: "Atención", text: "Busca palabras escondidas en la cuadrícula." },
  { slug: "busca-el-simbolo", name: "Busca el símbolo", domain: "Atención", text: "Encuentra la figura objetivo entre otras parecidas, contra reloj." },
  { slug: "sudoku", name: "Sudoku", domain: "Atención y memoria", text: "Completa la cuadrícula sin repetir números. 4×4, 6×6 o 9×9." },
] as const;

export type GameSlug = (typeof GAMES)[number]["slug"];
