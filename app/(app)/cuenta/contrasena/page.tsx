import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Cambiar contraseña" };

export default function PasswordPage() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Cambiar contraseña</CardTitle>
      </CardHeader>
      <CardContent>
        <PasswordForm />
      </CardContent>
    </Card>
  );
}
