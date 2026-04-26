import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap hd-wobbly text-lg font-patrick font-normal transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hd-ink focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-white text-hd-ink border-[3px] border-hd-ink shadow-hd-md hover:bg-hd-accent hover:text-white hover:shadow-hd-hover hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        destructive:
          "bg-hd-accent text-white border-[3px] border-hd-ink shadow-hd-md hover:brightness-110 hover:shadow-hd-hover hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        outline:
          "border-[3px] border-hd-ink bg-transparent hover:bg-hd-muted text-hd-ink shadow-hd-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]",
        secondary:
          "bg-hd-muted text-hd-ink border-[3px] border-hd-ink shadow-hd-md hover:bg-hd-blue hover:text-white hover:shadow-hd-hover hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        ghost: 
          "hover:bg-hd-muted hover:text-hd-ink text-hd-ink",
        link: 
          "text-hd-blue underline-offset-4 hover:underline font-patrick",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-base",
        lg: "h-14 px-10 text-xl",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
