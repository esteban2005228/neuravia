import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { isTaskCode } from "@/lib/scoring";
import { TaskRunner } from "./task-runner";

export const metadata: Metadata = { title: "Prueba" };

export default async function TaskPage({ params }: { params: Promise<{ subjectId: string; taskCode: string }> }) {
  const { subjectId, taskCode } = await params;
  if (!isTaskCode(taskCode)) notFound();

  const { supabase, user } = await requireProfile();
  const [{ data: subject }, { data: task }] = await Promise.all([
    supabase.from("subjects").select("id, user_id, display_name").eq("id", subjectId).maybeSingle(),
    supabase.from("tasks").select("name, active").eq("code", taskCode).maybeSingle(),
  ]);
  if (!subject || !task?.active) notFound();

  return (
    <TaskRunner
      subjectId={subject.id}
      subjectName={subject.display_name}
      taskCode={taskCode}
      taskName={task.name}
      isSelf={subject.user_id === user.id}
    />
  );
}
