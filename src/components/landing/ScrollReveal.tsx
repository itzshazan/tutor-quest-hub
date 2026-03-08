import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

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

export const variants = { fadeUp, fadeIn, scaleIn, slideLeft, slideRight };

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
  >
    {children}
  </motion.div>
);

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
  >
    {children}
  </motion.div>
);

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
  >
    {children}
  </motion.div>
);
