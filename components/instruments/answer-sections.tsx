import type { AnswerSection } from "@/lib/instruments/answers";
import { cn } from "@/lib/utils";

/** Read-only list of what was answered in each exercise of a run. */
export function AnswerSections({ sections }: { sections: AnswerSection[] }) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section key={section.title} className="space-y-2">
          <h3 className="font-semibold">{section.title}</h3>
          {section.note && <p className="text-sm text-muted-foreground">{section.note}</p>}
          <ul className="divide-y rounded-xl border bg-card">
            {section.rows.map((row, i) => (
              <li key={i} className="flex gap-3 p-3 text-sm">
                <span
                  aria-label={row.ok ? "Correcto" : "Incorrecto"}
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    row.ok ? "bg-cyan/40 text-foreground" : "bg-amber/50 text-amber-foreground",
                  )}
                >
                  {row.ok ? "✓" : "✗"}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p>{row.prompt}</p>
                  <p>
                    <span className="text-muted-foreground">Respuesta: </span>
                    <span className="font-semibold">{row.given}</span>
                  </p>
                  {!row.ok && row.expected && (
                    <p>
                      <span className="text-muted-foreground">Correcta: </span>
                      {row.expected}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
