import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full hd-wobbly-sm border-2 border-hd-ink bg-white px-4 py-3 font-patrick text-base text-hd-ink ring-offset-white placeholder:text-hd-ink/40 focus-visible:outline-none focus-visible:border-hd-blue focus-visible:ring-2 focus-visible:ring-hd-blue/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
