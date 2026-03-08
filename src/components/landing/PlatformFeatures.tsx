import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import featureLocation from "@/assets/feature-location.png";
import featureVerified from "@/assets/feature-verified.png";
import featureChat from "@/assets/feature-chat.png";
import featureSchedule from "@/assets/feature-schedule.png";

const features = [
  { image: featureLocation, title: "Location-Based Search", desc: "Find tutors near your location with distance-aware search results." },
  { image: featureVerified, title: "Verified Profiles", desc: "Every profile includes education, experience, and authentic ratings." },
  { image: featureChat, title: "Direct Communication", desc: "Message tutors directly to discuss your learning needs." },
  { image: featureSchedule, title: "Flexible Scheduling", desc: "Schedule sessions based on both your and the tutor's availability." },
];

const PlatformFeatures = () => {
  return (
    <section className="py-24">
      <div className="container">
        <ScrollReveal>
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Features</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">Everything You Need</h2>
            <p className="mt-3 text-muted-foreground">A complete platform for a great tutoring experience</p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.1}>
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <Card className="border-0 shadow-neumorphic hover:shadow-elevated group">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <img src={f.image} alt={f.title} className="h-full w-full object-contain" />
                  </div>
                  <h3 className="mt-5 font-bold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default PlatformFeatures;
