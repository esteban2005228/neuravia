import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function ResetPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperar contraseña</CardTitle>
        <CardDescription>Te enviaremos un enlace para crear una nueva.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetForm />
      </CardContent>
    </Card>
  );
}
