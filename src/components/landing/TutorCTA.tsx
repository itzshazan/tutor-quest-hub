import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import { Link } from "react-router-dom";

const TutorCTA = () => {
  return (
    <section id="become-tutor" className="py-24">
      <div className="container">
        <ScrollReveal variant="scaleIn">
          <div className="relative overflow-hidden rounded-3xl px-8 py-20 text-center md:px-16" style={{ background: "var(--cta-gradient)" }}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">Are you a Tutor?</h2>
              <p className="mx-auto mt-4 max-w-lg text-lg text-primary-foreground/80">
                Start teaching students in your area. Join thousands of tutors growing their practice on Tutor Quest.
              </p>
              <Button size="lg" variant="secondary" className="mt-8 gap-2 bg-card text-foreground hover:bg-card/90 shadow-elevated" asChild>
                <Link to="/signup">
                  Become a Tutor <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default TutorCTA;
