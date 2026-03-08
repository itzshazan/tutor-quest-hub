import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import { Tilt3D } from "./Tilt3D";
import { Skeleton } from "@/components/ui/skeleton";

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  student_name: string;
  student_avatar: string | null;
  role: string;
}

// Fallback testimonials when no reviews exist
const fallbackTestimonials = [
  {
    id: "1",
    rating: 5,
    review_text: "Tutor Quest helped me find a great math tutor near my home. My grades improved from C to A+ in just three months!",
    student_name: "Arjun K.",
    student_avatar: null,
    role: "Student, Grade 11",
  },
  {
    id: "2",
    rating: 5,
    review_text: "It saved us hours of searching for a reliable tutor. The verified profiles and reviews gave us complete confidence.",
    student_name: "Sunita M.",
    student_avatar: null,
    role: "Parent",
  },
  {
    id: "3",
    rating: 5,
    review_text: "I started receiving student requests within days of signing up. The escrow payment system ensures I always get paid on time.",
    student_name: "Deepak R.",
    student_avatar: null,
    role: "Physics Tutor",
  },
];

const Testimonials = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      // Fetch recent high-rating reviews with text
      const { data } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          review_text,
          student_id
        `)
        .gte("rating", 4)
        .not("review_text", "is", null)
        .not("review_text", "eq", "")
        .order("created_at", { ascending: false })
        .limit(3);

      if (data && data.length > 0) {
        // Fetch student profiles
        const studentIds = data.map((r) => r.student_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, role")
          .in("user_id", studentIds);

        const profileMap = new Map(
          (profiles || []).map((p) => [p.user_id, p])
        );

        const mapped = data.map((r) => {
          const profile = profileMap.get(r.student_id);
          return {
            id: r.id,
            rating: r.rating,
            review_text: r.review_text,
            student_name: profile?.full_name || "Student",
            student_avatar: profile?.avatar_url || null,
            role: profile?.role === "tutor" ? "Tutor" : "Student",
          };
        });

        setReviews(mapped);
      }
      setLoading(false);
    };

    fetchReviews();
  }, []);

  const displayReviews = reviews.length > 0 ? reviews : fallbackTestimonials;

  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <ScrollReveal variant="zoomRotate">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-body-sm font-semibold uppercase tracking-widest text-accent">Testimonials</p>
            <h2 className="mt-3 text-display text-foreground">Loved by students and tutors</h2>
            <p className="mt-4 text-body-lg text-muted-foreground">
              Real stories from our growing community.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="mt-16 grid gap-6 md:grid-cols-3" staggerDelay={0.12}>
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border bg-card p-8 space-y-4">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Skeleton key={j} className="h-4 w-4" />
                  ))}
                </div>
                <Skeleton className="h-20 w-full" />
                <div className="flex items-center gap-3 border-t pt-6">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            displayReviews.map((t) => {
              const initials = t.student_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <StaggerItem key={t.id} variant="flipUp">
                  <Tilt3D intensity={8} className="group flex h-full flex-col rounded-2xl border bg-card p-8 shadow-card transition-shadow hover:shadow-card-hover">
                    {/* Stars */}
                    <div className="flex gap-0.5" style={{ transform: "translateZ(25px)" }}>
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="mt-4 flex-1 text-body text-foreground leading-relaxed" style={{ transform: "translateZ(15px)" }}>
                      "{t.review_text}"
                    </p>

                    {/* Author */}
                    <div className="mt-6 flex items-center gap-3 border-t pt-6" style={{ transform: "translateZ(20px)" }}>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={t.student_avatar || undefined} />
                        <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-body-sm font-semibold text-foreground">{t.student_name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
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

export default Testimonials;
