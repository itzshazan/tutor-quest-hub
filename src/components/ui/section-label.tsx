import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  rotate?: number;
  color?: "yellow" | "red" | "white";
}

const colorMap = {
  yellow: { bg: "#fff9c4", border: "#2d2d2d", text: "#2d2d2d" },
  red:    { bg: "#ff4d4d", border: "#2d2d2d", text: "#ffffff" },
  white:  { bg: "#ffffff",  border: "#2d2d2d", text: "#2d2d2d" },
};

const WOBBLY_SM = "120px 8px 100px 8px / 8px 100px 8px 120px";

/**
 * SectionLabel — sticky-note-style section label.
 * Replaces the standard `<p className="uppercase tracking-widest text-accent">` pattern.
 */
export const SectionLabel: React.FC<SectionLabelProps> = ({
  children,
  className,
  rotate = -1,
  color = "yellow",
  style,
  ...props
}) => {
  const { bg, border, text } = colorMap[color];

  return (
    <span
      style={{
        borderRadius: WOBBLY_SM,
        transform: `rotate(${rotate}deg)`,
        backgroundColor: bg,
        borderColor: border,
        color: text,
        boxShadow: "3px 3px 0px 0px #2d2d2d",
        ...style,
      }}
      className={cn(
        "inline-block border-2 px-4 py-1",
        "font-kalam text-sm font-bold",
        "select-none",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};
