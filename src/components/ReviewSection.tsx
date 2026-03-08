import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  student_id: string;
  student_name?: string;
}

interface Props {
  tutorId: string;
}

const StarRating = ({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <button
        key={i}
        type="button"
        disabled={readonly}
        onClick={() => onChange?.(i)}
        className={readonly ? "cursor-default" : "cursor-pointer hover:scale-110 transition-transform"}
      >
        <Star
          className={`h-5 w-5 ${i <= value ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
        />
      </button>
    ))}
  </div>
);

const ReviewSection = ({ tutorId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);

  const loadReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("tutor_id", tutorId)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch student names
      const enriched = await Promise.all(
        data.map(async (r: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", r.student_id)
            .single();
          return { ...r, student_name: profile?.full_name || "Anonymous" };
        })
      );
      setReviews(enriched);

      // Check if current user already reviewed
      if (user) {
        const existing = enriched.find((r) => r.student_id === user.id);
        if (existing) setExistingReview(existing);
      }
    }
    setLoading(false);
  };

  // Check if student has a completed session with this tutor
  useEffect(() => {
    if (!user || user.user_metadata?.role !== "student") return;
    
    const checkEligibility = async () => {
      const { data } = await supabase
        .from("sessions")
        .select("id")
        .eq("student_id", user.id)
        .eq("tutor_id", tutorId)
        .eq("status", "completed")
        .limit(1);

      if (data && data.length > 0) {
        setCompletedSessionId(data[0].id);
        // Can review if no existing review
        const { data: existing } = await supabase
          .from("reviews")
          .select("id")
          .eq("student_id", user.id)
          .eq("tutor_id", tutorId)
          .limit(1);
        setCanReview(!existing || existing.length === 0);
      }
    };
    checkEligibility();
  }, [user, tutorId]);

  useEffect(() => {
    loadReviews();
  }, [tutorId]);

  const handleSubmit = async () => {
    if (!user || !completedSessionId || rating === 0) return;
    setSubmitting(true);

    const { error } = await supabase.from("reviews").insert({
      tutor_id: tutorId,
      student_id: user.id,
      session_id: completedSessionId,
      rating,
      review_text: text.trim(),
    });

    if (error) {
      toast({ title: "Failed to submit review", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      setShowForm(false);
      setCanReview(false);
      setRating(0);
      setText("");
      await loadReviews();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Reviews {reviews.length > 0 && `(${reviews.length})`}
        </h2>
        {canReview && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>Write a Review</Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Your Rating</p>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <Textarea
              placeholder="Share your experience with this tutor..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={submitting || rating === 0} size="sm">
                {submitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Submit Review
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setRating(0); setText(""); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const initials = r.student_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
            return (
              <Card key={r.id}>
                <CardContent className="flex gap-3 p-4">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{r.student_name}</p>
                      <StarRating value={r.rating} readonly />
                    </div>
                    {r.review_text && (
                      <p className="mt-1 text-sm text-muted-foreground">{r.review_text}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      {new Date(r.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
