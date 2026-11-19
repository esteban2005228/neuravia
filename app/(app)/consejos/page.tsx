import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccessibleSubjects, requireProfile } from "@/lib/auth";
import { COMPANION_NOTE, DOMAIN_LABEL, DOMAIN_TIPS, GENERAL_TIPS, type Domain, type Tip } from "@/lib/tips/content";
import { domainScores } from "@/lib/tips/focus";

export const metadata: Metadata = { title: "Consejos" };

function TipGrid({ tips }: { tips: Tip[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {tips.map((tip) => (
        <li key={tip.title} className="rounded-xl border bg-card p-4">
          <p className="font-semibold">{tip.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{tip.text}</p>
        </li>
      ))}
    </ul>
  );
}

async function SubjectTips({ subjectId, name }: { subjectId: string; name?: string }) {
  const scores = await domainScores(subjectId);
  const focus: Domain | null = scores[0]?.domain ?? null;
  const other: Domain[] = (["attention", "memory"] as const).filter((d) => d !== focus);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name ? `Consejos para ${name}` : "Tus consejos"}</CardTitle>
        <CardDescription>
          {focus
            ? `Según los últimos resultados, el área con el puntaje más bajo es ${DOMAIN_LABEL[focus].toLowerCase()}. Empieza por estos hábitos.`
            : "Cuando haya resultados, aquí verás primero los hábitos para el área con el puntaje más bajo."}
        </CardDescription>
        {scores.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {scores.map((s) => (
              <Badge key={s.domain} variant={s.domain === focus ? "lavender" : "cyan"}>
                {DOMAIN_LABEL[s.domain]}: {Math.round(s.score)}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {focus && (
          <section className="space-y-3">
            <h3 className="font-semibold">Para mejorar la {DOMAIN_LABEL[focus].toLowerCase()}</h3>
            <TipGrid tips={DOMAIN_TIPS[focus]} />
          </section>
        )}
        <section className="space-y-3">
          <h3 className="font-semibold">Hábitos del día a día</h3>
          <TipGrid tips={GENERAL_TIPS} />
        </section>
        {other.map((d) => (
          <details key={d} className="rounded-xl border bg-card p-4">
            <summary className="cursor-pointer font-semibold">También para la {DOMAIN_LABEL[d].toLowerCase()}</summary>
            <div className="pt-3">
              <TipGrid tips={DOMAIN_TIPS[d]} />
            </div>
          </details>
        ))}
        {!focus && (
          <Button asChild>
            <Link href={`/evaluar/${subjectId}`}>Hacer una prueba</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default async function TipsPage() {
  const { profile } = await requireProfile();
  if (profile.role === "professional") redirect("/inicio");

  const subjects = await getAccessibleSubjects();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Consejos</h1>
        <p className="mt-1 text-muted-foreground">
          Hábitos sencillos para cuidar la atención y la memoria.
          {profile.role === "companion" && ` ${COMPANION_NOTE}`}
        </p>
      </div>
      {subjects.length === 0 && (
        <TipGrid tips={GENERAL_TIPS} />
      )}
      {subjects.map(({ subject }) => (
        <SubjectTips
          key={subject.id}
          subjectId={subject.id}
          name={profile.role === "companion" ? subject.display_name : undefined}
        />
      ))}
      <p className="text-xs text-muted-foreground">
        Son recomendaciones generales de bienestar, no un tratamiento. Si notas cambios fuertes o repentinos en tu memoria
        o atención, consulta a un profesional de la salud.
      </p>
    </div>
  );
}
