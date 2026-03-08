import { Search, Users, MessageCircle, CalendarCheck, MapPin } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

const steps = [
  { icon: Search, title: "Search Tutors", desc: "Enter your subject, location, and grade level to find nearby tutors." },
  { icon: MapPin, title: "Find Nearby", desc: "Discover qualified tutors in your local area using location-based search." },
  { icon: Users, title: "Compare Tutors", desc: "View profiles, ratings, experience, and reviews side by side." },
  { icon: MessageCircle, title: "Contact Tutor", desc: "Message tutors directly through the platform." },
  { icon: CalendarCheck, title: "Schedule Session", desc: "Arrange convenient offline tutoring sessions." },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-muted/50 py-20">
      <div className="container">
        <ScrollReveal>
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">How Tutor Quest Works</h2>
            <p className="mt-3 text-muted-foreground">Get started in four simple steps</p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.15}>
          {steps.map((s, i) => (
            <StaggerItem key={s.title} variant="scaleIn">
              <div className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="absolute right-0 top-10 hidden h-0.5 w-full translate-x-1/2 bg-border lg:block" />
                )}
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                  <s.icon className="h-9 w-9 text-primary" />
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default HowItWorks;
