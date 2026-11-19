import { z } from "zod";

const AGE_MESSAGE = "Neuravia está diseñada para personas de 18 a 45 años.";

export type SetupData =
  | { role: "patient"; displayName: string; birthYear: number; researchConsent: boolean }
  | { role: "professional" | "companion"; displayName: string };

/** Validates the role, name, birth year and consent steps of the setup wizard. */
export function parseSetup(formData: FormData): { data: SetupData } | { error: string } {
  const currentYear = new Date().getFullYear();
  const base = z
    .object({
      role: z.enum(["patient", "professional", "companion"]),
      displayName: z.string().trim().min(1, "Escribe tu nombre.").max(80),
    })
    .safeParse({ role: formData.get("role"), displayName: formData.get("displayName") });
  if (!base.success) return { error: base.error.issues[0].message };

  if (base.data.role !== "patient") {
    if (formData.get("termsAccepted") !== "on") {
      return { error: "Para continuar necesitas aceptar el aviso de privacidad." };
    }
    return { data: { role: base.data.role, displayName: base.data.displayName } };
  }

  const patient = z
    .object({
      birthYear: z.coerce
        .number({ message: "Escribe tu año de nacimiento." })
        .int()
        .min(currentYear - 45, AGE_MESSAGE)
        .max(currentYear - 18, AGE_MESSAGE),
      serviceConsent: z.literal("on", { message: "Para usar Neuravia necesitas aceptar el aviso de privacidad." }),
    })
    .safeParse({ birthYear: formData.get("birthYear"), serviceConsent: formData.get("serviceConsent") });
  if (!patient.success) return { error: patient.error.issues[0].message };

  return {
    data: {
      role: "patient",
      displayName: base.data.displayName,
      birthYear: patient.data.birthYear,
      researchConsent: formData.get("researchConsent") === "on",
    },
  };
}
