"use client";

import { useState, useTransition } from "react";

import { createLinkCode } from "@/app/actions/links";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function CodeGenerator({ subjectId }: { subjectId?: string }) {
  const [pending, start] = useTransition();
  const [code, setCode] = useState<string>();
  const [error, setError] = useState<string>();

  return (
    <div className="space-y-4">
      {code && (
        <div className="rounded-xl border bg-muted p-6 text-center">
          <p className="text-sm text-muted-foreground">Código (vale 24 horas y un solo uso)</p>
          <p className="mt-2 font-mono text-4xl font-semibold tracking-[0.3em]">
            {code.slice(0, 4)}-{code.slice(4)}
          </p>
        </div>
      )}
      {error && <Alert variant="error">{error}</Alert>}
      <Button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await createLinkCode(subjectId);
            setCode(result?.code);
            setError(result?.error);
          })
        }
      >
        {pending ? "Generando…" : code ? "Generar otro código" : "Generar código"}
      </Button>
    </div>
  );
}
