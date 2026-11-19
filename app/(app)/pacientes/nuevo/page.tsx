import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccessibleSubjects, requireProfile } from "@/lib/auth";
import { MAX_RELATIVES } from "@/lib/labels";
import { ManagedSubjectForm } from "./managed-form";

export const metadata: Metadata = { title: "Registrar familiar" };

export default async function NewManagedSubjectPage() {
  const { profile } = await requireProfile();
  if (profile.role !== "companion") redirect("/inicio");
  const relatives = await getAccessibleSubjects();
  const full = relatives.length >= MAX_RELATIVES;

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Registrar a un familiar sin correo</CardTitle>
        <CardDescription>
          Para personas que no usan correo o computadora. Tu familiar debe estar contigo y aceptar el aviso de privacidad
          en este dispositivo: el consentimiento es suyo, no tuyo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {full ? (
          <p className="rounded-lg border border-dashed p-4 text-muted-foreground">
            Ya acompañas a {MAX_RELATIVES} familiares, que es el máximo. Para registrar a otra persona, primero quita uno de
            tus vínculos en Mi cuenta.
          </p>
        ) : (
          <ManagedSubjectForm />
        )}
      </CardContent>
    </Card>
  );
}
