"use client";

import { useActionState } from "react";

import { deleteAccount } from "@/app/actions/account";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccount, undefined);
  return (
    <form action={action} className="space-y-3">
      <Label htmlFor="confirm">Escribe BORRAR para confirmar</Label>
      <Input id="confirm" name="confirm" autoComplete="off" className="max-w-xs" />
      <FormMessage state={state} />
      <SubmitButton variant="warning" pendingText="Borrando…">
        Borrar mi cuenta y mis datos
      </SubmitButton>
    </form>
  );
}
