"use client";

import { useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/errors";

export function SubmitButton({
  children,
  pendingText = "Un momento…",
  className,
  variant,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  variant?: "default" | "secondary" | "outline" | "warning";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={className} variant={variant}>
      {pending ? pendingText : children}
    </Button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state?.error) return <Alert variant="error">{state.error}</Alert>;
  if (state?.ok) return <Alert variant="success">{state.ok}</Alert>;
  return null;
}
