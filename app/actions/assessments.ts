"use server";

import { z } from "zod";

import { friendlyError } from "@/lib/errors";
import { TASK_SCORERS, isTaskCode } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";

export async function startAssessment(subjectId: string): Promise<{ assessmentId?: string; error?: string }> {
  const id = z.string().uuid().safeParse(subjectId);
  if (!id.success) return { error: "Paciente no válido." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_assessment", { p_subject_id: id.data });
  if (error || !data) return { error: friendlyError(error?.message) };
  return { assessmentId: data };
}

/**
 * Scores the trials on the server and stores them. The score is always recomputed
 * from the raw responses, so the stored result matches the stored trials.
 */
export async function submitTaskRun(input: {
  assessmentId: string;
  taskCode: string;
  taskVersion: string;
  trials: unknown;
}): Promise<{ runId?: string; error?: string }> {
  const assessmentId = z.string().uuid().safeParse(input.assessmentId);
  if (!assessmentId.success || !isTaskCode(input.taskCode)) return { error: "Datos de la prueba no válidos." };

  let scored;
  try {
    scored = TASK_SCORERS[input.taskCode](input.trials);
  } catch {
    return { error: "No pudimos leer las respuestas de la prueba." };
  }

  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks").select("active").eq("code", input.taskCode).maybeSingle();
  if (!task?.active) return { error: "Esta prueba ya no está disponible." };

  const { data, error } = await supabase
    .from("task_runs")
    .insert({
      assessment_id: assessmentId.data,
      task_code: input.taskCode,
      task_version: z.string().max(20).parse(input.taskVersion),
      trials: scored.trials,
      metrics: scored.metrics,
      raw_score: scored.rawScore,
      index_score: scored.indexScore,
      level: scored.level,
    })
    .select("id")
    .single();
  if (error || !data) return { error: friendlyError(error?.message) };

  await supabase.rpc("complete_assessment", { p_assessment_id: assessmentId.data });
  return { runId: data.id };
}
