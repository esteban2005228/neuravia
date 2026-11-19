"use client";

import { useActionState } from "react";

import { requestPasswordReset } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="w-full">Enviar enlace</SubmitButton>
    </form>
  );
}
