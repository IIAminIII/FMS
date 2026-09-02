import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold leading-none ring-1 ring-inset", {
  variants: {
    variant: {
      default: "bg-primary/10 text-primary ring-primary/20",
      secondary: "bg-secondary text-secondary-foreground ring-border",
      success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      warning: "bg-amber-50 text-amber-700 ring-amber-200",
      danger: "bg-red-50 text-red-700 ring-red-200",
      info: "bg-sky-50 text-sky-700 ring-sky-200",
      outline: "bg-transparent text-foreground ring-border",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
