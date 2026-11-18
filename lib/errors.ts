/** Maps database/auth error messages to friendly Spanish text. */
const MESSAGES: Record<string, string> = {
  subject_age_out_of_range: "Neuravia está diseñada para personas de 18 a 45 años.",
  only_companions: "Solo un Acompañante puede registrar a un paciente sin correo.",
  only_patients: "Solo los pacientes pueden generar un código de vinculación.",
  only_professionals_or_companions: "Solo un Profesional o un Acompañante puede canjear un código.",
  invalid_or_expired_code: "El código no es válido o ya expiró. Pide uno nuevo al paciente.",
  link_not_found: "Ese vínculo ya no está activo.",
  not_allowed: "No tienes permiso para hacer esto.",
  consent_required: "Falta el consentimiento del paciente para usar el servicio.",
  patient_data_required: "Faltan datos del paciente.",
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "User already registered": "Ya existe una cuenta con ese correo.",
  "Email not confirmed": "Confirma tu correo con el enlace que te enviamos antes de entrar.",
  "email rate limit exceeded":
    "Enviamos demasiados correos en poco tiempo. Espera unos minutos e inténtalo de nuevo.",
  over_email_send_rate_limit:
    "Enviamos demasiados correos en poco tiempo. Espera unos minutos e inténtalo de nuevo.",
  "For security purposes, you can only request this after":
    "Espera unos segundos antes de pedir otro correo.",
  "Password should be at least": "La contraseña es demasiado corta.",
  weak_password: "La contraseña es demasiado débil. Usa al menos 8 caracteres con letras y números.",
};

export function friendlyError(message: string | undefined | null): string {
  if (!message) return "Algo salió mal. Inténtalo de nuevo.";
  for (const [key, text] of Object.entries(MESSAGES)) {
    if (message.includes(key)) return text;
  }
  if (message.includes("duplicate key") && message.includes("profiles_pkey")) {
    return "Tu cuenta ya está configurada.";
  }
  return "Algo salió mal. Inténtalo de nuevo.";
}

export type FormState = { error?: string; ok?: string } | undefined;
