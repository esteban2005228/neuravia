import type { Metadata } from "next";

import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="error">El enlace no es válido o ya expiró. Inténtalo de nuevo.</Alert>}
        <LoginForm next={next} />
      </CardContent>
    </Card>
  );
}
