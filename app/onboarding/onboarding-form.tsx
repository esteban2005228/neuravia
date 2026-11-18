"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { completeOnboarding } from "@/app/actions/onboarding";
import { ConsentFields } from "@/components/consent/consent-fields";
import { PatientFields } from "@/components/consent/patient-fields";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Role = "patient" | "professional" | "companion";

const ROLES: { value: Role; title: string; text: string }[] = [
  { value: "patient", title: "Paciente", text: "Quiero hacer las pruebas y ver mis resultados." },
  { value: "professional", title: "Profesional", text: "Soy doctor o psicólogo y aplicaré pruebas a mis pacientes." },
  { value: "companion", title: "Acompañante", text: "Soy familiar y ayudaré a alguien a hacer las pruebas." },
];

export function OnboardingForm() {
  const [state, action] = useActionState(completeOnboarding, undefined);
  const [role, setRole] = useState<Role>("patient");

  return (
    <form action={action} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold">¿Cómo usarás Neuravia?</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={cn(
                "cursor-pointer rounded-xl border bg-card p-4 transition-colors",
                role === r.value ? "border-primary ring-2 ring-ring" : "hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
                className="sr-only"
              />
              <span className="block font-semibold">{r.title}</span>
              <span className="text-sm text-muted-foreground">{r.text}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="displayName">{role === "professional" ? "Nombre con el que te verán tus pacientes" : "Tu nombre"}</Label>
        <Input id="displayName" name="displayName" autoComplete="name" maxLength={80} required />
      </div>

      {role === "patient" ? (
        <>
          <PatientFields />
          <ConsentFields />
        </>
      ) : (
        <CheckboxField id="termsAccepted" name="termsAccepted" required>
          Leí el{" "}
          <Link href="/privacidad" target="_blank" className="font-semibold text-primary underline">
            aviso de privacidad
          </Link>{" "}
          y me comprometo a usar los resultados de mis pacientes solo para su cuidado.
        </CheckboxField>
      )}

      <FormMessage state={state} />
      <SubmitButton className="w-full">Continuar</SubmitButton>
    </form>
  );
}
