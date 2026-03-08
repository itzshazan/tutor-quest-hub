import { CheckCircle2 } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const studentBenefits = [
  "Find trusted tutors easily",
  "Personalized learning support",
  "Improve academic performance",
];

const tutorBenefits = [
  "Reach local students",
  "Increase teaching opportunities",
  "Build reputation through reviews",
];

const BenefitsSection = () => {
  return (
    <section className="py-24">
      <div className="container">
        <ScrollReveal>
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Benefits</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">Why Choose Tutor Quest?</h2>
            <p className="mt-3 text-muted-foreground">Benefits for everyone on the platform</p>
          </div>
        </ScrollReveal>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          <ScrollReveal variant="slideLeft" delay={0.1}>
            <div className="rounded-3xl border-0 bg-card p-10 shadow-neumorphic">
              <h3 className="font-display text-xl font-bold text-primary">For Students</h3>
              <ul className="mt-6 space-y-5">
                {studentBenefits.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-foreground">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="slideRight" delay={0.1}>
            <div className="rounded-3xl border-0 bg-card p-10 shadow-neumorphic">
              <h3 className="font-display text-xl font-bold text-primary">For Tutors</h3>
              <ul className="mt-6 space-y-5">
                {tutorBenefits.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-foreground">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
