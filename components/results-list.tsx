import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { LEVEL_LABELS } from "@/lib/scoring/levels";
import { createClient } from "@/lib/supabase/server";

const MODE_LABEL = { self: "Autoaplicada", professional: "Con profesional", companion: "Con acompañante" } as const;

export async function ResultsList({ subjectId, limit = 10 }: { subjectId: string; limit?: number }) {
  const supabase = await createClient();
  const { data: runs } = await supabase
    .from("task_runs")
    .select("id, index_score, level, completed_at, tasks(name), assessments!inner(subject_id, mode)")
    .eq("assessments.subject_id", subjectId)
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (!runs?.length) {
    return <p className="text-muted-foreground">Todavía no hay resultados.</p>;
  }

  return (
    <ul className="glass divide-y divide-white/60 rounded-2xl">
      {runs.map((run) => {
        const level = LEVEL_LABELS[run.level];
        return (
          <li key={run.id}>
            <Link href={`/resultados/${run.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-muted">
              <div>
                <p className="font-semibold">{run.tasks?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(run.completed_at).toLocaleDateString("es-MX", { dateStyle: "medium" })} ·{" "}
                  {MODE_LABEL[run.assessments.mode]}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">{Math.round(Number(run.index_score))}</span>
                <Badge variant={level.tone}>{level.label}</Badge>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
