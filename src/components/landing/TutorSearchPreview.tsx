import { Button } from "@/components/ui/button";
import { Star, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import { Tilt3D } from "./Tilt3D";
import { Link } from "react-router-dom";

const tutors = [
  { name: "Rahul Sharma", subject: "Mathematics", distance: "2 km", rating: 4.8, initials: "RS" },
  { name: "Priya Patel", subject: "Physics", distance: "3.5 km", rating: 4.9, initials: "PP" },
  { name: "Amit Verma", subject: "English", distance: "1.2 km", rating: 4.7, initials: "AV" },
  { name: "Sneha Gupta", subject: "Chemistry", distance: "4 km", rating: 4.6, initials: "SG" },
];

const TutorSearchPreview = () => {
  return (
    <section id="search" className="border-t py-24 md:py-32">
      <div className="container">
        <ScrollReveal variant="flipUp">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-body-sm font-semibold uppercase tracking-widest text-accent">Explore</p>
            <h2 className="mt-3 text-display text-foreground">Browse Top Tutors</h2>
            <p className="mt-4 text-body-lg text-muted-foreground">
              Discover qualified educators ready to help you succeed.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.08}>
          {tutors.map((t) => (
            <StaggerItem key={t.name} variant="flipUp">
              <Tilt3D intensity={8} className="group flex flex-col items-center rounded-2xl border bg-card p-6 text-center shadow-card transition-shadow hover:shadow-card-hover">
                <Avatar className="h-16 w-16 border-2 border-border transition-transform duration-300 group-hover:scale-110" style={{ transform: "translateZ(30px)" }}>
                  <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">{t.initials}</AvatarFallback>
                </Avatar>
                <h3 className="mt-4 font-semibold text-foreground" style={{ transform: "translateZ(20px)" }}>{t.name}</h3>
                <p className="text-body-sm text-muted-foreground">{t.subject} Tutor</p>
                <div className="mt-3 flex items-center gap-3 text-body-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {t.distance}</span>
                  <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-accent text-accent" /> {t.rating}</span>
                </div>
                <Button variant="outline" size="sm" className="mt-5 w-full rounded-full" asChild>
                  <Link to="/find-tutors">View Profile</Link>
                </Button>
              </Tilt3D>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default TutorSearchPreview;
