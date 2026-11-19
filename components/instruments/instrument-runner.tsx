"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { startAssessment, submitTaskRun } from "@/app/actions/assessments";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ATTENTION_CODE, ATTENTION_VERSION, type AttentionResponses } from "@/lib/instruments/attention";
import { MEMORY_VERSION, type MemoryResponses } from "@/lib/instruments/memory";
import type { InstrumentCode } from "@/lib/scoring";
import { Alternating, Divided, Focalized, Selective, Sustained } from "./attention-sections";
import { primeAudio } from "./kit";
import { Episodic, LongTermLearn, LongTermRecall, Procedural, Semantic, Sensory, ShortTerm, Working } from "./memory-sections";

type Stage = "ready" | "running" | "saving" | "error";

/** Each step renders one exercise and stores its answer under `key`. */
type Step = { key: string; View: React.ComponentType<{ onDone: (value: unknown) => void }> };

const ATTENTION_STEPS: Step[] = [
  { key: "selective", View: (p) => <Selective number={1} total={5} onDone={p.onDone} /> },
  { key: "focalized", View: (p) => <Focalized number={2} total={5} onDone={p.onDone} /> },
  { key: "sustained", View: (p) => <Sustained number={3} total={5} onDone={p.onDone} /> },
  { key: "divided", View: (p) => <Divided number={4} total={5} onDone={p.onDone} /> },
  { key: "alternating", View: (p) => <Alternating number={5} total={5} onDone={p.onDone} /> },
];

const MEMORY_STEPS: Step[] = [
  { key: "_learn", View: (p) => <LongTermLearn onDone={() => p.onDone(null)} /> },
  { key: "shortTerm", View: (p) => <ShortTerm number={1} total={7} onDone={p.onDone} /> },
  { key: "working", View: (p) => <Working number={2} total={7} onDone={p.onDone} /> },
  { key: "sensory", View: (p) => <Sensory number={3} total={7} onDone={p.onDone} /> },
  { key: "semantic", View: (p) => <Semantic number={4} total={7} onDone={p.onDone} /> },
  { key: "episodic", View: (p) => <Episodic number={5} total={7} onDone={p.onDone} /> },
  { key: "procedural", View: (p) => <Procedural number={6} total={7} onDone={p.onDone} /> },
  { key: "longTerm", View: (p) => <LongTermRecall number={7} total={7} onDone={p.onDone} /> },
];

export function InstrumentRunner({
  subjectId,
  subjectName,
  taskCode,
  taskName,
  isSelf,
}: {
  subjectId: string;
  subjectName: string;
  taskCode: InstrumentCode;
  taskName: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const isAttention = taskCode === ATTENTION_CODE;
  const steps = isAttention ? ATTENTION_STEPS : MEMORY_STEPS;
  const [stage, setStage] = useState<Stage>("ready");
  const [error, setError] = useState<string>();
  const [index, setIndex] = useState(0);
  const assessmentId = useRef<string>(undefined);
  const responses = useRef<Record<string, unknown>>({});

  async function begin() {
    primeAudio();
    const result = await startAssessment(subjectId);
    if (!result.assessmentId) {
      setError(result.error);
      setStage("error");
      return;
    }
    assessmentId.current = result.assessmentId;
    setStage("running");
  }

  async function finish() {
    setStage("saving");
    const { _learn, ...answers } = responses.current;
    void _learn;
    const result = await submitTaskRun({
      assessmentId: assessmentId.current!,
      taskCode,
      taskVersion: isAttention ? ATTENTION_VERSION : MEMORY_VERSION,
      trials: answers as AttentionResponses | MemoryResponses,
    });
    if (result.runId) router.replace(`/resultados/${result.runId}`);
    else {
      setError(result.error);
      setStage("error");
    }
  }

  function done(value: unknown) {
    responses.current[steps[index].key] = value;
    window.scrollTo({ top: 0 });
    if (index + 1 === steps.length) void finish();
    else setIndex(index + 1);
  }

  if (stage === "ready" || stage === "error")
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">{taskName}</CardTitle>
          <CardDescription>
            {isAttention ? "5 ejercicios" : "7 ejercicios"}, alrededor de {isAttention ? "8" : "10"} minutos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-lg">
          {!isSelf && (
            <Alert variant="info">
              Vas a aplicar la prueba a {subjectName}. Lee con la persona las instrucciones de cada ejercicio y deja que
              ella responda.
            </Alert>
          )}
          <ul className="list-disc space-y-1 pl-6">
            <li>Busca un lugar tranquilo y sin distracciones.</li>
            <li>Sube el volumen: algunos ejercicios tienen sonidos.</li>
            <li>Cada ejercicio se muestra una sola vez. Lee las instrucciones antes de empezar.</li>
          </ul>
          {error && <Alert variant="error">{error}</Alert>}
          <Button size="lg" onClick={() => void begin()}>
            Comenzar
          </Button>
        </CardContent>
      </Card>
    );

  if (stage === "saving")
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="py-16 text-center text-lg">Calculando tus resultados…</CardContent>
      </Card>
    );

  const { View } = steps[index];
  return (
    <Card className="mx-auto max-w-4xl">
      <CardContent className="p-6 sm:p-10">
        <View key={index} onDone={done} />
      </CardContent>
    </Card>
  );
}
