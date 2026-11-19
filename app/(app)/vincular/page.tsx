import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccessibleSubjects, requireProfile } from "@/lib/auth";
import { KINSHIP_LABEL, MAX_RELATIVES } from "@/lib/labels";
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
            Genera un código y compártelo con la persona. Al usarlo podrá aplicarte pruebas y ver tus resultados. Puedes
            quitar el vínculo cuando quieras desde Mi cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeGenerator />
        </CardContent>
      </Card>
    );
  }

  const isProfessional = profile.role === "professional";
  const relatives = isProfessional ? [] : await getAccessibleSubjects();
  const managed = relatives.filter(({ subject }) => subject.user_id === null);
  const full = relatives.length >= MAX_RELATIVES;

  return (
    <div className="space-y-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{isProfessional ? "Vincular paciente" : "Vincular familiar"}</CardTitle>
          <CardDescription>
            {isProfessional ? "El paciente" : "Tu familiar"} genera un código desde su cuenta, en la sección Vincular.
            Escríbelo aquí; vale 24 horas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isProfessional && full ? (
            <p className="rounded-lg border border-dashed p-4 text-muted-foreground">
              Ya acompañas a {MAX_RELATIVES} familiares, que es el máximo. Para vincular a otra persona, primero quita uno
              de tus vínculos en Mi cuenta.
            </p>
          ) : (
            <RedeemForm role={profile.role} />
          )}
        </CardContent>
      </Card>

      {managed.length > 0 && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Compartir con un doctor u otro familiar</CardTitle>
            <CardDescription>
              Genera un código para que un doctor u otro familiar se vincule con quien registraste sin correo. Hazlo solo
              si tu familiar está de acuerdo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {managed.map(({ subject, kinship }) => (
              <section key={subject.id} className="space-y-3">
                <h3 className="font-semibold">
                  {subject.display_name}
                  {kinship && <span className="font-normal text-muted-foreground"> · {KINSHIP_LABEL[kinship]}</span>}
                </h3>
                <CodeGenerator subjectId={subject.id} />
              </section>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
