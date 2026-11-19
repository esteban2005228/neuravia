"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";

import { completeOnboarding } from "@/app/actions/onboarding";
import { ConsentFields } from "@/components/consent/consent-fields";
import { BirthYearField } from "@/components/consent/patient-fields";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import { Button } from "@/components/ui/button";
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

const STEPS = ["¿Cómo usarás Neuravia?", "Tus datos", "Aviso de privacidad"];

/**
 * One question per screen. All steps stay mounted (hidden) so the final submit
 * sends every field; each step is validated before moving on.
 */
export function OnboardingForm() {
  const [state, action] = useActionState(completeOnboarding, undefined);
  const [role, setRole] = useState<Role>("patient");
  const [step, setStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  function next() {
    const fields = stepRefs.current[step]?.querySelectorAll<HTMLInputElement>("input") ?? [];
    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  const last = step === STEPS.length - 1;

  return (
    <form
      action={action}
      className="space-y-6"
      onKeyDown={(e) => {
        // Enter on an early step advances instead of submitting the whole form.
        if (e.key === "Enter" && !last && (e.target as HTMLElement).tagName === "INPUT") {
          e.preventDefault();
          next();
        }
      }}
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Paso {step + 1} de {STEPS.length}
        </p>
        <div className="flex gap-2" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-white/60")}
            />
          ))}
        </div>
        <h2 className="pt-2 text-lg font-semibold">{STEPS[step]}</h2>
      </div>

      <div ref={(el) => { stepRefs.current[0] = el; }} hidden={step !== 0}>
        <fieldset className="grid gap-3 sm:grid-cols-3">
          <legend className="sr-only">{STEPS[0]}</legend>
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={cn(
                "cursor-pointer rounded-xl border bg-card p-4 transition-colors",
                role === r.value ? "border-primary ring-2 ring-ring" : "hover:bg-white/70",
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
        </fieldset>
      </div>

      <div ref={(el) => { stepRefs.current[1] = el; }} hidden={step !== 1} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">
            {role === "professional" ? "Nombre con el que te verán tus pacientes" : "Tu nombre"}
          </Label>
          <Input id="displayName" name="displayName" autoComplete="name" maxLength={80} required />
        </div>
        {role === "patient" && <BirthYearField />}
      </div>

      <div ref={(el) => { stepRefs.current[2] = el; }} hidden={step !== 2}>
        {role === "patient" ? (
          <ConsentFields />
        ) : (
          <CheckboxField id="termsAccepted" name="termsAccepted" required>
            Leí el{" "}
            <Link href="/privacidad" target="_blank" className="font-semibold text-primary underline">
              aviso de privacidad
            </Link>{" "}
            y me comprometo a usar los resultados de mis pacientes solo para su cuidado.
          </CheckboxField>
        )}
      </div>

      <FormMessage state={state} />

      <div className="flex gap-3">
        {step > 0 && (
          <Button type="button" variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
            Atrás
          </Button>
        )}
        {last ? (
          <SubmitButton className="flex-1">Continuar</SubmitButton>
        ) : (
          <Button type="button" className="flex-1" onClick={next}>
            Siguiente
          </Button>
        )}
      </div>
    </form>
  );
}
