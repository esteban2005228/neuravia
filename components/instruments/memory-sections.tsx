"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EPISODIC_ACTIONS,
  EPISODIC_ITEM_MS,
  LONG_TERM_QUESTIONS,
  LONG_TERM_TEXT,
  OBJECTS,
  PROCEDURAL_TRIALS,
  PROCEDURAL_WINDOW_MS,
  SEMANTIC_ITEMS,
  SENSORY_TRIALS,
  SHORT_TERM_ITEM_MS,
  SHORT_TERM_TRIALS,
  WORKING_ITEM_MS,
  WORKING_TRIALS,
  type Intensity,
  type MemoryResponses,
  type ObjectKey,
  type ProceduralResponse,
} from "@/lib/instruments/memory";
import { cn } from "@/lib/utils";
import {
  Choice,
  now,
  OrderPicker,
  playClap,
  playKnock,
  Progress,
  SectionIntro,
  shuffled,
  speak,
  Stage,
  stopSpeaking,
  useSleep,
} from "./kit";

type SectionProps<T> = { number: number; total: number; onDone: (value: T) => void };

// Long-term (learn) ---------------------------------------------------------------

export function LongTermLearn({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState(false);
  if (!shown)
    return (
      <SectionIntro
        number={0}
        total={7}
        title="Antes de empezar"
        startLabel="Ver el dato"
        onStart={() => {
          setShown(true);
          speak(LONG_TERM_TEXT);
        }}
      >
        <p>Te daremos un dato. Recuérdalo bien: al final de la evaluación te preguntaremos por él.</p>
      </SectionIntro>
    );
  return (
    <Stage>
      <p className="max-w-xl rounded-2xl border bg-card p-6 text-2xl font-semibold leading-relaxed">{LONG_TERM_TEXT}</p>
      <Button
        size="lg"
        onClick={() => {
          stopSpeaking();
          onDone();
        }}
      >
        Lo recordaré, continuar
      </Button>
    </Stage>
  );
}

// 1. Short-term -------------------------------------------------------------------

const objectView = (key: ObjectKey) => (
  <>
    <span className="text-3xl">{OBJECTS[key].icon}</span>
    <span>{OBJECTS[key].label}</span>
  </>
);

export function ShortTerm({ number, total, onDone }: SectionProps<MemoryResponses["shortTerm"]>) {
  const sleep = useSleep();
  const [phase, setPhase] = useState<"intro" | "show" | "answer">("intro");
  const [trial, setTrial] = useState(0);
  const [current, setCurrent] = useState<ObjectKey | null>(null);
  const answers = useRef<MemoryResponses["shortTerm"]>([]);
  const [options] = useState(() => shuffled(Object.keys(OBJECTS) as ObjectKey[]));

  async function present(t: number) {
    setTrial(t);
    setPhase("show");
    await sleep(700);
    for (const key of SHORT_TERM_TRIALS[t]) {
      setCurrent(key);
      speak(OBJECTS[key].label);
      await sleep(SHORT_TERM_ITEM_MS);
      setCurrent(null);
      await sleep(300);
    }
    setPhase("answer");
  }

  if (phase === "intro")
    return (
      <SectionIntro number={number} total={total} title="Memoria a corto plazo" onStart={() => void present(0)}>
        <p>Vas a ver y escuchar 4 objetos en un orden. Después tendrás que acomodarlos en el mismo orden.</p>
        <p>Si no lo logras a la primera, tendrás un segundo intento con otro orden.</p>
      </SectionIntro>
    );

  if (phase === "show")
    return (
      <Stage>
        <Progress value={trial} total={2} label="Intento" />
        <div className="flex size-48 flex-col items-center justify-center gap-2 rounded-2xl border bg-card text-xl">
          {current && (
            <>
              <span className="text-7xl">{OBJECTS[current].icon}</span>
              {OBJECTS[current].label}
            </>
          )}
        </div>
      </Stage>
    );

  return (
    <Stage>
      <h3 className="text-2xl font-semibold">Acomoda los objetos en el orden en que aparecieron</h3>
      <OrderPicker
        key={trial}
        options={options}
        slots={4}
        render={objectView}
        onDone={(order) => {
          answers.current[trial] = order;
          const perfect = SHORT_TERM_TRIALS[trial].every((k, i) => order[i] === k);
          if (perfect || trial === 1) onDone(answers.current);
          else void present(1);
        }}
      />
    </Stage>
  );
}

// 2. Working memory ---------------------------------------------------------------

export function Working({ number, total, onDone }: SectionProps<MemoryResponses["working"]>) {
  const sleep = useSleep();
  const [phase, setPhase] = useState<"intro" | "show" | "answer">("intro");
  const [trial, setTrial] = useState(0);
  const [current, setCurrent] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const answers = useRef<string[]>([]);

  async function present(t: number) {
    setTrial(t);
    setAnswer("");
    setPhase("show");
    await sleep(700);
    for (const item of WORKING_TRIALS[t].sequence) {
      setCurrent(item);
      speak(item);
      await sleep(WORKING_ITEM_MS);
      setCurrent(null);
      await sleep(250);
    }
    setPhase("answer");
  }

  if (phase === "intro")
    return (
      <SectionIntro number={number} total={total} title="Memoria de trabajo" onStart={() => void present(0)}>
        <p>Verás una serie de números y letras, uno por uno. Al terminar, escríbela reorganizada así: primero los números de menor a mayor y después las letras en orden alfabético.</p>
        <p>
          Ejemplo: si ves <strong>B-3-A-1</strong>, la respuesta es <strong>1-3-A-B</strong>.
        </p>
      </SectionIntro>
    );

  if (phase === "show")
    return (
      <Stage>
        <Progress value={trial} total={WORKING_TRIALS.length} label="Serie" />
        <div className="flex size-40 items-center justify-center rounded-2xl border bg-card text-7xl font-semibold">{current}</div>
      </Stage>
    );

  return (
    <Stage>
      <Progress value={trial} total={WORKING_TRIALS.length} label="Serie" />
      <form
        className="flex w-full max-w-sm flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          answers.current[trial] = answer;
          if (trial + 1 === WORKING_TRIALS.length) onDone(answers.current);
          else void present(trial + 1);
        }}
      >
        <label htmlFor="working" className="text-xl font-semibold">
          Escribe la serie reorganizada
        </label>
        <Input
          id="working"
          autoFocus
          autoCapitalize="characters"
          autoComplete="off"
          value={answer}
          onChange={(e) => setAnswer(e.target.value.toUpperCase().slice(0, 20))}
          placeholder="Ej.: 1-3-A-B"
          className="h-14 text-center font-mono text-2xl tracking-widest"
        />
        <Button size="lg" type="submit" disabled={!answer.trim()}>
          Siguiente
        </Button>
      </form>
    </Stage>
  );
}

// 3. Sensory ----------------------------------------------------------------------

export function Sensory({ number, total, onDone }: SectionProps<MemoryResponses["sensory"]>) {
  const sleep = useSleep();
  const [phase, setPhase] = useState<"intro" | "play" | "answer">("intro");
  const [trial, setTrial] = useState(0);
  const [pulse, setPulse] = useState<Intensity | null>(null);
  const [given, setGiven] = useState<Intensity[]>([]);
  const answers = useRef<MemoryResponses["sensory"]>([]);

  async function present(t: number) {
    setTrial(t);
    setGiven([]);
    setPhase("play");
    await sleep(900);
    for (const intensity of SENSORY_TRIALS[t]) {
      playClap(intensity);
      setPulse(intensity);
      await sleep(250);
      setPulse(null);
      await sleep(650);
    }
    setPhase("answer");
  }

  if (phase === "intro")
    return (
      <SectionIntro number={number} total={total} title="Memoria sensorial" onStart={() => void present(0)}>
        <p>Sube el volumen. Vas a escuchar 3 aplausos que pueden ser suaves o fuertes. Después indica el orden en que los escuchaste.</p>
        <div className="flex gap-3">
          <Button variant="outline" type="button" onClick={() => playClap("soft")}>
            Probar aplauso suave
          </Button>
          <Button variant="outline" type="button" onClick={() => playClap("loud")}>
            Probar aplauso fuerte
          </Button>
        </div>
      </SectionIntro>
    );

  if (phase === "play")
    return (
      <Stage>
        <Progress value={trial} total={SENSORY_TRIALS.length} label="Ensayo" />
        <p className="text-xl font-semibold">Escucha…</p>
        <div className={cn("size-24 rounded-full bg-lavender/40 transition-transform", pulse && "scale-110 bg-lavender")} />
      </Stage>
    );

  return (
    <Stage>
      <Progress value={trial} total={SENSORY_TRIALS.length} label="Ensayo" />
      <h3 className="text-2xl font-semibold">¿En qué orden escuchaste los aplausos?</h3>
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex h-16 w-24 items-center justify-center rounded-xl border-2 border-dashed bg-card font-semibold">
            {given[i] ? (given[i] === "soft" ? "Suave" : "Fuerte") : i + 1}
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Button size="lg" variant="outline" disabled={given.length >= 3} onClick={() => setGiven((g) => [...g, "soft"])}>
          Suave
        </Button>
        <Button size="lg" variant="outline" disabled={given.length >= 3} onClick={() => setGiven((g) => [...g, "loud"])}>
          Fuerte
        </Button>
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => setGiven([])} disabled={!given.length}>
          Borrar
        </Button>
        <Button
          size="lg"
          disabled={!given.length}
          onClick={() => {
            answers.current[trial] = [0, 1, 2].map((i) => given[i] ?? null);
            if (trial + 1 === SENSORY_TRIALS.length) onDone(answers.current);
            else void present(trial + 1);
          }}
        >
          Listo
        </Button>
      </div>
    </Stage>
  );
}

// 4. Semantic ---------------------------------------------------------------------

export function Semantic({ number, total, onDone }: SectionProps<MemoryResponses["semantic"]>) {
  const [started, setStarted] = useState(false);
  const [item, setItem] = useState(0);
  const answers = useRef<(boolean | null)[]>([]);

  if (!started)
    return (
      <SectionIntro
        number={number}
        total={total}
        title="Memoria semántica"
        onStart={() => {
          setStarted(true);
          speak(SEMANTIC_ITEMS[0].text);
        }}
      >
        <p>Vas a leer y escuchar algunas afirmaciones. Indica si cada una es correcta o incorrecta.</p>
      </SectionIntro>
    );

  return (
    <Stage>
      <Progress value={item} total={SEMANTIC_ITEMS.length} label="Afirmación" />
      <p className="text-3xl font-semibold">{SEMANTIC_ITEMS[item].text}</p>
      <Choice
        options={["Correcto", "Incorrecto"]}
        onPick={(i) => {
          answers.current[item] = i === 0;
          if (item + 1 === SEMANTIC_ITEMS.length) return onDone(answers.current);
          setItem(item + 1);
          speak(SEMANTIC_ITEMS[item + 1].text);
        }}
      />
    </Stage>
  );
}

// 5. Episodic ---------------------------------------------------------------------

type ActionKey = (typeof EPISODIC_ACTIONS)[number]["key"];
const actionView = (key: ActionKey) => {
  const a = EPISODIC_ACTIONS.find((x) => x.key === key)!;
  return (
    <>
      <span className="text-3xl">{a.icon}</span>
      <span className="text-xs leading-tight">{a.text}</span>
    </>
  );
};

export function Episodic({ number, total, onDone }: SectionProps<MemoryResponses["episodic"]>) {
  const sleep = useSleep();
  const [phase, setPhase] = useState<"intro" | "show" | "answer">("intro");
  const [current, setCurrent] = useState<number | null>(null);
  const options = useMemo(() => shuffled(EPISODIC_ACTIONS.map((a) => a.key)), []);

  async function present() {
    setPhase("show");
    await sleep(700);
    for (let i = 0; i < EPISODIC_ACTIONS.length; i++) {
      setCurrent(i);
      speak(EPISODIC_ACTIONS[i].text);
      await sleep(EPISODIC_ITEM_MS);
      setCurrent(null);
      await sleep(300);
    }
    setPhase("answer");
  }

  if (phase === "intro")
    return (
      <SectionIntro number={number} total={total} title="Memoria episódica" onStart={() => void present()}>
        <p>Observa con atención las acciones que se van a mostrar. Al terminar, acomódalas en el orden en que ocurrieron.</p>
      </SectionIntro>
    );

  if (phase === "show")
    return (
      <Stage>
        <div className="flex h-56 w-full max-w-md flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-6 text-xl">
          {current !== null && (
            <>
              <span className="text-7xl">{EPISODIC_ACTIONS[current].icon}</span>
              {EPISODIC_ACTIONS[current].text}
            </>
          )}
        </div>
      </Stage>
    );

  return (
    <Stage>
      <h3 className="text-2xl font-semibold">¿En qué orden ocurrieron las acciones?</h3>
      <OrderPicker options={options} slots={3} render={actionView} onDone={onDone} />
    </Stage>
  );
}

// 6. Procedural -------------------------------------------------------------------

export function Procedural({ number, total, onDone }: SectionProps<MemoryResponses["procedural"]>) {
  const sleep = useSleep();
  const [phase, setPhase] = useState<"intro" | "run">("intro");
  const [trial, setTrial] = useState(0);
  const [knocks, setKnocks] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const pending = useRef<{ resolve: (r: { response: ProceduralResponse | null; rt: number | null }) => void; t: number } | null>(null);

  async function stimulus(n: 1 | 2) {
    for (let k = 0; k < n; k++) {
      playKnock();
      setKnocks(k + 1);
      await sleep(220);
    }
  }

  async function run() {
    setPhase("run");
    const results: MemoryResponses["procedural"] = [];
    for (let t = 0; t < PROCEDURAL_TRIALS.length; t++) {
      setTrial(t);
      await sleep(1200);
      const row: MemoryResponses["procedural"][number] = [];
      for (const n of PROCEDURAL_TRIALS[t]) {
        setKnocks(0);
        await sleep(500);
        await stimulus(n);
        const window = PROCEDURAL_WINDOW_MS[t];
        const answer = await new Promise<{ response: ProceduralResponse | null; rt: number | null }>((resolve) => {
          pending.current = { resolve, t: now() };
          setWaiting(true);
          setTimeout(() => {
            if (pending.current?.resolve === resolve) {
              pending.current = null;
              resolve({ response: null, rt: null });
            }
          }, window);
        });
        setWaiting(false);
        row.push(answer);
      }
      results.push(row);
    }
    onDone(results);
  }

  function respond(response: ProceduralResponse) {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    p.resolve({ response, rt: Math.round(now() - p.t) });
  }

  if (phase === "intro")
    return (
      <SectionIntro number={number} total={total} title="Memoria procedimental" onStart={() => void run()}>
        <p>Sube el volumen. Vas a escuchar golpes:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>1 golpe:</strong> toca «Tocar la mesa».
          </li>
          <li>
            <strong>2 golpes:</strong> toca «Levantar la mano».
          </li>
        </ul>
        <p>Son 3 rondas y cada una es más rápida. Responde lo más rápido que puedas sin equivocarte.</p>
      </SectionIntro>
    );

  return (
    <Stage>
      <Progress value={trial} total={PROCEDURAL_TRIALS.length} label="Ronda" />
      <div className="flex h-16 items-center gap-3" aria-live="polite">
        {Array.from({ length: knocks }, (_, i) => (
          <span key={i} className="size-12 rounded-full bg-blue" />
        ))}
      </div>
      <div className="grid w-full max-w-lg grid-cols-2 gap-4">
        <Button size="lg" variant="outline" className="h-28 text-xl" disabled={!waiting} onPointerDown={() => respond("table")}>
          ✋ Tocar la mesa
        </Button>
        <Button size="lg" variant="outline" className="h-28 text-xl" disabled={!waiting} onPointerDown={() => respond("hand")}>
          🙋 Levantar la mano
        </Button>
      </div>
    </Stage>
  );
}

// 7. Long-term (recall) -----------------------------------------------------------

export function LongTermRecall({ number, total, onDone }: SectionProps<MemoryResponses["longTerm"]>) {
  const [started, setStarted] = useState(false);
  const [q, setQ] = useState(0);
  const answers = useRef<(number | null)[]>([]);

  if (!started)
    return (
      <SectionIntro number={number} total={total} title="Memoria a largo plazo" onStart={() => setStarted(true)}>
        <p>¿Recuerdas el dato que te dimos al inicio? Responde estas preguntas.</p>
      </SectionIntro>
    );

  const question = LONG_TERM_QUESTIONS[q];
  return (
    <Stage>
      <Progress value={q} total={LONG_TERM_QUESTIONS.length} label="Pregunta" />
      <h3 className="text-2xl font-semibold">{question.question}</h3>
      <Choice
        options={question.options}
        onPick={(i) => {
          answers.current[q] = i;
          if (q + 1 === LONG_TERM_QUESTIONS.length) onDone(answers.current);
          else setQ(q + 1);
        }}
      />
    </Stage>
  );
}
