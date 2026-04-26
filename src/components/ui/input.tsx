import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full hd-wobbly-sm border-2 border-hd-ink bg-white px-4 py-2 font-patrick text-base text-hd-ink ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-hd-ink placeholder:text-hd-ink/40 focus-visible:outline-none focus-visible:border-hd-blue focus-visible:ring-2 focus-visible:ring-hd-blue/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
