"use client";

import { completeOnboarding } from "@/app/actions/onboarding";
import { SetupWizard } from "@/components/setup-wizard";

/** Fallback for accounts created without the sign-up wizard (e.g. older accounts). */
export function OnboardingForm() {
  return <SetupWizard action={completeOnboarding} />;
}
