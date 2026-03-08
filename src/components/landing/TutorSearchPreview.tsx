import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

const tutors = [
  { name: "Rahul Sharma", subject: "Mathematics", distance: "2 km", rating: 4.8, initials: "RS" },
  { name: "Priya Patel", subject: "Physics", distance: "3.5 km", rating: 4.9, initials: "PP" },
  { name: "Amit Verma", subject: "English", distance: "1.2 km", rating: 4.7, initials: "AV" },
  { name: "Sneha Gupta", subject: "Chemistry", distance: "4 km", rating: 4.6, initials: "SG" },
];

const TutorSearchPreview = () => {
  return (
    <section id="search" className="py-20">
      <div className="container">
        <ScrollReveal>
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Explore Top Tutors</h2>
            <p className="mt-3 text-muted-foreground">Browse qualified tutors ready to help you succeed</p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.12}>
          {tutors.map((t) => (
            <StaggerItem key={t.name}>
              <Card className="group transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">{t.initials}</AvatarFallback>
                  </Avatar>
                  <h3 className="mt-4 font-semibold text-foreground">{t.name}</h3>
                  <p className="text-sm text-muted-foreground">{t.subject} Tutor</p>
                  <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {t.distance}</span>
                    <span className="flex items-center gap-1 text-accent-foreground"><Star className="h-3.5 w-3.5 fill-accent text-accent" /> {t.rating}</span>
                  </div>
                  <Button variant="outline" size="sm" className="mt-4 w-full">View Profile</Button>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default TutorSearchPreview;
