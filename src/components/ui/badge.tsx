import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border-[2px] border-hd-ink px-2.5 py-0.5 text-sm font-kalam font-bold hd-wobbly-sm shadow-[2px_2px_0px_0px_#2d2d2d] transition-colors focus:outline-none focus:ring-2 focus:ring-hd-ink focus:ring-offset-2 select-none -rotate-1",
  {
    variants: {
      variant: {
        default: "bg-white text-hd-ink",
        secondary: "bg-hd-postit text-hd-ink",
        destructive: "bg-hd-accent text-white",
        outline: "bg-transparent text-hd-ink shadow-none rotate-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
