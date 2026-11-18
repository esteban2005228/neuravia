import type { Metadata } from "next";
import Link from "next/link";

import { ResultsList } from "@/components/results-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccessibleSubjects, getOwnSubject, requireProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Inicio" };

export default async function HomePage() {
  const { profile } = await requireProfile();

  if (profile.role === "patient") {
    const subject = await getOwnSubject();
    return (
      <div className="space-y-8">
        <section className="aurora rounded-2xl border p-6 sm:p-8">
          <h1 className="text-2xl font-semibold sm:text-3xl">Hola, {profile.display_name}</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Cada prueba dura de 3 a 5 minutos. Busca un lugar tranquilo y sin distracciones.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {subject && (
              <Button asChild size="lg">
                <Link href={`/evaluar/${subject.id}`}>Hacer una prueba</Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline">
              <Link href="/vincular">Vincular a mi doctor o familiar</Link>
            </Button>
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Mis resultados</h2>
          {subject && <ResultsList subjectId={subject.id} />}
        </section>
      </div>
    );
  }

  const subjects = await getAccessibleSubjects();
  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Hola, {profile.display_name}</h1>
          <p className="mt-1 text-muted-foreground">
            {profile.role === "professional" ? "Tus pacientes vinculados." : "Las personas a las que acompañas."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/vincular">Canjear código</Link>
          </Button>
          {profile.role === "companion" && (
            <Button asChild variant="outline">
              <Link href="/pacientes/nuevo">Registrar paciente sin correo</Link>
            </Button>
          )}
        </div>
      </section>

      {subjects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aún no tienes pacientes vinculados</CardTitle>
            <CardDescription>
              Pide al paciente que genere un código en su cuenta (Vincular) y escríbelo aquí.
              {profile.role === "companion" && " Si la persona no tiene correo, puedes registrarla tú en su presencia."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {subjects.map(({ subject }) => (
            <Card key={subject.id}>
              <CardHeader>
                <CardTitle>{subject.display_name}</CardTitle>
                <CardDescription>
                  {new Date().getFullYear() - subject.birth_year} años aprox. · {subject.education_years} años de estudio
                  {subject.user_id === null && " · sin cuenta propia"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="secondary">
                  <Link href={`/evaluar/${subject.id}`}>Ver resultados y aplicar prueba</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
