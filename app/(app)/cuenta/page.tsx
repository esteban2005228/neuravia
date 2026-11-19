import type { Metadata } from "next";
import Link from "next/link";

import { setConsent } from "@/app/actions/account";
import { revokeLink } from "@/app/actions/links";
import { ROLE_LABEL } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile, type Subject } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AccountForm } from "./account-form";
import { DeleteAccountForm } from "./delete-account-form";

export const metadata: Metadata = { title: "Mi cuenta" };

const PURPOSE_LABEL = {
  service: "Usar el servicio (obligatorio para hacer pruebas)",
  research: "Investigación con datos sin nombre (opcional)",
} as const;

async function ConsentPanel({ subject }: { subject: Subject }) {
  const supabase = await createClient();
  const { data: consents } = await supabase
    .from("consents")
    .select("purpose, granted_at, revoked_at, method")
    .eq("subject_id", subject.id)
    .is("revoked_at", null);
  const active = new Set((consents ?? []).map((c) => c.purpose));

  return (
    <ul className="divide-y rounded-xl border">
      {(["service", "research"] as const).map((purpose) => {
        const granted = active.has(purpose);
        return (
          <li key={purpose} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{PURPOSE_LABEL[purpose]}</p>
              <Badge variant={granted ? "cyan" : "default"}>{granted ? "Otorgado" : "No otorgado"}</Badge>
            </div>
            <form action={setConsent}>
              <input type="hidden" name="subjectId" value={subject.id} />
              <input type="hidden" name="purpose" value={purpose} />
              <input type="hidden" name="granted" value={granted ? "false" : "true"} />
              <Button type="submit" size="sm" variant={granted ? "outline" : "secondary"}>
                {granted ? "Retirar" : "Otorgar"}
              </Button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}

export default async function AccountPage() {
  const { supabase, user, profile } = await requireProfile();

  const { data: ownSubject } = await supabase.from("subjects").select("*").eq("user_id", user.id).maybeSingle();
  const { data: managed } = await supabase
    .from("subjects")
    .select("*")
    .is("user_id", null)
    .eq("created_by", user.id);
  const { data: links } = await supabase
    .from("links")
    .select("id, relation, created_at, linked_user_id, subjects(display_name, user_id)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Patients see who is linked to them (allowed by the profiles_select_linked_by_patient policy).
  const linkedIds = (links ?? []).map((l) => l.linked_user_id).filter((id) => id !== user.id);
  const { data: linkedProfiles } = linkedIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", linkedIds)
    : { data: [] };
  const nameById = new Map((linkedProfiles ?? []).map((p) => [p.id, p.display_name]));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mi cuenta</CardTitle>
          <CardDescription>
            {profile.display_name} · {ROLE_LABEL[profile.role]} · {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AccountForm key={profile.display_name} displayName={profile.display_name} />
          <Button asChild variant="outline" size="sm">
            <Link href="/cuenta/contrasena">Cambiar contraseña</Link>
          </Button>
        </CardContent>
      </Card>

      {ownSubject && (
        <Card>
          <CardHeader>
            <CardTitle>Mis consentimientos</CardTitle>
            <CardDescription>
              Si retiras el consentimiento del servicio, nadie podrá aplicarte nuevas pruebas.{" "}
              <Link href="/privacidad" className="underline">
                Ver aviso de privacidad
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConsentPanel subject={ownSubject} />
          </CardContent>
        </Card>
      )}

      {(managed ?? []).map((subject) => (
        <Card key={subject.id}>
          <CardHeader>
            <CardTitle>Consentimientos de {subject.display_name}</CardTitle>
            <CardDescription>Cámbialos solo si {subject.display_name} te lo pide.</CardDescription>
          </CardHeader>
          <CardContent>
            <ConsentPanel subject={subject} />
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Vínculos</CardTitle>
          <CardDescription>
            {profile.role === "patient"
              ? "Personas que pueden aplicarte pruebas y ver tus resultados."
              : profile.role === "professional"
                ? "Pacientes a los que puedes aplicar pruebas."
                : "Familiares a los que acompañas."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!links?.length ? (
            <p className="text-muted-foreground">No hay vínculos activos.</p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {links.map((link) => (
                <li key={link.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">
                      {profile.role === "patient"
                        ? `${nameById.get(link.linked_user_id) ?? ""} · ${
                            link.relation === "professional" ? "Profesional" : "Acompañante"
                          }`
                        : link.subjects?.display_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Desde {new Date(link.created_at).toLocaleDateString("es-MX", { dateStyle: "medium" })}
                    </p>
                  </div>
                  {!(profile.role === "companion" && link.subjects?.user_id === null) && (
                    <form action={revokeLink}>
                      <input type="hidden" name="linkId" value={link.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Quitar vínculo
                      </Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-coral/50">
        <CardHeader>
          <CardTitle>Borrar mi cuenta</CardTitle>
          <CardDescription>
            Se borran tu cuenta, tus resultados y tus vínculos de forma permanente.
            {(managed?.length ?? 0) > 0 && " También los familiares que registraste sin correo y sus resultados."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountForm />
        </CardContent>
      </Card>
    </div>
  );
}
