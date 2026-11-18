"use client";

import { useActionState } from "react";

import { redeemLinkCode } from "@/app/actions/links";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RedeemForm() {
  const [state, action] = useActionState(redeemLinkCode, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Código del paciente</Label>
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
      <FormMessage state={state} />
      <SubmitButton>Vincular</SubmitButton>
    </form>
  );
}
