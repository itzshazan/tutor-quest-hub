import { MapPin, ShieldCheck, MessageSquare, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  { icon: MapPin, title: "Location-Based Search", desc: "Find tutors near your location with distance-aware search results." },
  { icon: ShieldCheck, title: "Verified Profiles", desc: "Every profile includes education, experience, and authentic ratings." },
  { icon: MessageSquare, title: "Direct Communication", desc: "Message tutors directly to discuss your learning needs." },
  { icon: Clock, title: "Flexible Scheduling", desc: "Schedule sessions based on both your and the tutor's availability." },
];

const PlatformFeatures = () => {
  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Platform Features
          </h2>
          <p className="mt-3 text-muted-foreground">Everything you need for a great tutoring experience</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="border-0 bg-muted/40 shadow-none transition-colors hover:bg-muted/70">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformFeatures;
