import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface HandDrawnDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "dashed" uses a CSS dashed border; "wavy" uses an SVG wave path */
  variant?: "dashed" | "wavy";
  color?: string;
}

/**
 * HandDrawnDivider — a rough, sketchy horizontal divider.
 * Use between sections for visual separation that feels hand-crafted.
 */
export const HandDrawnDivider: React.FC<HandDrawnDividerProps> = ({
  className,
  variant = "dashed",
  color = "#2d2d2d",
  style,
  ...props
}) => {
  if (variant === "wavy") {
    return (
      <div
        className={cn("w-full overflow-hidden", className)}
        style={style}
        aria-hidden="true"
        {...props}
      >
        <motion.svg
          viewBox="0 0 400 12"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.path
            d="M0 6 Q25 0 50 6 Q75 12 100 6 Q125 0 150 6 Q175 12 200 6 Q225 0 250 6 Q275 12 300 6 Q325 0 350 6 Q375 12 400 6"
            stroke={color}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.35"
            variants={{
              hidden: { pathLength: 0, opacity: 0 },
              visible: { pathLength: 1, opacity: 0.35, transition: { duration: 1.5, ease: "easeInOut" } }
            }}
          />
        </motion.svg>
      </div>
    );
  }

  return (
    <hr
      className={cn("border-0", className)}
      style={{
        borderTop: `2px dashed ${color}`,
        opacity: 0.25,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
};
