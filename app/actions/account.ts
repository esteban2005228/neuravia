"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { friendlyError, type FormState } from "@/lib/errors";
import { NOTICE_VERSION } from "@/lib/privacy";
import { createClient } from "@/lib/supabase/server";

export async function setConsent(formData: FormData) {
  const input = z
    .object({
      subjectId: z.string().uuid(),
      purpose: z.enum(["service", "research"]),
      granted: z.enum(["true", "false"]),
    })
    .parse({
      subjectId: formData.get("subjectId"),
      purpose: formData.get("purpose"),
      granted: formData.get("granted"),
    });

  const supabase = await createClient();
  await supabase.rpc("set_consent", {
    p_subject_id: input.subjectId,
    p_purpose: input.purpose,
    p_granted: input.granted === "true",
    p_notice_version: NOTICE_VERSION,
  });
  revalidatePath("/cuenta");
}

export async function deleteAccount(_: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("confirm") !== "BORRAR") {
    return { error: 'Escribe BORRAR en mayúsculas para confirmar.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: friendlyError(error.message) };
  await supabase.auth.signOut();
  redirect("/?cuenta=borrada");
}
