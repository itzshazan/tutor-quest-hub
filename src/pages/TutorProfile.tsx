import { useCallback, useEffect, useState, type ReactNode, type SVGProps } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  CalendarIcon,
  Flag,
  GraduationCap,
  Heart,
  MapPin,
  MessageSquare,
  Star,
  User,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedTutors } from "@/hooks/useSavedTutors";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { SEO, jsonLdGenerators } from "@/components/SEO";
import { motion } from "framer-motion";

interface TutorData {
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  subject: string;
  subjects: string[] | null;
  grade_levels: string[] | null;
  experience_years: number | null;
  hourly_rate: number | null;
  location: string | null;
  education: string | null;
  is_verified: boolean | null;
  rating: number | null;
  total_reviews: number | null;
  teaching_method: string;
  teaching_radius: number | null;
}

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  student_id: string;
  student_name: string;
  student_avatar: string | null;
}

const REPORT_REASONS = [
  "Fake information",
  "Misbehavior",
  "Unprofessional conduct",
  "Inappropriate content",
  "Other",
];

// Hand-drawn border radius styles
const profileRadius = "24px 18px 26px 20px / 18px 26px 20px 24px";
const innerRadius = "18px 14px 20px 16px / 16px 20px 14px 18px";
const inputRadius = "14px 12px 15px 13px / 13px 15px 12px 14px";
const cardRadius = "20px 16px 22px 18px / 16px 22px 18px 20px";

// Sketch-style borders and shadows
const sketchBorder = "border-[3px] border-[#1E1E1E] shadow-[6px_7px_0px_#1E1E1E]";
const lightBorder = "border-[2px] border-[#1E1E1E]";

// Button styles
const buttonBase =
  "inline-flex h-12 items-center justify-center gap-2 border-[3px] border-[#1E1E1E] bg-white px-6 font-patrick text-[18px] font-bold text-[#1E1E1E] shadow-[3px_3px_0px_#1E1E1E] transition-all hover:-translate-y-1 hover:shadow-[4px_5px_0px_#1E1E1E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b6b] focus-visible:ring-offset-2";

const primaryButton =
  "inline-flex h-12 items-center justify-center gap-2 border-[3px] border-[#1E1E1E] bg-[#ff6b6b] px-6 font-patrick text-[18px] font-bold text-white shadow-[3px_3px_0px_#1E1E1E] transition-all hover:-translate-y-1 hover:shadow-[4px_5px_0px_#1E1E1E] hover:bg-[#ff5252] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b6b] focus-visible:ring-offset-2";

const pageShellStyle = { maxWidth: 600 } satisfies React.CSSProperties;

const TutorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { savedIds, toggle: toggleSave } = useSavedTutors(user?.id);
  const [tutor, setTutor] = useState<TutorData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchTutor = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, bio")
        .eq("user_id", id)
        .single();

      const { data: tutorProfile } = await supabase
        .from("tutor_profiles")
        .select(
          "subject, subjects, experience_years, hourly_rate, location, education, is_verified, rating, total_reviews, grade_levels, teaching_method, teaching_radius",
        )
        .eq("user_id", id)
        .single();

      if (!profile || !tutorProfile) {
        setNotFound(true);
      } else {
        setTutor({ ...profile, ...tutorProfile });
      }
      setLoading(false);
    };

    fetchTutor();
  }, [id]);

  const loadReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);

    const { data } = await supabase
      .from("reviews")
      .select("id, rating, review_text, created_at, student_id")
      .eq("tutor_id", id)
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) {
      setReviews([]);
      setReviewsLoading(false);
      return;
    }

    const studentIds = [...new Set(data.map((review) => review.student_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", studentIds);

    const profileMap = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
    setReviews(
      data.map((review) => {
        const profile = profileMap.get(review.student_id);
        return {
          ...review,
          student_name: profile?.full_name || "Anonymous",
          student_avatar: profile?.avatar_url || null,
        };
      }),
    );
    setReviewsLoading(false);
  }, [id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  if (loading) {
    return <TutorProfileSkeleton />;
  }

  if (notFound || !tutor || !id) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F6F1E9] bg-[radial-gradient(#E5DED2_1px,transparent_1px)] [background-size:22px_22px] px-4 text-center">
        <h1 className="font-kalam text-4xl font-bold text-[#1E1E1E]">Tutor not found</h1>
        <p className="mt-2 font-patrick text-2xl text-[#6B7280]">This profile doesn't exist or has been removed.</p>
        <Link to="/" className={cn(buttonBase, "mt-6 h-12 px-5 text-xl")} style={{ borderRadius: inputRadius }}>
          Back to Home
        </Link>
      </div>
    );
  }

  const isSaved = savedIds.has(id);
  const reviewCount = reviewsLoading ? Number(tutor.total_reviews || 0) : reviews.length;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#F6F1E9] bg-[radial-gradient(#E5DED2_1px,transparent_1px)] [background-size:22px_22px] text-[#1E1E1E]">
      <SEO
        title={tutor.full_name}
        description={`${tutor.full_name} is a ${tutor.is_verified ? "verified " : ""}tutor specializing in ${tutor.subject}. ${Number(tutor.experience_years || 0)} years experience. ₹${Number(tutor.hourly_rate || 0)}/hr.`}
        url={`/tutor/${id}`}
        type="profile"
        jsonLd={jsonLdGenerators.person({
          name: tutor.full_name,
          description: tutor.bio || undefined,
          image: tutor.avatar_url || undefined,
          jobTitle: `${tutor.subject} Tutor`,
          url: `https://tutorquest.com/tutor/${id}`,
        })}
      />

      <ProfileDoodles />

      <div className="relative z-10 mx-auto flex h-full w-full flex-col px-4 py-4 md:px-6" style={pageShellStyle}>
        {/* Simple Back Button */}
        <Link
          to="/"
          className="mb-3 inline-flex w-fit items-center gap-1.5 font-patrick text-[16px] font-medium text-[#5B6673] transition-transform hover:-translate-x-1 hover:text-[#1E1E1E]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          Back to Home
        </Link>

        <ProfileCard>
          <ProfileHero tutor={tutor} reviewCount={reviewCount} />

          <div className="space-y-4 px-5 py-4 md:px-6">
            <ActionBar
              tutor={tutor}
              isSaved={isSaved}
              onMessage={() => {
                if (!user) {
                  navigate("/login");
                  return;
                }
                navigate(`/messages?tutor=${id}`);
              }}
              onBook={() => {
                if (!user) {
                  navigate("/login");
                  return;
                }
                navigate(`/sessions?tutor=${id}&subject=${encodeURIComponent(tutor.subject)}`);
              }}
              onFavorite={() => {
                if (!user) {
                  navigate("/login");
                  return;
                }
                toggleSave(id);
              }}
            />

            <AboutSection bio={tutor.bio} />
            <InfoGrid tutor={tutor} />
            <ReviewsList reviews={reviews} loading={reviewsLoading} fallbackCount={Number(tutor.total_reviews || 0)} />
            {(!user || user.id !== id) && <ReportTutorButton tutorId={id} userId={user?.id} />}
          </div>
        </ProfileCard>
      </div>
    </div>
  );
};



function ProfileCard({ children }: { children: ReactNode }) {
  return (
    <main className={cn(sketchBorder, "flex-1 overflow-y-auto bg-white")} style={{ borderRadius: profileRadius }}>
      {children}
    </main>
  );
}

function ProfileHero({ tutor, reviewCount }: { tutor: TutorData; reviewCount: number }) {
  const initials = getInitials(tutor.full_name);

  return (
    <section className="px-5 py-5 md:px-6" style={{ backgroundColor: "#FFF7EA" }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Avatar */}
        <Avatar 
          className="overflow-hidden border-[3px] border-[#1E1E1E] bg-[#E8F1FF] shadow-[3px_3px_0px_rgba(30,30,30,0.3)]" 
          style={{ width: 80, height: 80, borderRadius: "50%" }}
        >
          <AvatarImage src={tutor.avatar_url || undefined} alt={tutor.full_name} className="object-cover" />
          <AvatarFallback className="bg-[#E8F1FF] font-kalam font-bold text-[#1E2732]" style={{ fontSize: 32 }}>
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Tutor Info */}
        <div className="min-w-0 flex-1">
          <h1 className="font-kalam font-bold leading-tight text-[#111827]" style={{ fontSize: 26 }}>
            {tutor.full_name}
          </h1>
          <p className="mt-1 font-patrick leading-tight text-[#536174]" style={{ fontSize: 16 }}>
            {formatSubjectLine(tutor.subject)}
          </p>
          
          {/* Meta Info Row */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-patrick text-[14px] font-medium text-[#5B6673]">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-[#FBBF24] text-[#FBBF24]" strokeWidth={2} />
              {formatRating(tutor.rating)} ({reviewCount})
            </span>
            <span className="text-[#D1D5DB]">•</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#5B6673]" strokeWidth={2} />
              {tutor.location || "Location not provided"}
            </span>
            <span className="text-[#D1D5DB]">•</span>
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-[#5B6673]" strokeWidth={2} />
              {formatExperience(tutor.experience_years)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ActionBar({
  tutor,
  isSaved,
  onMessage,
  onBook,
  onFavorite,
}: {
  tutor: TutorData;
  isSaved: boolean;
  onMessage: () => void;
  onBook: () => void;
  onFavorite: () => void;
}) {
  return (
    <section
      className="flex flex-col gap-3 border-[2px] border-[#1E1E1E] bg-[#FFFBF5] px-4 py-3 shadow-[3px_3px_0px_#1E1E1E] sm:flex-row sm:items-center sm:justify-between"
      style={{ borderRadius: cardRadius }}
    >
      {/* Hourly Rate */}
      <div>
        <p className="font-patrick text-[14px] font-medium text-[#5B6673]">Hourly Rate</p>
        <p className="mt-0.5 font-kalam font-bold leading-none text-[#111827]" style={{ fontSize: 24 }}>
          ₹{Number(tutor.hourly_rate || 0).toLocaleString("en-IN")}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button 
          type="button" 
          onClick={onMessage} 
          className="inline-flex h-10 items-center justify-center gap-1.5 border-[2px] border-[#1E1E1E] bg-white px-4 font-patrick text-[15px] font-bold text-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1E1E1E]" 
          style={{ borderRadius: inputRadius }}
        >
          <MessageSquare className="h-4 w-4" strokeWidth={2.5} />
          Message
        </button>
        <button 
          type="button" 
          onClick={onBook} 
          className="inline-flex h-10 items-center justify-center gap-1.5 border-[2px] border-[#1E1E1E] bg-[#ff6b6b] px-4 font-patrick text-[15px] font-bold text-white shadow-[2px_2px_0px_#1E1E1E] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1E1E1E] hover:bg-[#ff5252]" 
          style={{ borderRadius: inputRadius }}
        >
          <CalendarIcon className="h-4 w-4" strokeWidth={2.5} />
          Book Session
        </button>
        <motion.button
          type="button"
          onClick={onFavorite}
          aria-pressed={isSaved}
          aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
          className="grid h-10 w-10 place-items-center rounded-full border-[2px] border-[#1E1E1E] bg-white text-[#ff6b6b] transition-all hover:-translate-y-0.5 hover:bg-[#FFF0F0]"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Heart 
            className={cn("h-5 w-5 transition-all", isSaved && "fill-[#ff6b6b]")} 
            strokeWidth={isSaved ? 0 : 2.5} 
          />
        </motion.button>
      </div>
    </section>
  );
}

function AboutSection({ bio }: { bio: string | null }) {
  return (
    <section>
      <h2 className="font-kalam text-[18px] font-bold leading-tight text-[#111827]">About</h2>
      <p className="mt-2 line-clamp-2 whitespace-pre-wrap font-patrick text-[14px] leading-relaxed text-[#536174]">
        {bio?.trim() || "No description provided"}
      </p>
    </section>
  );
}

function InfoGrid({ tutor }: { tutor: TutorData }) {
  const items = [
    {
      label: "Subjects",
      value: tutor.subjects && tutor.subjects.length > 0 ? tutor.subjects.join(", ") : tutor.subject || "Not provided",
      icon: <BookOpen className="h-6 w-6 text-[#6B9FE8]" strokeWidth={2.3} />,
    },
    {
      label: "Education",
      value: tutor.education || "Not provided",
      icon: <GraduationCap className="h-6 w-6 text-[#6B9FE8]" strokeWidth={2.4} />,
    },
    {
      label: "Teaching Method",
      value: formatTeachingMethod(tutor.teaching_method),
      icon: <MapPin className="h-6 w-6 fill-[#EF4444] text-[#EF4444]" strokeWidth={2.3} />,
    },
    {
      label: "Teaching Radius",
      value: tutor.teaching_radius ? `${tutor.teaching_radius} km` : "Not set",
      icon: <MapPin className="h-6 w-6 fill-[#10B981] text-[#10B981]" strokeWidth={2.3} />,
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <article
          key={item.label}
          className="flex min-h-[70px] items-center gap-3 border-[2px] border-[#1E1E1E] bg-white px-4 py-3 shadow-[2px_2px_0px_#1E1E1E]"
          style={{ borderRadius: cardRadius }}
        >
          <div className="shrink-0">{item.icon}</div>
          <div className="min-w-0">
            <h3 className="font-kalam text-[16px] font-bold leading-tight text-[#111827]">{item.label}</h3>
            <p className="mt-0.5 truncate font-patrick text-[14px] leading-tight text-[#536174]">{item.value}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

function ReviewsList({
  reviews,
  loading,
  fallbackCount,
}: {
  reviews: Review[];
  loading: boolean;
  fallbackCount: number;
}) {
  const count = loading ? fallbackCount : reviews.length;

  return (
    <section>
      <h2 className="font-kalam text-[18px] font-bold leading-tight text-[#111827]">
        Reviews ({count})
      </h2>
      <div className="mt-2">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full rounded-2xl border-[2px] border-[#1E1E1E]/20 bg-[#F6F1E9]" />
          </div>
        ) : reviews.length === 0 ? (
          <div
            className="border-[2px] border-[#1E1E1E] bg-white px-4 py-3 text-center font-patrick text-[14px] text-[#6B7280]"
            style={{ borderRadius: cardRadius }}
          >
            No reviews yet
          </div>
        ) : (
          <div className="space-y-2">
            {reviews.slice(0, 2).map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article
      className="flex items-start gap-3 border-[2px] border-[#1E1E1E] bg-white px-4 py-3 shadow-[2px_2px_0px_#1E1E1E]"
      style={{ borderRadius: cardRadius }}
    >
      <Avatar className="h-10 w-10 overflow-hidden border-[2px] border-[#B8C8DA] bg-[#E8F1FF]">
        <AvatarImage src={review.student_avatar || undefined} alt={review.student_name} className="object-cover" />
        <AvatarFallback className="bg-[#E8F1FF] font-patrick text-sm font-bold text-[#1E1E1E]">
          {getInitials(review.student_name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-patrick text-[15px] font-bold leading-tight text-[#111827]">{review.student_name}</h3>
          <StarRow rating={review.rating} />
        </div>
        <p className="mt-0.5 font-patrick text-[12px] leading-tight text-[#6B7280]">
          {new Date(review.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
        {review.review_text ? (
          <p className="mt-1 line-clamp-1 font-patrick text-[13px] leading-snug text-[#536174]">{review.review_text}</p>
        ) : null}
      </div>
    </article>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn("h-4 w-4", star <= rating ? "fill-[#FBBF24] text-[#FBBF24]" : "fill-[#E5E7EB] text-[#E5E7EB]")}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}

function ReportTutorButton({ tutorId, userId }: { tutorId: string; userId: string | undefined }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!userId) {
      navigate("/login");
      return;
    }
    if (!reason) return;

    setSubmitting(true);
    const { error } = await supabase.from("tutor_reports").insert({
      tutor_id: tutorId,
      reporter_id: userId,
      reason,
      description: description.trim() || null,
    });

    if (error) {
      toast({ title: "Report failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Report submitted", description: "An admin will review your report." });
      setOpen(false);
      setReason("");
      setDescription("");
    }
    setSubmitting(false);
  };

  return (
    <section className="border-t-2 border-[#D1D5DB] pt-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            onClick={(event) => {
              if (!userId) {
                event.preventDefault();
                navigate("/login");
              }
            }}
            className="inline-flex items-center gap-1.5 px-0 py-1 font-patrick text-[14px] font-bold text-[#6B7280] transition-colors hover:text-[#EF4444]"
          >
            <Flag className="h-4 w-4" strokeWidth={2} />
            Report this tutor
          </button>
        </DialogTrigger>
        <DialogContent
          className="border-[3px] border-[#1E1E1E] bg-white shadow-[6px_7px_0px_#1E1E1E]"
          style={{ borderRadius: profileRadius }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-kalam text-xl text-[#1E1E1E]">
              <Flag className="h-5 w-5 text-[#EF4444]" /> Report Tutor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="font-patrick text-sm font-bold text-[#1E1E1E]">Reason *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger
                  className="h-10 border-[2px] border-[#1E1E1E] bg-white font-patrick text-sm"
                  style={{ borderRadius: inputRadius }}
                >
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent className="border-[2px] border-[#1E1E1E] bg-white font-patrick text-sm">
                  {REPORT_REASONS.map((reportReason) => (
                    <SelectItem key={reportReason} value={reportReason}>
                      {reportReason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-patrick text-sm font-bold text-[#1E1E1E]">Additional Details</Label>
              <Textarea
                placeholder="Provide more context about the issue..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={500}
                rows={2}
                className="border-[2px] border-[#1E1E1E] bg-white font-patrick text-sm"
                style={{ borderRadius: inputRadius }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                className="inline-flex h-9 items-center justify-center border-[2px] border-[#1E1E1E] bg-white px-4 font-patrick text-sm font-bold text-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E]" 
                style={{ borderRadius: inputRadius }} 
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center border-[2px] border-[#1E1E1E] bg-[#ff6b6b] px-4 font-patrick text-sm font-bold text-white shadow-[2px_2px_0px_#1E1E1E] disabled:cursor-not-allowed disabled:opacity-60"
                style={{ borderRadius: inputRadius }}
                onClick={handleSubmit}
                disabled={!reason || submitting}
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ProfileDoodles() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Left side decorations */}
      <SparkleDoodle className="absolute left-[3vw] top-[18%] hidden md:block" style={{ width: 32, height: 32 }} />
      <span className="absolute left-[2vw] top-[28%] hidden h-6 w-6 rounded-full border-[2px] border-[#1E1E1E] bg-[#FFB8B1] md:block" />
      
      {/* Right side decorations - paper plane at top */}
      <svg className="absolute right-[4vw] top-[12%] hidden lg:block" width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 50 L50 10 L30 35 L10 50Z" fill="white" stroke="#1E1E1E" strokeWidth="2" strokeLinejoin="round" />
        <path d="M30 35 L50 10" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 35 L25 45 L20 40 L10 50" fill="#F6F1E9" stroke="#1E1E1E" strokeWidth="2" strokeLinejoin="round" />
        <path d="M45 15 Q 52 20, 48 28" stroke="#1E1E1E" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" fill="none" />
      </svg>
      
      <CurvyLineDoodle className="absolute right-[2vw] top-[45%] hidden lg:block" style={{ width: 80, height: 80 }} />
      <SparkleDoodle className="absolute right-[3vw] top-[35%] hidden lg:block" style={{ width: 28, height: 28 }} />
      <span className="absolute right-[2vw] top-[22%] hidden h-6 w-6 rounded-full border-[2px] border-[#1E1E1E] bg-[#FFE174] lg:block" />
      <span className="absolute bottom-[15%] right-[3vw] hidden h-7 w-7 rounded-full border-[2px] border-[#1E1E1E] bg-[#FFB8B1] lg:block" />
      <span className="absolute bottom-[8%] right-[1.5vw] hidden h-8 w-8 rounded-full border-[2px] border-[#1E1E1E] bg-[#68D77A] lg:block" />
      
      {/* Bottom left books and plant */}
      <div className="absolute bottom-8 left-4 hidden h-[140px] w-[180px] xl:block">
        <img
          src="/payment-plant.svg"
          alt=""
          className="absolute bottom-2 left-0 select-none"
          style={{ width: 60, height: 100 }}
        />
        <img
          src="/payment-books.svg"
          alt=""
          className="absolute bottom-0 select-none"
          style={{ left: 50, width: 110, height: 100 }}
        />
      </div>
    </div>
  );
}

function TutorProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#F6F1E9] bg-[radial-gradient(#E5DED2_1px,transparent_1px)] [background-size:22px_22px] px-5 py-8">
      <div className="mx-auto max-w-[1000px]">
        <Skeleton className="mb-8 h-10 w-48 rounded-xl bg-white" />
        <div className={cn(sketchBorder, "overflow-hidden bg-white")} style={{ borderRadius: profileRadius }}>
          <div className="bg-[#FFF7EA] px-8 py-10">
            <div className="flex gap-7">
              <Skeleton className="h-32 w-32 rounded-full bg-[#E8F1FF]" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-10 w-60 bg-white" />
                <Skeleton className="h-8 w-44 bg-white" />
                <Skeleton className="h-7 w-full max-w-xl bg-white" />
              </div>
            </div>
          </div>
          <div className="space-y-7 px-8 py-8">
            <Skeleton className="h-32 w-full rounded-2xl bg-[#F6F1E9]" />
            <Skeleton className="h-28 w-full rounded-2xl bg-[#F6F1E9]" />
            <div className="grid gap-7 md:grid-cols-2">
              <Skeleton className="h-28 rounded-2xl bg-[#F6F1E9]" />
              <Skeleton className="h-28 rounded-2xl bg-[#F6F1E9]" />
              <Skeleton className="h-28 rounded-2xl bg-[#F6F1E9]" />
              <Skeleton className="h-28 rounded-2xl bg-[#F6F1E9]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatSubjectLine(subject: string) {
  return subject ? `${subject} Tutor` : "Tutor";
}

function formatRating(rating: number | null) {
  const safeRating = Number(rating || 0);
  return Number.isInteger(safeRating) ? safeRating.toString() : safeRating.toFixed(1);
}

function formatExperience(years: number | null) {
  const count = Number(years || 0);
  if (count <= 0) return "New tutor";
  return `${count} ${count === 1 ? "year" : "years"} exp.`;
}

function formatTeachingMethod(method: string | null) {
  if (!method) return "Online/Offline";
  if (method === "both") return "Online/Offline";
  return method.charAt(0).toUpperCase() + method.slice(1);
}

function SparkleDoodle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="none" {...props}>
      <path
        d="M20 3.5c2.2 8.2 4.3 12.1 16 16.5-11.7 4.4-13.8 8.3-16 16.5-2.2-8.2-4.3-12.1-16-16.5C15.7 15.6 17.8 11.7 20 3.5Z"
        fill="#FFE174"
        stroke="#1E1E1E"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CurvyLineDoodle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 120" fill="none" {...props}>
      <path
        d="M18 78c26 4 47-14 41-35-4-14-21-11-20 2 2 25 43 15 56-8"
        stroke="#1E1E1E"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default TutorProfile;
