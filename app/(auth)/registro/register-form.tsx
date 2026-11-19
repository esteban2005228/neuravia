"use client";

import Link from "next/link";

import { signUp } from "@/app/actions/auth";
import { SetupWizard } from "@/components/setup-wizard";

export function RegisterForm() {
  return (
    <div className="space-y-4">
      <SetupWizard action={signUp} withAccount submitLabel="Crear cuenta" />
      <p className="text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Entra aquí
        </Link>
      </p>
    </div>
  );
}
