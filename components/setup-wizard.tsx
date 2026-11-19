"use client";

import Link from "next/link";
import {
  startTransition,
  useActionState,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { ConsentFields } from "@/components/consent/consent-fields";
import { BirthYearField } from "@/components/consent/patient-fields";
import { FormMessage } from "@/components/form-bits";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/errors";
import { cn } from "@/lib/utils";

type Role = "patient" | "professional" | "companion";

const ROLES: { value: Role; title: string; text: string }[] = [
  {
    value: "patient",
    title: "Paciente",
    text: "Quiero hacer las pruebas y ver mis resultados.",
  },
  {
    value: "professional",
    title: "Profesional",
    text: "Soy doctor o psicólogo y aplicaré pruebas a mis pacientes.",
  },
  {
    value: "companion",
    title: "Acompañante",
    text: "Soy familiar y ayudaré a alguien a hacer las pruebas.",
  },
];

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/**
 * One question per screen: role → name (+ birth year) → privacy → (account).
 * All steps stay mounted so the final submit sends every field. The action is
 * called manually instead of through `<form action>` so React does not reset
 * the inputs when the server returns an error.
 */
export function SetupWizard({
  action: serverAction,
  withAccount = false,
  submitLabel = "Continuar",
}: {
  action: Action;
  withAccount?: boolean;
  submitLabel?: string;
}) {
  const [state, action, pending] = useActionState(serverAction, undefined);
  const [role, setRole] = useState<Role>("patient");
  const [step, setStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const steps = [
    "¿Cómo usarás Neuravia?",
    "Tus datos",
    "Aviso de privacidad",
    ...(withAccount ? ["Tu cuenta"] : []),
  ];
  const last = step === steps.length - 1;

  function stepIsValid(i: number) {
    const fields =
      stepRefs.current[i]?.querySelectorAll<HTMLInputElement>("input") ?? [];
    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    return true;
  }

  function next() {
    if (stepIsValid(step)) setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!last) return next();
    for (let i = 0; i < steps.length; i++) {
      if (!stepIsValid(i)) {
        setStep(i);
        return;
      }
    }
    const formData = new FormData(e.currentTarget);
    startTransition(() => action(formData));
  }

  if (state?.ok) return <FormMessage state={state} />;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Paso {step + 1} de {steps.length}
        </p>
        <div className="flex gap-2" aria-hidden="true">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-white/60",
              )}
            />
          ))}
        </div>
        <h2 className="pt-2 text-lg font-semibold">{steps[step]}</h2>
      </div>

      <div
        ref={(el) => {
          stepRefs.current[0] = el;
        }}
        hidden={step !== 0}
      >
        <fieldset
          className={cn("grid gap-3", withAccount ? "" : "sm:grid-cols-3")}
        >
          <legend className="sr-only">{steps[0]}</legend>
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={cn(
                "cursor-pointer rounded-xl border bg-card p-4 transition-colors",
                role === r.value
                  ? "border-primary ring-2 ring-ring"
                  : "hover:bg-white/70",
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

      <div
        ref={(el) => {
          stepRefs.current[1] = el;
        }}
        hidden={step !== 1}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="displayName">
            {role === "professional"
              ? "Nombre con el que te verán tus pacientes"
              : "Tu nombre"}
          </Label>
          <Input
            id="displayName"
            name="displayName"
            autoComplete="name"
            maxLength={80}
            required
          />
        </div>
        {role === "patient" && <BirthYearField />}
      </div>

      <div
        ref={(el) => {
          stepRefs.current[2] = el;
        }}
        hidden={step !== 2}
      >
        {role === "patient" ? (
          <ConsentFields />
        ) : (
          <CheckboxField id="termsAccepted" name="termsAccepted" required>
            Leí el{" "}
            <Link
              href="/privacidad"
              target="_blank"
              className="font-semibold text-primary underline"
            >
              aviso de privacidad
            </Link>{" "}
            y me comprometo a usar los resultados de mis pacientes solo para su
            cuidado.
          </CheckboxField>
        )}
      </div>

      {withAccount && (
        <div
          ref={(el) => {
            stepRefs.current[3] = el;
          }}
          hidden={step !== 3}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <p className="text-sm text-muted-foreground">
              Mínimo 8 caracteres. Te enviaremos un correo para confirmarla.
            </p>
          </div>
        </div>
      )}

      <FormMessage state={state} />

      <div className="flex gap-3">
        {step > 0 && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setStep((s) => s - 1)}
          >
            Atrás
          </Button>
        )}
        {last ? (
          <Button type="submit" className="flex-1" disabled={pending}>
            {pending ? "Un momento…" : submitLabel}
          </Button>
        ) : (
          <Button type="button" className="flex-1" onClick={next}>
            Siguiente
          </Button>
        )}
      </div>
    </form>
  );
}
