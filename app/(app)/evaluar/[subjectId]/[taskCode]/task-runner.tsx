"use client";

import "jspsych/css/jspsych.css";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { startAssessment, submitTaskRun } from "@/app/actions/assessments";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Stage = "ready" | "running" | "saving" | "error";

export function TaskRunner({
  subjectId,
  subjectName,
  taskCode,
  taskName,
  isSelf,
}: {
  subjectId: string;
  subjectName: string;
  taskCode: "A2_flanker" | "M2_digit_span";
  taskName: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<Stage>("ready");
  const [error, setError] = useState<string>();
  const [assessmentId, setAssessmentId] = useState<string>();

  useEffect(() => {
    if (stage !== "running" || !assessmentId || !stageRef.current) return;
    let cancelled = false;
    let abort: (() => void) | undefined;

    (async () => {
      const [{ initJsPsych }, { TASKS }] = await Promise.all([import("jspsych"), import("@/lib/tasks")]);
      if (cancelled || !stageRef.current) return;
      const task = TASKS[taskCode];
      const trials: unknown[] = [];

      const jsPsych = initJsPsych({
        display_element: stageRef.current,
        on_finish: async () => {
          if (cancelled) return;
          setStage("saving");
          const result = await submitTaskRun({ assessmentId, taskCode, taskVersion: task.version, trials });
          if (result.runId) {
            router.replace(`/resultados/${result.runId}`);
          } else {
            setError(result.error);
            setStage("error");
          }
        },
      });
      abort = () => jsPsych.abortExperiment();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await jsPsych.run(task.build(jsPsych, (t) => trials.push(t)) as any);
    })();

    return () => {
      cancelled = true;
      abort?.();
    };
  }, [stage, assessmentId, taskCode, router]);

  async function begin() {
    setError(undefined);
    const result = await startAssessment(subjectId);
    if (!result.assessmentId) {
      setError(result.error);
      return;
    }
    setAssessmentId(result.assessmentId);
    setStage("running");
  }

  if (stage === "running") {
    return <div ref={stageRef} className="task-stage rounded-2xl border bg-card p-4" />;
  }

  if (stage === "saving") {
    return <p className="py-20 text-center text-lg">Guardando tus respuestas…</p>;
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>{taskName}</CardTitle>
        <CardDescription>
          {isSelf
            ? "Busca un lugar tranquilo, silencia notificaciones y usa una sola mano para responder."
            : `Entrega el dispositivo a ${subjectName}. Durante la prueba no le ayudes ni le des pistas.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <Button size="lg" onClick={begin}>
          {stage === "error" ? "Intentar de nuevo" : isSelf ? "Estoy listo" : `${subjectName} está listo`}
        </Button>
      </CardContent>
    </Card>
  );
}
