import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { type ReactNode, useRef } from "react";

/* ───── Standard variants ───── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};

const slideLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
};

const slideRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
};

/* ───── 3-D variants ───── */
const rotate3DLeft: Variants = {
  hidden: { opacity: 0, rotateY: 25, x: -60, scale: 0.9 },
  visible: { opacity: 1, rotateY: 0, x: 0, scale: 1 },
};

const rotate3DRight: Variants = {
  hidden: { opacity: 0, rotateY: -25, x: 60, scale: 0.9 },
  visible: { opacity: 1, rotateY: 0, x: 0, scale: 1 },
};

const flipUp: Variants = {
  hidden: { opacity: 0, rotateX: 30, y: 60, scale: 0.92 },
  visible: { opacity: 1, rotateX: 0, y: 0, scale: 1 },
};

const zoomRotate: Variants = {
  hidden: { opacity: 0, scale: 0.7, rotate: -6 },
  visible: { opacity: 1, scale: 1, rotate: 0 },
};

const springBounce: Variants = {
  hidden: { opacity: 0, y: 60, scale: 0.9 },
  // @ts-expect-error per-variant transition override is valid
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 280, damping: 18 } },
};

export const variants = {
  fadeUp,
  fadeIn,
  scaleIn,
  slideLeft,
  slideRight,
  rotate3DLeft,
  rotate3DRight,
  flipUp,
  zoomRotate,
  springBounce,
};

/* ───── ScrollReveal ───── */
interface ScrollRevealProps {
  children: ReactNode;
  variant?: keyof typeof variants;
  delay?: number;
  duration?: number;
  className?: string;
}

export const ScrollReveal = ({
  children,
  variant = "fadeUp",
  delay = 0,
  duration = 0.6,
  className,
}: ScrollRevealProps) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
    variants={variants[variant]}
    transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
    className={className}
    style={{ perspective: 1000, transformStyle: "preserve-3d" }}
  >
    {children}
  </motion.div>
);

/* ───── StaggerContainer ───── */
export const StaggerContainer = ({
  children,
  className,
  staggerDelay = 0.1,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
    transition={{ staggerChildren: staggerDelay }}
    className={className}
    style={{ perspective: 1200, transformStyle: "preserve-3d" }}
  >
    {children}
  </motion.div>
);

/* ───── StaggerItem ───── */
export const StaggerItem = ({
  children,
  className,
  variant = "fadeUp",
}: {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof variants;
}) => (
  <motion.div
    variants={variants[variant]}
    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    className={className}
    style={{ transformStyle: "preserve-3d" }}
  >
    {children}
  </motion.div>
);

/* ───── Parallax scroll wrapper ───── */
export const ParallaxSection = ({
  children,
  className,
  speed = 0.15,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * 100}px`, `-${speed * 100}px`]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
};
