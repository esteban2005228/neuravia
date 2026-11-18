"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { friendlyError, type FormState } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

const credentials = z.object({
  email: z.string().trim().email("Escribe un correo válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/inicio";
}

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: friendlyError(error.message) };
  redirect(safeNext(formData.get("next")));
}

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${await siteUrl()}/auth/callback?next=/onboarding` },
  });
  if (error) return { error: friendlyError(error.message) };
  if (data.session) redirect("/onboarding");
  return { ok: "Te enviamos un correo. Abre el enlace para confirmar tu cuenta y continuar." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const email = z.string().trim().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Escribe un correo válido." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/cuenta/contrasena`,
  });
  // Same answer whether or not the account exists, to avoid revealing who is registered.
  return { ok: "Si hay una cuenta con ese correo, te llegará un enlace para cambiar la contraseña." };
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const password = z.string().min(8).safeParse(formData.get("password"));
  if (!password.success) return { error: "La contraseña debe tener al menos 8 caracteres." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { error: friendlyError(error.message) };
  return { ok: "Listo, tu contraseña se actualizó." };
}
