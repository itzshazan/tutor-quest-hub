import { MapPin, ShieldCheck, MessageSquare, Calendar } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import { Tilt3D } from "./Tilt3D";

const features = [
  {
    icon: MapPin,
    title: "Location-Based Search",
    desc: "Find tutors near your location with distance-aware search and map-based discovery.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Profiles",
    desc: "Every tutor is vetted with verified education credentials, experience, and authentic ratings.",
  },
  {
    icon: MessageSquare,
    title: "Direct Communication",
    desc: "Message tutors directly through the platform to discuss learning needs before booking.",
  },
  {
    icon: Calendar,
    title: "Flexible Scheduling",
    desc: "Schedule sessions based on mutual availability with automated reminders.",
  },
];

const PlatformFeatures = () => {
  return (
    <section className="border-y bg-secondary/30 py-24 md:py-32">
      <div className="container">
        <ScrollReveal variant="flipUp">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-body-sm font-semibold uppercase tracking-widest text-accent">Platform Features</p>
            <h2 className="mt-3 text-display text-foreground">Everything you need for better learning</h2>
            <p className="mt-4 text-body-lg text-muted-foreground">
              A complete platform built for a seamless tutoring experience.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.08}>
          {features.map((f) => (
            <StaggerItem key={f.title} variant="flipUp">
              <Tilt3D intensity={8} className="group h-full rounded-2xl border bg-card p-8 shadow-card transition-shadow hover:shadow-card-hover">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform duration-300 group-hover:scale-110" style={{ transform: "translateZ(30px)" }}>
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground" style={{ transform: "translateZ(20px)" }}>{f.title}</h3>
                <p className="mt-2 text-body-sm text-muted-foreground leading-relaxed" style={{ transform: "translateZ(10px)" }}>{f.desc}</p>
              </Tilt3D>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default PlatformFeatures;
