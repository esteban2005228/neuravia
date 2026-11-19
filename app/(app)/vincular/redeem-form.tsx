"use client";

import { useActionState } from "react";

import { redeemLinkCode } from "@/app/actions/links";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import { KinshipField } from "@/components/kinship-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RedeemForm({ role }: { role: "patient" | "professional" | "companion" }) {
  const [state, action] = useActionState(redeemLinkCode, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">{role === "professional" ? "Código del paciente" : "Código de tu familiar"}</Label>
        <Input
          id="code"
          name="code"
          placeholder="ABCD-2345"
          autoComplete="off"
          autoCapitalize="characters"
          className="font-mono text-xl tracking-widest uppercase"
          required
        />
      </div>
      {role === "companion" && <KinshipField label="¿Qué parentesco tienes con esta persona?" />}
      <FormMessage state={state} />
      <SubmitButton>{role === "professional" ? "Vincular paciente" : "Vincular familiar"}</SubmitButton>
    </form>
  );
}
