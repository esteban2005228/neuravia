import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { ManagedSubjectForm } from "./managed-form";

export const metadata: Metadata = { title: "Registrar familiar" };

export default async function NewManagedSubjectPage() {
  const { profile } = await requireProfile();
  if (profile.role !== "companion") redirect("/inicio");

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
        <ManagedSubjectForm />
      </CardContent>
    </Card>
  );
}
