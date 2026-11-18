import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva("rounded-lg border px-4 py-3 text-sm", {
  variants: {
    variant: {
      info: "border-blue/50 bg-blue/10",
      warning: "border-amber/60 bg-amber/15 text-amber-foreground",
      error: "border-coral/60 bg-coral/15 text-coral-foreground",
      success: "border-cyan/60 bg-cyan/15 text-accent-foreground",
    },
  },
  defaultVariants: { variant: "info" },
});

function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export { Alert };
