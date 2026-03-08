import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ScrollReveal, ParallaxSection } from "./ScrollReveal";
import { Link } from "react-router-dom";

const TutorCTA = () => {
  return (
    <section id="become-tutor" className="py-24 md:py-32">
      <div className="container">
        <ScrollReveal variant="zoomRotate" duration={0.7}>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-20 text-center md:px-16">
            {/* Parallax decorative elements */}
            <ParallaxSection speed={0.25} className="pointer-events-none absolute -left-24 -top-24">
              <div className="h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
            </ParallaxSection>
            <ParallaxSection speed={0.35} className="pointer-events-none absolute -bottom-24 -right-24">
              <div className="h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
            </ParallaxSection>

            <div className="relative mx-auto max-w-2xl">
              <p className="text-body-sm font-semibold uppercase tracking-widest text-accent">
                For Educators
              </p>
              <h2 className="mt-4 text-display text-primary-foreground">
                Start teaching students in your area
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-body-lg text-primary-foreground/70">
                Join thousands of tutors growing their practice on Tutor Quest. Set your own rates, schedule, and teaching preferences.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="gap-2 rounded-full bg-accent px-8 text-accent-foreground hover:bg-accent/90"
                  asChild
                >
                  <Link to="/signup">
                    Become a Tutor <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-primary-foreground/20 px-8 text-primary-foreground hover:bg-primary-foreground/10"
                  asChild
                >
                  <Link to="/find-tutors">Browse Tutors</Link>
                </Button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default TutorCTA;
