import { Search, Users, MessageCircle, CalendarCheck } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const steps = [
  { icon: Search, title: "Search", desc: "Enter your subject and location to find nearby qualified tutors." },
  { icon: Users, title: "Compare", desc: "Review profiles, ratings, experience, and verified credentials." },
  { icon: MessageCircle, title: "Connect", desc: "Message tutors directly to discuss your learning goals." },
  { icon: CalendarCheck, title: "Learn", desc: "Book sessions and start personalized learning." },
];

const HowItWorks = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const dotY = useTransform(scrollYProgress, [0, 1], ["0px", "-30px"]);

  return (
    <section ref={sectionRef} id="how-it-works" className="relative overflow-hidden py-24 md:py-32">
      {/* Animated dot grid */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ y: dotY }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--primary) / 0.25) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />
        {/* Fade edges */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      </motion.div>
      <div className="container">
        <ScrollReveal variant="zoomRotate">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-body-sm font-semibold uppercase tracking-widest text-accent">How It Works</p>
            <h2 className="mt-3 text-display text-foreground">Get started in four simple steps</h2>
            <p className="mt-4 text-body-lg text-muted-foreground">
              From search to session — we make finding the right tutor effortless.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.12}>
          {steps.map((s, i) => (
            <StaggerItem key={s.title} variant="flipUp">
              <div className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="absolute right-0 top-8 hidden h-px w-full translate-x-1/2 bg-border lg:block" />
                )}
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary transition-transform duration-300 hover:scale-110 hover:rotate-3">
                  <s.icon className="h-7 w-7 text-primary" />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-body-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default HowItWorks;
