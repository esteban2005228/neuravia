import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { CodeGenerator } from "./code-generator";
import { RedeemForm } from "./redeem-form";

export const metadata: Metadata = { title: "Vincular" };

export default async function LinkPage() {
  const { profile } = await requireProfile();

  if (profile.role === "patient") {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Vincular a tu doctor o familiar</CardTitle>
          <CardDescription>
            Genera un código y compártelo con la persona. Al canjearlo podrá aplicarte pruebas y ver tus resultados. Puedes
            quitar el vínculo cuando quieras desde Mi cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeGenerator />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Canjear código de un paciente</CardTitle>
        <CardDescription>
          El paciente genera el código desde su cuenta, en la sección Vincular. El código vale 24 horas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RedeemForm />
      </CardContent>
    </Card>
  );
}
