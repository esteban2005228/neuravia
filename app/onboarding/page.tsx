import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Configura tu cuenta" };

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (profile) redirect("/inicio");

  return (
    <div className="aurora flex min-h-screen flex-col items-center px-4 py-10">
      <Logo className="mb-6 w-36" />
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Configura tu cuenta</CardTitle>
          <CardDescription>Solo pedimos lo necesario para interpretar tus resultados.</CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
    </div>
  );
}
