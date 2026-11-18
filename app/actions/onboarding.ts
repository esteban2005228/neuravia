"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { friendlyError, type FormState } from "@/lib/errors";
import { NOTICE_VERSION } from "@/lib/privacy";
import { createClient } from "@/lib/supabase/server";

const currentYear = new Date().getFullYear();

const patientFields = {
  birthYear: z.coerce
    .number()
    .int()
    .min(currentYear - 45, "Neuravia está diseñada para personas de 18 a 45 años.")
    .max(currentYear - 18, "Neuravia está diseñada para personas de 18 a 45 años."),
  educationYears: z.coerce.number().int().min(0).max(30, "Escribe los años de estudio, de 0 a 30."),
};

const base = z.object({
  role: z.enum(["patient", "professional", "companion"]),
  displayName: z.string().trim().min(1, "Escribe tu nombre.").max(80),
});

export async function completeOnboarding(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = base.safeParse({ role: formData.get("role"), displayName: formData.get("displayName") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();

  if (parsed.data.role === "patient") {
    const patient = z
      .object({
        ...patientFields,
        serviceConsent: z.literal("on", { message: "Para usar Neuravia necesitas aceptar el aviso de privacidad." }),
      })
      .safeParse({
        birthYear: formData.get("birthYear"),
        educationYears: formData.get("educationYears"),
        serviceConsent: formData.get("serviceConsent"),
      });
    if (!patient.success) return { error: patient.error.issues[0].message };

    const { error } = await supabase.rpc("complete_onboarding", {
      p_role: "patient",
      p_display_name: parsed.data.displayName,
      p_birth_year: patient.data.birthYear,
      p_education_years: patient.data.educationYears,
      p_notice_version: NOTICE_VERSION,
      p_research_consent: formData.get("researchConsent") === "on",
    });
    if (error) return { error: friendlyError(error.message) };
  } else {
    if (formData.get("termsAccepted") !== "on") {
      return { error: "Para continuar necesitas aceptar el aviso de privacidad." };
    }
    const { error } = await supabase.rpc("complete_onboarding", {
      p_role: parsed.data.role,
      p_display_name: parsed.data.displayName,
    });
    if (error) return { error: friendlyError(error.message) };
  }

  redirect("/inicio");
}

/** A companion registers a patient who has no email; the patient accepts consent in person. */
export async function createManagedSubject(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      displayName: z.string().trim().min(1, "Escribe el nombre del paciente.").max(80),
      ...patientFields,
      serviceConsent: z.literal("on", { message: "El paciente debe aceptar el aviso de privacidad para continuar." }),
      patientPresent: z.literal("on", { message: "Confirma que el paciente leyó y aceptó el aviso en persona." }),
    })
    .safeParse({
      displayName: formData.get("displayName"),
      birthYear: formData.get("birthYear"),
      educationYears: formData.get("educationYears"),
      serviceConsent: formData.get("serviceConsent"),
      patientPresent: formData.get("patientPresent"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: subjectId, error } = await supabase.rpc("create_managed_subject", {
    p_display_name: parsed.data.displayName,
    p_birth_year: parsed.data.birthYear,
    p_education_years: parsed.data.educationYears,
    p_notice_version: NOTICE_VERSION,
    p_research_consent: formData.get("researchConsent") === "on",
  });
  if (error || !subjectId) return { error: friendlyError(error?.message) };

  redirect(`/evaluar/${subjectId}`);
}
