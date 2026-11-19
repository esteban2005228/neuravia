import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Domain } from "./content";

export type DomainScore = { domain: Domain; score: number };

/** Latest index per domain for a subject, lowest first. Empty if no results yet. */
export async function domainScores(subjectId: string): Promise<DomainScore[]> {
  const supabase = await createClient();
  const { data: runs } = await supabase
    .from("task_runs")
    .select("index_score, completed_at, tasks!inner(domain), assessments!inner(subject_id)")
    .eq("assessments.subject_id", subjectId)
    .order("completed_at", { ascending: false })
    .limit(50);

  const latest = new Map<Domain, number>();
  for (const run of runs ?? []) {
    const domain = run.tasks.domain as Domain;
    if (!latest.has(domain)) latest.set(domain, Number(run.index_score));
  }
  return [...latest.entries()].map(([domain, score]) => ({ domain, score })).sort((a, b) => a.score - b.score);
}
