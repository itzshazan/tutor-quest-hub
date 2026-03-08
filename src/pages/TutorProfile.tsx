import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Briefcase, GraduationCap, BookOpen, ArrowLeft, MessageSquare, CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TutorData {
  full_name: string;
  avatar_url: string | null;
  bio: string;
  subject: string;
  experience_years: number;
  hourly_rate: number;
  location: string;
  education: string;
  is_verified: boolean;
  rating: number;
  total_reviews: number;
}

const TutorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState<TutorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchTutor = async () => {
      if (!id) { setNotFound(true); setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, bio")
        .eq("user_id", id)
        .single();

      const { data: tutorProfile } = await supabase
        .from("tutor_profiles")
        .select("subject, experience_years, hourly_rate, location, education, is_verified, rating, total_reviews")
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="container max-w-3xl">
          <Skeleton className="mb-6 h-8 w-32" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (notFound || !tutor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Tutor not found</h1>
        <p className="mt-2 text-muted-foreground">This profile doesn't exist or has been removed.</p>
        <Button asChild className="mt-6"><Link to="/">Back to Home</Link></Button>
      </div>
    );
  }

  const initials = tutor.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="container max-w-3xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <Card className="overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 px-8 py-10">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-2xl font-bold text-foreground">{tutor.full_name}</h1>
                  {tutor.is_verified && <Badge variant="secondary" className="bg-secondary text-secondary-foreground">Verified</Badge>}
                </div>
                <p className="mt-1 text-muted-foreground">{tutor.subject} Tutor</p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {tutor.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" /> {tutor.rating} ({tutor.total_reviews} reviews)
                    </span>
                  )}
                  {tutor.location && (
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {tutor.location}</span>
                  )}
                  {tutor.experience_years > 0 && (
                    <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {tutor.experience_years} years exp.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <CardContent className="space-y-8 p-8">
            {/* Rate & CTA */}
            <div className="flex flex-col items-center gap-4 rounded-xl border bg-muted/30 p-6 sm:flex-row sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hourly Rate</p>
                <p className="font-display text-3xl font-bold text-foreground">₹{tutor.hourly_rate}</p>
              </div>
              <Button
                size="lg"
                className="gap-2"
                onClick={() => {
                  if (!user) { navigate("/login"); return; }
                  navigate(`/messages?tutor=${id}`);
                }}
              >
                <MessageSquare className="h-4 w-4" /> Contact Tutor
              </Button>
            </div>

            {/* Bio */}
            {tutor.bio && (
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">About</h2>
                <p className="mt-2 leading-relaxed text-muted-foreground">{tutor.bio}</p>
              </div>
            )}

            {/* Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              {tutor.subject && (
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <BookOpen className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Subject</p>
                    <p className="text-sm text-muted-foreground">{tutor.subject}</p>
                  </div>
                </div>
              )}
              {tutor.education && (
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <GraduationCap className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Education</p>
                    <p className="text-sm text-muted-foreground">{tutor.education}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TutorProfile;
