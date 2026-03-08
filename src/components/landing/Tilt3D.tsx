import { useRef, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface Tilt3DProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
  scale?: number;
}

export const Tilt3D = ({
  children,
  className,
  intensity = 10,
  glare = true,
  scale = 1.02,
}: Tilt3DProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [intensity, -intensity]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [0, 1], [-intensity, intensity]), {
    stiffness: 300,
    damping: 30,
  });
  const glareX = useTransform(x, [0, 1], ["-100%", "200%"]);
  const glareY = useTransform(y, [0, 1], ["-100%", "200%"]);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  };

  const handleLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileHover={{ scale }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 800,
      }}
      className={className}
    >
      {children}
      {glare && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at var(--gx) var(--gy), hsl(var(--accent) / 0.12), transparent 60%)`,
            // @ts-ignore -- CSS custom properties
            "--gx": glareX,
            "--gy": glareY,
          }}
        />
      )}
    </motion.div>
  );
};

/** Wrap a section to give children a shared perspective origin */
export const Perspective = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={className} style={{ perspective: 1200, perspectiveOrigin: "center" }}>
    {children}
  </div>
);
