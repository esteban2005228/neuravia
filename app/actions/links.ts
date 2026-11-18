"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { friendlyError, type FormState } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export type CodeState = { code?: string; error?: string } | undefined;

export async function createLinkCode(): Promise<CodeState> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_link_code");
  if (error || !data) return { error: friendlyError(error?.message) };
  return { code: data };
}

export async function redeemLinkCode(_: FormState, formData: FormData): Promise<FormState> {
  const code = z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{8}$/, "El código tiene 8 letras y números.")
    .safeParse(String(formData.get("code") ?? "").replace(/[\s-]/g, ""));
  if (!code.success) return { error: code.error.issues[0].message };

  const supabase = await createClient();
  const { data: subjectId, error } = await supabase.rpc("redeem_link_code", { p_code: code.data });
  if (error || !subjectId) return { error: friendlyError(error?.message) };
  redirect(`/evaluar/${subjectId}`);
}

export async function revokeLink(formData: FormData) {
  const linkId = z.string().uuid().parse(formData.get("linkId"));
  const supabase = await createClient();
  await supabase.rpc("revoke_link", { p_link_id: linkId });
  revalidatePath("/cuenta");
  revalidatePath("/inicio");
}
