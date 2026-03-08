import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, MapPin, Briefcase, GraduationCap, BookOpen, ArrowLeft, MessageSquare, CalendarIcon, Flag, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import ReviewSection from "@/components/ReviewSection";

interface TutorData {
  full_name: string;
  avatar_url: string | null;
  bio: string;
  subject: string;
  subjects: string[] | null;
  grade_levels: string[] | null;
  experience_years: number;
  hourly_rate: number;
  location: string;
  education: string;
  is_verified: boolean;
  rating: number;
  total_reviews: number;
  teaching_method: string;
  teaching_radius: number;
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
        .select("subject, subjects, experience_years, hourly_rate, location, education, is_verified, rating, total_reviews, grade_levels, teaching_method, teaching_radius")
        .eq("user_id", id)
        .single();

      if (!profile || !tutorProfile) {
        setNotFound(true);
      } else {
        setTutor({ ...profile, ...tutorProfile } as any);
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
            <div className="flex flex-col items-center gap-4 rounded-xl border bg-muted/30 p-6 sm:flex-row sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hourly Rate</p>
                <p className="font-display text-3xl font-bold text-foreground">₹{tutor.hourly_rate}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    if (!user) { navigate("/login"); return; }
                    navigate(`/messages?tutor=${id}`);
                  }}
                >
                  <MessageSquare className="h-4 w-4" /> Message
                </Button>
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => {
                    if (!user) { navigate("/login"); return; }
                    navigate(`/sessions?tutor=${id}&subject=${encodeURIComponent(tutor.subject)}`);
                  }}
                >
                  <CalendarIcon className="h-4 w-4" /> Book Session
                </Button>
              </div>
            </div>

            {tutor.bio && (
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">About</h2>
                <p className="mt-2 leading-relaxed text-muted-foreground">{tutor.bio}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {tutor.subject && (
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <BookOpen className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Subjects</p>
                    <p className="text-sm text-muted-foreground">
                      {tutor.subjects && tutor.subjects.length > 0 ? tutor.subjects.join(", ") : tutor.subject}
                    </p>
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
              <div className="flex items-start gap-3 rounded-lg border p-4">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Teaching Method</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {tutor.teaching_method === "both" ? "Online & Offline" : tutor.teaching_method || "Offline"}
                  </p>
                </div>
              </div>
              {tutor.teaching_radius > 0 && (
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Teaching Radius</p>
                    <p className="text-sm text-muted-foreground">{tutor.teaching_radius} km</p>
                  </div>
                </div>
              )}
            </div>

            {/* Grade Levels */}
            {tutor.grade_levels && tutor.grade_levels.length > 0 && (
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground mb-3">Grade Levels</h2>
                <div className="flex flex-wrap gap-2">
                  {tutor.grade_levels.map((g) => (
                    <Badge key={g} variant="outline">{g}</Badge>
                  ))}
                </div>
              </div>
            )}

            <ReviewSection tutorId={id!} />

            {/* Report Tutor */}
            {user && user.id !== id && (
              <ReportTutorSection tutorId={id!} userId={user.id} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const REPORT_REASONS = [
  "Fake information",
  "Misbehavior",
  "Unprofessional conduct",
  "Inappropriate content",
  "Other",
];

const ReportTutorSection = ({ tutorId, userId }: { tutorId: string; userId: string }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    const { error } = await supabase.from("tutor_reports").insert({
      tutor_id: tutorId,
      reporter_id: userId,
      reason,
      description: description.trim() || null,
    } as any);

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
    <div className="border-t pt-6">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive">
            <Flag className="h-4 w-4" /> Report this tutor
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" /> Report Tutor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Additional Details (optional)</Label>
              <Textarea
                placeholder="Provide more context about the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleSubmit} disabled={!reason || submitting}>
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorProfile;
