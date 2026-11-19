import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AnswerSections } from "@/components/instruments/answer-sections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { describeAnswers } from "@/lib/instruments/answers";
import { LEVEL_LABELS } from "@/lib/scoring/levels";

export const metadata: Metadata = { title: "Historial de respuestas" };

const MODE_LABEL = { self: "Autoaplicada", professional: "Con profesional", companion: "Con acompañante" } as const;

/**
 * Every run of one test for one person, newest first, with what was answered.
 * Access follows RLS: the person themselves and anyone with an active link to them.
 */
export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectId: string; taskCode: string }>;
  searchParams: Promise<{ run?: string }>;
}) {
  const [{ subjectId, taskCode }, { run: openRun }] = await Promise.all([params, searchParams]);
  const { supabase } = await requireProfile();

  const [{ data: subject }, { data: task }, { data: runs }] = await Promise.all([
    supabase.from("subjects").select("id, display_name").eq("id", subjectId).maybeSingle(),
    supabase.from("tasks").select("name").eq("code", taskCode).maybeSingle(),
    supabase
      .from("task_runs")
      .select("id, trials, index_score, level, completed_at, assessments!inner(subject_id, mode)")
      .eq("assessments.subject_id", subjectId)
      .eq("task_code", taskCode)
      .order("completed_at", { ascending: false })
      .limit(50),
  ]);
  if (!subject || !task) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{subject.display_name}</p>
        <h1 className="text-2xl font-semibold">Historial de {task.name}</h1>
        <p className="text-muted-foreground">Cada vez que se hizo esta prueba y lo que se respondió.</p>
      </div>

      {!runs?.length && <p className="text-muted-foreground">Todavía no hay resultados de esta prueba.</p>}

      {runs?.map((run) => {
        const level = LEVEL_LABELS[run.level];
        const sections = describeAnswers(taskCode, run.trials);
        return (
          <Card key={run.id} id={`run-${run.id}`}>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-lg">
                  {new Date(run.completed_at).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" })}
                </CardTitle>
                <CardDescription>{MODE_LABEL[run.assessments.mode]}</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">{Math.round(Number(run.index_score))}</span>
                <Badge variant={level.tone}>{level.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <details open={run.id === openRun || (!openRun && run.id === runs[0].id)} className="group">
                <summary className="cursor-pointer font-semibold text-blue">Ver respuestas</summary>
                <div className="pt-4">
                  {sections ? (
                    <AnswerSections sections={sections} />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      El detalle de respuestas no está disponible para esta prueba o para esta versión de la prueba.
                    </p>
                  )}
                </div>
              </details>
              <Button asChild variant="outline" size="sm">
                <Link href={`/resultados/${run.id}`}>Ver resultado</Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}

      <Button asChild variant="secondary">
        <Link href={`/evaluar/${subjectId}`}>Volver a las pruebas</Link>
      </Button>
    </div>
  );
}
