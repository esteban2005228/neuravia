"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signUp } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [state, action] = useActionState(signUp, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <p className="text-sm text-muted-foreground">Mínimo 8 caracteres.</p>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="w-full">Crear cuenta</SubmitButton>
      <p className="text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Entra aquí
        </Link>
      </p>
    </form>
  );
}
