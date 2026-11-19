import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold", {
  variants: {
    variant: {
      default: "bg-secondary text-secondary-foreground",
      cyan: "bg-cyan/40 text-accent-foreground",
      lavender: "bg-lavender/40 text-foreground",
      sand: "bg-sand/50 text-foreground",
      amber: "bg-amber/40 text-amber-foreground",
      coral: "bg-coral/40 text-coral-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
