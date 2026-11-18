import * as React from "react";

import { cn } from "@/lib/utils";

/** Native checkbox with a label. Never pre-checked: consent must be an active choice. */
function CheckboxField({
  id,
  name,
  required,
  children,
  className,
}: {
  id: string;
  name: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label htmlFor={id} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4", className)}>
      <input id={id} name={name} type="checkbox" required={required} className="mt-1 size-5 accent-primary" />
      <span className="text-sm leading-relaxed">{children}</span>
    </label>
  );
}

export { CheckboxField };
