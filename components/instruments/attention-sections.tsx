"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ALTERNATING_COLORS,
  ALTERNATING_SHAPES,
  randomAlternatingSteps,
  randomSelectiveCounts,
  DIVIDED_WORD_MS,
  DIVIDED_WORDS,
  FOCALIZED_LIMIT_MS,
  FOCALIZED_STARS,
  SELECTIVE_DISTRACTORS,
  SELECTIVE_GAP_MS,
  SELECTIVE_STIMULUS_MS,
  SELECTIVE_TARGET,
  SUSTAINED_QUESTIONS,
  SUSTAINED_TEXT,
  type AttentionResponses,
} from "@/lib/instruments/attention";
import { cn } from "@/lib/utils";
import { Choice, now, Progress, randomInt, SectionIntro, shuffled, speak, Stage, stopSpeaking, useSleep } from "./kit";

type SectionProps<T> = { number: number; total: number; onDone: (value: T) => void };

// 1. Selective ------------------------------------------------------------------

function selectiveSequence(count: number) {
  const distractors = Array.from({ length: count + 4 + randomInt(4) }, () => SELECTIVE_DISTRACTORS[randomInt(SELECTIVE_DISTRACTORS.length)]);
  // Targets never sit next to each other so each one is a separate event.
  let seq: string[] = [];
  do seq = shuffled([...distractors, ...Array(count).fill(SELECTIVE_TARGET)]);
  while (seq.some((s, i) => s === SELECTIVE_TARGET && seq[i + 1] === SELECTIVE_TARGET));
  return seq;
}

export function Selective({ number, total, onDone }: SectionProps<AttentionResponses["selective"]>) {
  const sleep = useSleep();
  const [started, setStarted] = useState(false);
  const [item, setItem] = useState(0);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState("");
  const answers = useRef<AttentionResponses["selective"]>([]);
  const [counts] = useState(randomSelectiveCounts);

  async function present(index: number) {
    setAsking(false);
    setSymbol(null);
    await sleep(800);
    for (const s of selectiveSequence(counts[index])) {
      setSymbol(s);
      await sleep(SELECTIVE_STIMULUS_MS);
      setSymbol(null);
      await sleep(SELECTIVE_GAP_MS);
    }
    setAnswer("");
    setAsking(true);
  }

  function submit() {
    const n = answer.trim() === "" ? null : Number(answer);
    answers.current[item] = { count: counts[item], answer: Number.isFinite(n) ? n : null };
    if (item + 1 === counts.length) return onDone(answers.current);
    setItem(item + 1);
    void present(item + 1);
  }

  if (!started)
    return (
      <SectionIntro
        number={number}
        total={total}
        title="Atención selectiva"
        onStart={() => {
          setStarted(true);
          void present(0);
        }}
      >
        <p>
          Verás figuras que aparecen una por una. Cuenta en silencio cuántas veces aparece la estrella rellena{" "}
          <span className="text-2xl">{SELECTIVE_TARGET}</span>.
        </p>
        <p>No uses los dedos ni papel para contar. Son {counts.length} series y cada una se muestra una sola vez.</p>
      </SectionIntro>
    );

  return (
    <Stage>
      <Progress value={item} total={counts.length} label="Serie" />
      {asking ? (
        <form
          className="flex w-full max-w-xs flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label htmlFor="count" className="text-xl font-semibold">
            ¿Cuántas veces apareció {SELECTIVE_TARGET}?
          </label>
          <Input
            id="count"
            autoFocus
            inputMode="numeric"
            pattern="[0-9]*"
            value={answer}
            onChange={(e) => setAnswer(e.target.value.replace(/\D/g, "").slice(0, 2))}
            className="h-14 text-center text-2xl"
          />
          <Button size="lg" type="submit" disabled={answer === ""}>
            Siguiente
          </Button>
        </form>
      ) : (
        <div className="flex size-48 items-center justify-center rounded-2xl border bg-card text-8xl">{symbol}</div>
      )}
    </Stage>
  );
}

// 2. Focalized ------------------------------------------------------------------

const W = 600;
const H = 400;
type Tri = { x: number; y: number; s: number; r: number };
type Star = { x: number; y: number; s: number; r: number };

function starPoints({ x, y, s, r }: Star) {
  return Array.from({ length: 10 }, (_, i) => {
    const rad = i % 2 === 0 ? s : s * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2 + r;
    return `${x + rad * Math.cos(a)},${y + rad * Math.sin(a)}`;
  }).join(" ");
}
function triPoints({ x, y, s, r }: Tri) {
  return [0, 1, 2]
    .map((i) => {
      const a = (2 * Math.PI * i) / 3 - Math.PI / 2 + r;
      return `${x + s * Math.cos(a)},${y + s * Math.sin(a)}`;
    })
    .join(" ");
}
function scene() {
  const tris: Tri[] = Array.from({ length: 170 }, () => ({
    x: 20 + Math.random() * (W - 40),
    y: 20 + Math.random() * (H - 40),
    s: 16 + Math.random() * 18,
    r: (Math.random() - 0.5) * 0.6,
  }));
  const stars: Star[] = [];
  while (stars.length < FOCALIZED_STARS) {
    const star = { x: 40 + Math.random() * (W - 80), y: 40 + Math.random() * (H - 80), s: 15 + Math.random() * 4, r: Math.random() };
    if (stars.every((o) => Math.hypot(o.x - star.x, o.y - star.y) > 120)) stars.push(star);
  }
  return { tris, stars };
}

export function Focalized({ number, total, onDone }: SectionProps<AttentionResponses["focalized"]>) {
  const [started, setStarted] = useState<number | null>(null);
  const [{ tris, stars }] = useState(scene);
  const [found, setFound] = useState<number[]>([]);
  const finished = useRef(false);

  function finish(foundCount: number) {
    if (finished.current || started === null) return;
    finished.current = true;
    onDone({ found: foundCount, ms: Math.round(now() - started) });
  }

  useEffect(() => {
    if (started === null) return;
    const id = setTimeout(() => finish(found.length), FOCALIZED_LIMIT_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, found.length]);

  if (started === null)
    return (
      <SectionIntro number={number} total={total} title="Atención focalizada" onStart={() => setStarted(now())}>
        <p>
          En la imagen hay muchos triángulos y {FOCALIZED_STARS} estrellas escondidas. Encuéntralas y tócalas lo más rápido
          que puedas. El tiempo empieza al tocar Empezar.
        </p>
      </SectionIntro>
    );

  return (
    <Stage>
      <p className="text-lg font-semibold">
        Estrellas encontradas: {found.length} de {FOCALIZED_STARS}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-3xl touch-manipulation rounded-xl border bg-white" role="img" aria-label="Imagen con triángulos y estrellas escondidas">
        {tris.map((t, i) => (
          <polygon key={i} points={triPoints(t)} fill="none" stroke="#2a3a4f" strokeWidth={1.4} />
        ))}
        {stars.map((s, i) => (
          <g key={`s${i}`}>
            <polygon points={starPoints(s)} fill={found.includes(i) ? "#86e3e8" : "none"} stroke="#2a3a4f" strokeWidth={1.4} />
            <circle
              cx={s.x}
              cy={s.y}
              r={s.s + 10}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => {
                if (found.includes(i)) return;
                const next = [...found, i];
                setFound(next);
                if (next.length === FOCALIZED_STARS) finish(next.length);
              }}
            />
          </g>
        ))}
      </svg>
      <Button variant="ghost" onClick={() => finish(found.length)}>
        No encuentro más
      </Button>
    </Stage>
  );
}

// 3. Sustained ------------------------------------------------------------------

export function Sustained({ number, total, onDone }: SectionProps<AttentionResponses["sustained"]>) {
  const [phase, setPhase] = useState<"intro" | "text" | "questions">("intro");
  const [q, setQ] = useState(0);
  const answers = useRef<(number | null)[]>([]);
  // Questions and their options appear in random order; answers are stored by original index.
  const [questionOrder] = useState(() => shuffled(SUSTAINED_QUESTIONS.map((_, i) => i)));
  const [order] = useState(() => SUSTAINED_QUESTIONS.map((question) => shuffled(question.options.map((_, i) => i))));

  if (phase === "intro")
    return (
      <SectionIntro
        number={number}
        total={total}
        title="Atención sostenida"
        onStart={() => {
          setPhase("text");
          speak(SUSTAINED_TEXT);
        }}
      >
        <p>Vas a escuchar y leer un texto breve una sola vez. Pon mucha atención: después te haremos 3 preguntas.</p>
      </SectionIntro>
    );

  if (phase === "text")
    return (
      <Stage>
        <p className="max-w-2xl rounded-2xl border bg-card p-6 text-left text-xl leading-relaxed">{SUSTAINED_TEXT}</p>
        <Button
          size="lg"
          onClick={() => {
            stopSpeaking();
            setPhase("questions");
          }}
        >
          Ya terminé, ir a las preguntas
        </Button>
      </Stage>
    );

  const qi = questionOrder[q];
  const question = SUSTAINED_QUESTIONS[qi];
  return (
    <Stage>
      <Progress value={q} total={SUSTAINED_QUESTIONS.length} label="Pregunta" />
      <h3 className="text-2xl font-semibold">{question.question}</h3>
      <Choice
        key={q}
        options={order[qi].map((i) => question.options[i])}
        onPick={(pos) => {
          answers.current[qi] = order[qi][pos];
          if (q + 1 === SUSTAINED_QUESTIONS.length) onDone(answers.current);
          else setQ(q + 1);
        }}
      />
    </Stage>
  );
}

// 4. Divided --------------------------------------------------------------------

export function Divided({ number, total, onDone }: SectionProps<AttentionResponses["divided"]>) {
  const sleep = useSleep();
  const [started, setStarted] = useState(false);
  const [word, setWord] = useState<number>(-1);
  const [flash, setFlash] = useState(false);
  const t0 = useRef(0);
  const presses = useRef<number[]>([]);

  async function run() {
    setStarted(true);
    for (let i = 3; i > 0; i--) {
      setWord(-i - 1);
      await sleep(800);
    }
    t0.current = now();
    for (let i = 0; i < DIVIDED_WORDS.length; i++) {
      setWord(i);
      // Re-anchor to the clock so a slow device does not drift from the server schedule.
      const wait = t0.current + (i + 1) * DIVIDED_WORD_MS - now();
      await sleep(Math.max(0, wait));
    }
    setWord(DIVIDED_WORDS.length);
    await sleep(700);
    onDone({ presses: presses.current.map((t) => Math.round(t)) });
  }

  function press() {
    if (word < 0 || word >= DIVIDED_WORDS.length) return;
    presses.current.push(now() - t0.current);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
  }

  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        press();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!started)
    return (
      <SectionIntro number={number} total={total} title="Atención dividida" onStart={() => void run()}>
        <p>Verás un texto palabra por palabra. Léelo y, cada vez que aparezca el nombre de un color, toca el botón grande (o la barra espaciadora).</p>
        <p>Toca solo con los colores: cada toque de más resta puntos.</p>
      </SectionIntro>
    );

  return (
    <Stage>
      <div className="flex h-40 w-full max-w-xl items-center justify-center rounded-2xl border bg-card text-5xl font-semibold">
        {word < -1 ? -word - 1 : word >= 0 && word < DIVIDED_WORDS.length ? DIVIDED_WORDS[word] : ""}
      </div>
      <button
        type="button"
        onPointerDown={press}
        className={cn(
          "size-40 rounded-full border-4 border-primary text-xl font-semibold transition-colors select-none",
          flash ? "bg-primary text-primary-foreground" : "bg-cyan/30",
        )}
      >
        ¡Color!
      </button>
    </Stage>
  );
}

// 5. Alternating ----------------------------------------------------------------

function Shape({ shape, color, size = 64 }: { shape: string; color: string; size?: number }) {
  const props = { fill: color, stroke: "#2a3a4f", strokeWidth: 2 };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {shape === "circle" && <circle cx="50" cy="50" r="40" {...props} />}
      {shape === "square" && <rect x="12" y="12" width="76" height="76" {...props} />}
      {shape === "triangle" && <polygon points="50,8 92,88 8,88" {...props} />}
      {shape === "star" && <polygon points={starPoints({ x: 50, y: 52, s: 44, r: 0 })} {...props} />}
    </svg>
  );
}

export function Alternating({ number, total, onDone }: SectionProps<AttentionResponses["alternating"]>) {
  const [phase, setPhase] = useState<"intro" | "instruction" | "draw">("intro");
  const [step, setStep] = useState(0);
  const [color, setColor] = useState<string | null>(null);
  const [shape, setShape] = useState<string | null>(null);
  const answers = useRef<AttentionResponses["alternating"]>([]);
  const [steps] = useState(randomAlternatingSteps);

  function showInstruction(i: number) {
    setStep(i);
    setColor(null);
    setShape(null);
    setPhase("instruction");
    speak(steps[i].text);
  }

  if (phase === "intro")
    return (
      <SectionIntro number={number} total={total} title="Atención alternante" onStart={() => showInstruction(0)}>
        <p>Recibirás {steps.length} indicaciones, una por una. Cada una te pide un color y una figura. Léela, toca Continuar y elige el color y la figura que se pidió.</p>
      </SectionIntro>
    );

  if (phase === "instruction")
    return (
      <Stage>
        <Progress value={step} total={steps.length} label="Indicación" />
        <p className="text-3xl font-semibold">{steps[step].text}</p>
        <Button size="lg" onClick={() => setPhase("draw")}>
          Continuar
        </Button>
      </Stage>
    );

  const hex = ALTERNATING_COLORS.find((c) => c.key === color)?.hex ?? "#ffffff";
  return (
    <Stage>
      <Progress value={step} total={steps.length} label="Indicación" />
      <div className="flex size-32 items-center justify-center rounded-2xl border bg-card">
        {shape ? <Shape shape={shape} color={hex} size={96} /> : <span className="text-muted-foreground">Tu dibujo</span>}
      </div>
      <div className="space-y-2">
        <p className="font-semibold">Color</p>
        <div className="flex flex-wrap justify-center gap-3">
          {ALTERNATING_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setColor(c.key)}
              className={cn("flex flex-col items-center gap-1 rounded-xl border p-2 text-sm", color === c.key && "ring-2 ring-ring")}
            >
              <span className="size-10 rounded-full border" style={{ background: c.hex }} />
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="font-semibold">Figura</p>
        <div className="flex flex-wrap justify-center gap-3">
          {ALTERNATING_SHAPES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setShape(s.key)}
              className={cn("flex flex-col items-center gap-1 rounded-xl border p-2 text-sm", shape === s.key && "ring-2 ring-ring")}
            >
              <Shape shape={s.key} color="#ffffff" size={40} />
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <Button
        size="lg"
        disabled={!color || !shape}
        onClick={() => {
          answers.current[step] = { expected: { color: steps[step].color, shape: steps[step].shape }, color, shape };
          if (step + 1 === steps.length) onDone(answers.current);
          else showInstruction(step + 1);
        }}
      >
        Listo
      </Button>
    </Stage>
  );
}
