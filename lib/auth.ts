import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Profile = Tables<"profiles">;
export type Subject = Tables<"subjects">;

/** Current user or redirect to login. Cached per request. */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
});

/** Current user's profile, or redirect to onboarding if they haven't finished it. */
export const requireProfile = cache(async () => {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/onboarding");
  return { supabase, user, profile };
});

/** The patient's own subject row (only for role = patient). */
export async function getOwnSubject(): Promise<Subject | null> {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("subjects").select("*").eq("user_id", user.id).maybeSingle();
  return data;
}

/** Subjects the current user can evaluate: their own (patient) or active links. */
export async function getAccessibleSubjects() {
  const { supabase, user, profile } = await requireProfile();
  if (profile.role === "patient") {
    const own = await getOwnSubject();
    return own ? [{ subject: own, relation: "self" as const, kinship: null, linkId: null }] : [];
  }
  const { data } = await supabase
    .from("links")
    .select("id, relation, kinship, subjects(*)")
    .eq("linked_user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  return (data ?? [])
    .filter((l) => l.subjects)
    .map((l) => ({ subject: l.subjects as Subject, relation: l.relation, kinship: l.kinship, linkId: l.id }));
}
