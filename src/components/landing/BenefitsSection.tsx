import { CheckCircle2, ArrowRight } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import { motion } from "framer-motion";

const studentBenefits = [
  "Find trusted, verified tutors near you",
  "Personalized one-on-one learning support",
  "Transparent pricing with secure payments",
  "Improve academic performance with expert help",
];

const tutorBenefits = [
  "Reach local students effortlessly",
  "Set your own rates and schedule",
  "Get paid securely with escrow protection",
  "Build reputation through verified reviews",
];

const BenefitsSection = () => {
  return (
    <section className="border-y bg-secondary/30 py-24 md:py-32">
      <div className="container">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-body-sm font-semibold uppercase tracking-widest text-accent">Benefits</p>
            <h2 className="mt-3 text-display text-foreground">Why choose Tutor Quest?</h2>
            <p className="mt-4 text-body-lg text-muted-foreground">
              Built for both sides of the learning equation.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          <ScrollReveal variant="slideLeft" delay={0.1}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="rounded-2xl border bg-card p-10 shadow-card"
            >
              <div className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-body-sm font-semibold text-primary">
                For Students
              </div>
              <ul className="mt-8 space-y-5">
                {studentBenefits.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <span className="text-body text-foreground">{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </ScrollReveal>

          <ScrollReveal variant="slideRight" delay={0.1}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="rounded-2xl border bg-card p-10 shadow-card"
            >
              <div className="inline-flex rounded-full bg-accent/10 px-4 py-1.5 text-body-sm font-semibold text-accent-foreground">
                For Tutors
              </div>
              <ul className="mt-8 space-y-5">
                {tutorBenefits.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <span className="text-body text-foreground">{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
