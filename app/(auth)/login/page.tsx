import type { Metadata } from "next";

import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

const LINK_ERRORS: Record<string, string> = {
  confirm:
    "Ese enlace ya se usó o expiró. Si ya lo habías abierto, tu correo quedó confirmado: entra con tu correo y contraseña.",
  recovery: "El enlace para cambiar la contraseña ya se usó o expiró. Pide uno nuevo en «Olvidé mi contraseña».",
  link: "El enlace no es válido o ya expiró. Inténtalo de nuevo.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="error">{LINK_ERRORS[error] ?? LINK_ERRORS.link}</Alert>}
        <LoginForm next={next} />
      </CardContent>
    </Card>
  );
}
