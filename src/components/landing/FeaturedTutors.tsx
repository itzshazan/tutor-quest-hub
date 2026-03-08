import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

const tutors = [
  { name: "Dr. Anita Roy", subject: "Mathematics", exp: "12 years", rating: 4.9, distance: "1.5 km", rate: "₹800/hr", initials: "AR" },
  { name: "Vikram Singh", subject: "Physics", exp: "8 years", rating: 4.8, distance: "2.3 km", rate: "₹700/hr", initials: "VS" },
  { name: "Meera Nair", subject: "Biology", exp: "6 years", rating: 4.7, distance: "3 km", rate: "₹600/hr", initials: "MN" },
];

const FeaturedTutors = () => {
  return (
    <section className="bg-muted/50 py-20">
      <div className="container">
        <ScrollReveal>
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Featured Tutors</h2>
            <p className="mt-3 text-muted-foreground">Our top-rated educators ready to help you excel</p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-3" staggerDelay={0.15}>
          {tutors.map((t) => (
            <StaggerItem key={t.name}>
              <Card className="transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-secondary/30">
                      <AvatarFallback className="bg-secondary/10 font-semibold text-secondary">{t.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">{t.name}</h3>
                      <p className="text-sm text-muted-foreground">{t.subject}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {t.exp}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {t.distance}</span>
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-accent text-accent" /> {t.rating}</span>
                  </div>
                  <p className="mt-3 text-lg font-bold text-foreground">{t.rate}</p>
                  <div className="mt-4 flex gap-3">
                    <Button size="sm" className="flex-1">View Profile</Button>
                    <Button size="sm" variant="outline" className="flex-1">Contact</Button>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default FeaturedTutors;
