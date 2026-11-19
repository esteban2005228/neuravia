import { Lightbulb } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { suggestionsFor, LEVEL_SUMMARY } from "@/lib/instruments/feedback";
import type { Subscale } from "@/lib/instruments/types";
import { LEVEL_LABELS, type ResultLevel } from "@/lib/scoring/levels";
import { cn } from "@/lib/utils";

function barColor(ratio: number) {
  if (ratio >= 0.7) return "bg-gradient-to-r from-cyan to-blue";
  if (ratio >= 0.5) return "bg-amber";
  return "bg-lavender";
}

/** Global %, level, one bar per subtype and suggestions for the weakest areas. */
export function SubscaleResult({
  title,
  date,
  index,
  level,
  subscales,
}: {
  title: string;
  date: string;
  index: number;
  level: ResultLevel;
  subscales: Subscale[];
}) {
  const info = LEVEL_LABELS[level];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="text-muted-foreground">{date}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-5xl font-semibold leading-none">{index}%</span>
          <Badge variant={info.tone} className="text-sm">
            {info.label}
          </Badge>
        </div>
      </div>
      <p className="text-lg">{LEVEL_SUMMARY[level]}</p>

      <ul className="space-y-4">
        {subscales.map((s) => {
          const ratio = s.max ? s.score / s.max : 0;
          return (
            <li key={s.key} className="space-y-1.5">
              <div className="flex justify-between text-base">
                <span>{s.label}</span>
                <span className="font-semibold">
                  {s.score}/{s.max}
                </span>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-muted"
                role="meter"
                aria-label={s.label}
                aria-valuemin={0}
                aria-valuemax={s.max}
                aria-valuenow={s.score}
              >
                <div className={cn("h-full rounded-full", barColor(ratio))} style={{ width: `${Math.max(ratio * 100, 2)}%` }} />
              </div>
            </li>
          );
        })}
      </ul>

      <section className="space-y-3 rounded-xl border bg-muted/50 p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Lightbulb className="size-5 text-primary" aria-hidden="true" />
          Sugerencias para cuidar esta área
        </h2>
        <ul className="list-disc space-y-1.5 pl-6">
          {suggestionsFor(subscales).map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
