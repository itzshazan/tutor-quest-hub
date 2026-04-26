import * as React from "react";

import { cn } from "@/lib/utils";

type CardDecoration = "tape" | "tape-left" | "tape-right" | "tack" | "none";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  decoration?: CardDecoration;
  postit?: boolean;
  rotate?: number;
  shadowSize?: "sm" | "md" | "lg" | "xl" | "none";
}

const shadowMap = {
  sm:   "3px 3px 0px 0px #2d2d2d",
  md:   "4px 4px 0px 0px #2d2d2d",
  lg:   "6px 6px 0px 0px #2d2d2d",
  xl:   "8px 8px 0px 0px #2d2d2d",
  none: "none",
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, decoration = "none", postit = false, rotate = 0, shadowSize = "md", style, children, ...props }, ref) => {
    const bg = postit ? "#fff9c4" : "#ffffff";
    
    return (
      <div
        ref={ref}
        style={{
          borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px",
          boxShadow: shadowMap[shadowSize],
          transform: rotate ? `rotate(${rotate}deg)` : undefined,
          backgroundColor: bg,
          ...style,
        }}
        className={cn(
          "relative border-[3px] border-hd-ink text-hd-ink transition-transform duration-100",
          className
        )}
        {...props}
      >
        {/* Decorations */}
        {decoration === "tape" && <div className="hd-tape" aria-hidden="true" />}
        {decoration === "tape-left" && <div className="hd-tape-left" aria-hidden="true" />}
        {decoration === "tape-right" && <div className="hd-tape-right" aria-hidden="true" />}
        {decoration === "tack" && <div className="hd-tack" aria-hidden="true" />}

        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-kalam text-2xl font-bold leading-none tracking-tight text-hd-ink", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("font-patrick text-base text-hd-ink/70", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0 font-patrick text-base", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
