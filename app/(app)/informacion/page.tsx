import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Información especializada" };

const SECTIONS = [
  {
    title: "Artículos científicos",
    text: "Lecturas seleccionadas sobre evaluación y entrenamiento de la atención y la memoria.",
  },
  {
    title: "Flashcards de repaso",
    text: "Tarjetas con imágenes para repasar conceptos clave de neuropsicología.",
  },
  {
    title: "Noticias",
    text: "Novedades de fuentes oficiales sobre salud mental y cognición.",
  },
];

export default async function SpecialistInfoPage() {
  const { profile } = await requireProfile();
  if (profile.role !== "professional") redirect("/inicio");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Información especializada</h1>
        <p className="mt-1 text-muted-foreground">Material de consulta para profesionales y estudiantes de la salud mental.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {SECTIONS.map((s) => (
          <Card key={s.title}>
            <CardHeader>
              <CardTitle>{s.title}</CardTitle>
              <CardDescription>{s.text}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Próximamente.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
