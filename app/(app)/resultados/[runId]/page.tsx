import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { SubscaleResult } from "@/components/instruments/subscale-result";
import { isSubscaleList } from "@/lib/instruments/types";
import { LEVEL_LABELS } from "@/lib/scoring/levels";

export const metadata: Metadata = { title: "Resultado" };

type Metrics = Record<string, number | null>;

function MetricRows({ taskCode, metrics }: { taskCode: string; metrics: Metrics }) {
  const rows: [string, string][] =
    taskCode === "A2_flanker"
      ? [
          ["Respuestas correctas", `${metrics.correct} de ${metrics.total_trials}`],
          ["Sin respuesta a tiempo", String(metrics.omissions ?? 0)],
          ["Tiempo promedio, flechas iguales", metrics.mean_rt_congruent_ms ? `${metrics.mean_rt_congruent_ms} ms` : "—"],
          ["Tiempo promedio, flechas mezcladas", metrics.mean_rt_incongruent_ms ? `${metrics.mean_rt_incongruent_ms} ms` : "—"],
          ["Efecto de interferencia", metrics.interference_ms !== null ? `${metrics.interference_ms} ms` : "—"],
        ]
      : [
          ["Series correctas", `${metrics.correct} de ${metrics.max_score}`],
          ["Serie más larga recordada", `${metrics.span} números`],
        ];
  return (
    <dl className="divide-y rounded-xl border">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="font-semibold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function ResultPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const { supabase } = await requireProfile();

  const { data: run } = await supabase
    .from("task_runs")
    .select("*, tasks(name), assessments(subject_id, mode, subjects(display_name))")
    .eq("id", runId)
    .maybeSingle();
  if (!run || !run.assessments) notFound();

  const level = LEVEL_LABELS[run.level];
  const index = Math.round(Number(run.index_score));
  const subscales = (run.metrics as { subscales?: unknown } | null)?.subscales;

  if (isSubscaleList(subscales)) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardContent className="space-y-6 p-6 sm:p-8">
            <p className="text-sm text-muted-foreground">{run.assessments.subjects?.display_name}</p>
            <SubscaleResult
              title={run.task_code === "ATT_instrument" ? "Atención" : "Memoria"}
              date={new Date(run.completed_at).toLocaleDateString("es-MX", { dateStyle: "long" })}
              index={index}
              level={run.level}
              subscales={subscales}
            />
            <Alert variant="info">
              Este resultado es orientativo y no es un diagnóstico. Cansancio, sueño o distracciones pueden afectar el
              desempeño.
            </Alert>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href={`/evaluar/${run.assessments.subject_id}`}>Volver a las pruebas</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={`/historial/${run.assessments.subject_id}/${run.task_code}?run=${run.id}#run-${run.id}`}>
                  Ver historial de respuestas
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/juegos">Practicar con minijuegos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardDescription>
            {run.assessments.subjects?.display_name} ·{" "}
            {new Date(run.completed_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
          </CardDescription>
          <CardTitle className="text-2xl">{run.tasks?.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="flex size-28 flex-col items-center justify-center rounded-full border-4 border-cyan bg-muted">
              <span className="text-4xl font-semibold">{index}</span>
              <span className="text-xs text-muted-foreground">de 100</span>
            </div>
            <div className="space-y-2">
              <Badge variant={level.tone} className="text-base">
                {level.label}
              </Badge>
              <p>{level.description}</p>
            </div>
          </div>
          <MetricRows taskCode={run.task_code} metrics={run.metrics as Metrics} />
          <Alert variant="info">
            Este resultado es orientativo y no es un diagnóstico. Los niveles son provisionales mientras reunimos datos de
            referencia por edad y escolaridad. Cansancio, sueño o distracciones pueden afectar el desempeño.
          </Alert>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href={`/evaluar/${run.assessments.subject_id}`}>Volver a las pruebas</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/historial/${run.assessments.subject_id}/${run.task_code}?run=${run.id}#run-${run.id}`}>
                Ver historial de la prueba
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
