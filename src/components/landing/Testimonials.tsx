import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

const testimonials = [
  {
    quote: "Tutor Quest helped me find a great math tutor near my home. My grades improved from C to A+ in just three months!",
    name: "Arjun K.",
    role: "Student, Grade 11",
    initials: "AK",
    rating: 5,
  },
  {
    quote: "It saved us hours of searching for a reliable tutor. The verified profiles and reviews gave us complete confidence.",
    name: "Sunita M.",
    role: "Parent",
    initials: "SM",
    rating: 5,
  },
  {
    quote: "I started receiving student requests within days of signing up. The escrow payment system ensures I always get paid on time.",
    name: "Deepak R.",
    role: "Physics Tutor",
    initials: "DR",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-body-sm font-semibold uppercase tracking-widest text-accent">Testimonials</p>
            <h2 className="mt-3 text-display text-foreground">Loved by students and tutors</h2>
            <p className="mt-4 text-body-lg text-muted-foreground">
              Real stories from our growing community.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="mt-16 grid gap-6 md:grid-cols-3" staggerDelay={0.12}>
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <div className="flex h-full flex-col rounded-2xl border bg-card p-8 shadow-card">
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>

                {/* Quote */}
                <p className="mt-4 flex-1 text-body text-foreground leading-relaxed">
                  "{t.quote}"
                </p>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3 border-t pt-6">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                      {t.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-body-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default Testimonials;
