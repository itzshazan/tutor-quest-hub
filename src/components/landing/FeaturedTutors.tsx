import { Button } from "@/components/ui/button";
import { Star, MapPin, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import { motion } from "framer-motion";

const tutors = [
  { name: "Dr. Anita Roy", subject: "Mathematics", exp: "12 years", rating: 4.9, distance: "1.5 km", rate: "₹800/hr", initials: "AR" },
  { name: "Vikram Singh", subject: "Physics", exp: "8 years", rating: 4.8, distance: "2.3 km", rate: "₹700/hr", initials: "VS" },
  { name: "Meera Nair", subject: "Biology", exp: "6 years", rating: 4.7, distance: "3 km", rate: "₹600/hr", initials: "MN" },
];

const FeaturedTutors = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-body-sm font-semibold uppercase tracking-widest text-accent">Top Rated</p>
            <h2 className="mt-3 text-display text-foreground">Featured Tutors</h2>
            <p className="mt-4 text-body-lg text-muted-foreground">
              Our highest-rated educators ready to help you excel.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="mt-16 grid gap-6 md:grid-cols-3" staggerDelay={0.12}>
          {tutors.map((t) => (
            <StaggerItem key={t.name}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="rounded-2xl border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-border">
                    <AvatarFallback className="bg-primary/10 font-semibold text-primary">{t.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{t.name}</h3>
                    <p className="text-body-sm text-muted-foreground">{t.subject}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-4 text-body-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {t.exp}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {t.distance}</span>
                  <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-accent text-accent" /> {t.rating}</span>
                </div>
                <div className="mt-5 flex items-center justify-between border-t pt-5">
                  <p className="text-lg font-bold text-foreground">{t.rate}</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-full px-5">View Profile</Button>
                    <Button size="sm" variant="outline" className="rounded-full px-5">Contact</Button>
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default FeaturedTutors;
