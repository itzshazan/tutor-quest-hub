import { useEffect, useState } from "react";
import { getInitials } from "@/lib/formatters";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Star, MapPin, Briefcase, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";

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

const CARD_ROTATIONS = [-1.5, 1, -2];

const FeaturedTutors = () => {
  const [tutors, setTutors] = useState<FeaturedTutor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
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

  const displayTutors = tutors.length > 0 ? tutors : [
    { user_id: "1", full_name: "Dr. Anita Roy",  subject: "Mathematics", experience_years: 12, rating: 4.9, location: "1.5 km away", hourly_rate: 800, avatar_url: null },
    { user_id: "2", full_name: "Vikram Singh",    subject: "Physics",     experience_years: 8,  rating: 4.8, location: "2.3 km away", hourly_rate: 700, avatar_url: null },
    { user_id: "3", full_name: "Meera Nair",      subject: "Biology",     experience_years: 6,  rating: 4.7, location: "3 km away",   hourly_rate: 600, avatar_url: null },
  ];

  return (
    <section className="py-24 md:py-32" style={{ background: "#fdfbf7" }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(#e5e0d8 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.5,
        }}
        aria-hidden="true"
      />
      <div className="container relative">
        <ScrollReveal variant="zoomRotate">
          <div className="mx-auto max-w-2xl text-center">
            <SectionLabel rotate={1} color="red">⭐ Top Rated</SectionLabel>
            <h2
              className="mt-6 font-kalam font-bold text-hd-ink"
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.2 }}
            >
              Featured Tutors
            </h2>
            <p className="mt-4 font-patrick text-lg text-hd-ink/70">
              Our highest-rated educators ready to help you excel.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.12}>
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border-2 border-hd-ink bg-white p-6 space-y-4" style={{ boxShadow: "4px 4px 0px 0px #2d2d2d" }}>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <div className="flex justify-between border-t pt-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            ))
          ) : (
            displayTutors.map((t, i) => {
              const initials = getInitials(t.full_name);
              return (
                <StaggerItem key={t.user_id} variant="flipUp">
                  <motion.div
                    whileHover={{
                      y: -6,
                      rotate: 0,
                      boxShadow: "8px 8px 0px 0px #2d2d2d",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Card
                      decoration="tack"
                      rotate={CARD_ROTATIONS[i]}
                      shadowSize="lg"
                      className="group p-6 pt-10 transition-shadow duration-150"
                    >
                      {/* Avatar with spring hover */}
                      <div className="flex items-center gap-4">
                        <motion.div
                          className="relative shrink-0 border-[3px] border-hd-ink bg-hd-postit overflow-hidden"
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: "60% 40% 60% 40% / 40% 60% 40% 60%",
                            boxShadow: "3px 3px 0px 0px #2d2d2d",
                          }}
                          whileHover={{ scale: 1.2, rotate: 6 }}
                          transition={{ type: "spring", stiffness: 420, damping: 14 }}
                        >
                          <Avatar className="h-full w-full rounded-none">
                            <AvatarImage src={t.avatar_url || undefined} className="object-cover" />
                            <AvatarFallback className="rounded-none bg-hd-postit font-kalam font-bold text-hd-ink text-base">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>
                        <div>
                          <h3 className="font-kalam text-lg font-bold text-hd-ink">{t.full_name}</h3>
                          <p className="font-patrick text-sm text-hd-ink/60">{t.subject} Tutor</p>
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="mt-5 flex flex-wrap gap-4 font-patrick text-sm text-hd-ink/60">
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5" /> {t.experience_years || 0} yrs exp
                        </span>
                        {t.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" /> {t.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-hd-accent font-bold">
                          <Star className="h-3.5 w-3.5 fill-hd-accent text-hd-accent" />
                          {t.rating || 0}
                        </span>
                      </div>

                      {/* Price + CTA */}
                      <div
                        className="mt-5 flex flex-col gap-3 border-t-2 border-dashed border-hd-ink/30 pt-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <motion.p
                          className="font-kalam text-2xl font-bold"
                          initial={{ scale: 1.1, rotate: -2 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 300 }}
                          style={{
                            background: "#ff4d4d",
                            color: "#fff",
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: "8px 40px 8px 40px / 40px 8px 40px 8px",
                            boxShadow: "3px 3px 0px 0px #2d2d2d",
                            border: "2px solid #2d2d2d",
                          }}
                        >
                          ₹{t.hourly_rate || 0}/hr
                        </motion.p>
                        <div className="flex gap-2">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button size="sm" asChild>
                              <Link to={`/tutor/${t.user_id}`}>View Profile</Link>
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button size="sm" variant="secondary" asChild>
                              <Link to={`/messages?tutor=${t.user_id}`}>Contact</Link>
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
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
