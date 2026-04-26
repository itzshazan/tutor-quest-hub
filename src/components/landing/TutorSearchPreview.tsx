import { Button } from "@/components/ui/button";
import { Star, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";


const tutors = [
  { name: "Rahul Sharma", subject: "Mathematics", distance: "2 km",   rating: 4.8, initials: "RS", rotate: -2 },
  { name: "Priya Patel",  subject: "Physics",     distance: "3.5 km", rating: 4.9, initials: "PP", rotate: 1  },
  { name: "Amit Verma",   subject: "English",     distance: "1.2 km", rating: 4.7, initials: "AV", rotate: -1 },
  { name: "Sneha Gupta",  subject: "Chemistry",   distance: "4 km",   rating: 4.6, initials: "SG", rotate: 2  },
];

const TutorSearchPreview = () => {
  return (
    <section id="search" className="py-24 md:py-32" style={{ background: "#e5e0d8" }}>
      <div className="container">
        <ScrollReveal variant="flipUp">
          <div className="mx-auto max-w-2xl text-center">
            <SectionLabel rotate={1} color="white">Explore</SectionLabel>
            <h2
              className="mt-6 font-kalam font-bold text-hd-ink"
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.2 }}
            >
              Browse Top Tutors
            </h2>
            <p className="mt-4 font-patrick text-lg text-hd-ink/70">
              Discover qualified educators ready to help you succeed.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.08}>
          {tutors.map((t) => (
            <StaggerItem key={t.name} variant="flipUp">
              <Card
                rotate={t.rotate}
                shadowSize="md"
                decoration="tape"
                className="group flex flex-col items-center p-6 pt-10 text-center hover:rotate-0 hover:shadow-hd-lg transition-all duration-150"
              >
                {/* Wobbly oval avatar */}
                <div
                  className="border-[3px] border-hd-ink overflow-hidden transition-transform duration-100 group-hover:scale-110"
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "60% 40% 70% 30% / 40% 60% 30% 70%",
                    boxShadow: "3px 3px 0px 0px #2d2d2d",
                    background: "#fff9c4",
                  }}
                >
                  <Avatar className="h-full w-full rounded-none">
                    <AvatarFallback className="rounded-none bg-hd-postit font-kalam text-xl font-bold text-hd-ink">
                      {t.initials}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <h3 className="mt-5 font-kalam text-lg font-bold text-hd-ink">{t.name}</h3>
                <p className="font-patrick text-sm text-hd-ink/60">{t.subject} Tutor</p>

                <div className="mt-3 flex items-center gap-4 font-patrick text-sm text-hd-ink/60">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {t.distance}
                  </span>
                  <span className="flex items-center gap-1 text-hd-accent font-bold">
                    <Star className="h-3.5 w-3.5 fill-hd-accent text-hd-accent" /> {t.rating}
                  </span>
                </div>

                <Button variant="secondary" size="sm" className="mt-5 w-full justify-center" asChild>
                  <Link to="/find-tutors">View Profile</Link>
                </Button>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default TutorSearchPreview;
