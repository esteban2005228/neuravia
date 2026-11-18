import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ResultsList } from "@/components/results-list";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Pruebas" };

const DOMAIN_LABEL = { attention: "Atención", memory: "Memoria" } as const;

export default async function SubjectPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params;
  const { supabase, user } = await requireProfile();

  const [{ data: subject }, { data: tasks }, { data: hasConsent }] = await Promise.all([
    supabase.from("subjects").select("*").eq("id", subjectId).maybeSingle(),
    supabase.from("tasks").select("*").eq("active", true).order("domain"),
    supabase.rpc("has_service_consent", { p_subject_id: subjectId }),
  ]);
  if (!subject) notFound();

  const isSelf = subject.user_id === user.id;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{isSelf ? "Tus pruebas" : subject.display_name}</h1>
        {!isSelf && (
          <p className="text-muted-foreground">
            Aplicarás la prueba en este dispositivo. Al empezar, entrégaselo al paciente.
          </p>
        )}
      </div>

      {!hasConsent && (
        <Alert variant="warning">
          El paciente retiró su consentimiento para usar el servicio, así que no se pueden aplicar pruebas.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {(tasks ?? []).map((task) => (
          <Card key={task.code}>
            <CardHeader>
              <Badge variant={task.domain === "attention" ? "cyan" : "lavender"} className="w-fit">
                {DOMAIN_LABEL[task.domain]}
              </Badge>
              <CardTitle>{task.name}</CardTitle>
              <CardDescription>{task.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {hasConsent ? (
                <Button asChild>
                  <Link href={`/evaluar/${subject.id}/${task.code}`}>{isSelf ? "Empezar" : "Aplicar"}</Link>
                </Button>
              ) : (
                <Button disabled>No disponible</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Resultados</h2>
        <ResultsList subjectId={subject.id} limit={20} />
      </section>
    </div>
  );
}
