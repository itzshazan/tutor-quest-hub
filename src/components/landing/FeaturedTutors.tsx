import { useEffect, useState } from "react";
import { getInitials } from "@/lib/formatters";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import { Tilt3D } from "./Tilt3D";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedTutor {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  subject: string;
  experience_years: number | null;
  hourly_rate: number | null;
  rating: number | null;
  location: string | null;
}

const FeaturedTutors = () => {
  const [tutors, setTutors] = useState<FeaturedTutor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      // Fetch top-rated verified tutors
      const { data } = await supabase
        .from("tutor_profiles")
        .select(`
          user_id,
          subject,
          experience_years,
          hourly_rate,
          rating,
          location,
          profiles!tutor_profiles_profiles_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq("is_verified", true)
        .gt("hourly_rate", 0)
        .order("rating", { ascending: false })
        .limit(3);

      if (data) {
        const mapped = data.map((t: any) => ({
          user_id: t.user_id,
          full_name: t.profiles?.full_name || "Tutor",
          avatar_url: t.profiles?.avatar_url,
          subject: t.subject,
          experience_years: t.experience_years,
          hourly_rate: t.hourly_rate,
          rating: t.rating,
          location: t.location,
        }));
        setTutors(mapped);
      }
      setLoading(false);
    };

    fetchTutors();
  }, []);

  // Fallback to placeholder data if no verified tutors exist
  const displayTutors = tutors.length > 0 ? tutors : [
    { user_id: "1", full_name: "Dr. Anita Roy", subject: "Mathematics", experience_years: 12, rating: 4.9, location: "1.5 km away", hourly_rate: 800, avatar_url: null },
    { user_id: "2", full_name: "Vikram Singh", subject: "Physics", experience_years: 8, rating: 4.8, location: "2.3 km away", hourly_rate: 700, avatar_url: null },
    { user_id: "3", full_name: "Meera Nair", subject: "Biology", experience_years: 6, rating: 4.7, location: "3 km away", hourly_rate: 600, avatar_url: null },
  ];

  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <ScrollReveal variant="zoomRotate">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-body-sm font-semibold uppercase tracking-widest text-accent">Top Rated</p>
            <h2 className="mt-3 text-display text-foreground">Featured Tutors</h2>
            <p className="mt-4 text-body-lg text-muted-foreground">
              Our highest-rated educators ready to help you excel.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="mt-16 grid gap-6 md:grid-cols-3" staggerDelay={0.12}>
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border bg-card p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <div className="flex justify-between border-t pt-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))
          ) : (
            displayTutors.map((t) => {
              const initials = t.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <StaggerItem key={t.user_id} variant="flipUp">
                  <Tilt3D intensity={8} className="group rounded-2xl border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover">
                    <div className="flex items-center gap-4" style={{ transform: "translateZ(25px)" }}>
                      <Avatar className="h-14 w-14 border-2 border-border transition-transform duration-300 group-hover:scale-110">
                        <AvatarImage src={t.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground">{t.full_name}</h3>
                        <p className="text-body-sm text-muted-foreground">{t.subject}</p>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-4 text-body-sm text-muted-foreground" style={{ transform: "translateZ(15px)" }}>
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" /> {t.experience_years || 0} years
                      </span>
                      {t.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" /> {t.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {t.rating || 0}
                      </span>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t pt-5" style={{ transform: "translateZ(20px)" }}>
                      <p className="text-lg font-bold text-foreground">₹{t.hourly_rate || 0}/hr</p>
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-full px-5" asChild>
                          <Link to={`/tutor/${t.user_id}`}>View Profile</Link>
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-full px-5" asChild>
                          <Link to={`/messages?tutor=${t.user_id}`}>Contact</Link>
                        </Button>
                      </div>
                    </div>
                  </Tilt3D>
                </StaggerItem>
              );
            })
          )}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default FeaturedTutors;
