"use client";

import { useActionState } from "react";

import { createManagedSubject } from "@/app/actions/onboarding";
import { ConsentFields } from "@/components/consent/consent-fields";
import { PatientFields } from "@/components/consent/patient-fields";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ManagedSubjectForm() {
  const [state, action] = useActionState(createManagedSubject, undefined);
  return (
    <form action={action} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="displayName">Nombre del paciente</Label>
        <Input id="displayName" name="displayName" maxLength={80} required />
      </div>
      <PatientFields />
      <div className="space-y-3 rounded-xl border border-amber/60 bg-amber/10 p-4">
        <p className="text-sm font-semibold">Entrega el dispositivo al paciente para esta parte.</p>
        <ConsentFields thirdPerson />
      </div>
      <CheckboxField id="patientPresent" name="patientPresent" required>
        Confirmo que el paciente está presente, es mayor de edad, leyó el aviso de privacidad y marcó él mismo las casillas
        anteriores.
      </CheckboxField>
      <FormMessage state={state} />
      <SubmitButton className="w-full">Registrar paciente</SubmitButton>
    </form>
  );
}
