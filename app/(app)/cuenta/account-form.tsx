"use client";

import { useActionState } from "react";

import { updateAccount } from "@/app/actions/account";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountForm({ displayName }: { displayName: string }) {
  const [state, action] = useActionState(updateAccount, undefined);
  return (
    <form action={action} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Nombre</Label>
        <Input id="displayName" name="displayName" defaultValue={displayName} maxLength={80} required />
      </div>
      <FormMessage state={state} />
      <SubmitButton variant="secondary">Guardar cambios</SubmitButton>
    </form>
  );
}
