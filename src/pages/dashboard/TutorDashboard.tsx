import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, MessageSquare, UserCog, Star, Users, BookOpen, CheckCircle, XCircle, IndianRupee, Wallet } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface SessionRow {
  id: string;
  student_id: string;
  subject: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  student_name?: string;
}

interface ReviewRow {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  student_name?: string;
}

const TutorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pending, setPending] = useState<SessionRow[]>([]);
  const [upcoming, setUpcoming] = useState<SessionRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [stats, setStats] = useState({ students: 0, completed: 0, rating: 0, totalReviews: 0 });
  const [profileComplete, setProfileComplete] = useState(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const uid = user.id;

    // Tutor profile stats
    const { data: tp } = await supabase
      .from("tutor_profiles")
      .select("rating, total_reviews, hourly_rate, education, location, subjects, experience_years, bio:subject")
      .eq("user_id", uid)
      .single();

    // Profile completeness
    if (tp) {
      const fields = [tp.hourly_rate, tp.education, tp.location, tp.experience_years];
      const filled = fields.filter((f) => f && f !== 0 && f !== "").length;
      setProfileComplete(Math.round((filled / fields.length) * 100));
    }

    // All sessions
    const { data: sessData } = await supabase
      .from("sessions")
      .select("id, student_id, subject, session_date, start_time, end_time, status")
      .eq("tutor_id", uid)
      .order("session_date", { ascending: true });

    const all = sessData || [];
    const pendingSess = all.filter((s) => s.status === "pending");
    const upcomingSess = all.filter((s) => s.status === "confirmed");
    const completedCount = all.filter((s) => s.status === "completed").length;

    // Student names
    const studentIds = [...new Set(all.map((s) => s.student_id))];
    let studentMap: Record<string, string> = {};
    if (studentIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", studentIds);
      profiles?.forEach((p) => (studentMap[p.user_id] = p.full_name));
    }

    setPending(pendingSess.slice(0, 5).map((s) => ({ ...s, student_name: studentMap[s.student_id] || "Student" })));
    setUpcoming(upcomingSess.slice(0, 5).map((s) => ({ ...s, student_name: studentMap[s.student_id] || "Student" })));

    // Reviews
    const { data: revData } = await supabase
      .from("reviews")
      .select("id, rating, review_text, created_at, student_id")
      .eq("tutor_id", uid)
      .order("created_at", { ascending: false })
      .limit(5);

    const revStudentIds = [...new Set((revData || []).map((r) => r.student_id))];
    let revMap: Record<string, string> = {};
    if (revStudentIds.length) {
      const { data: rp } = await supabase.from("profiles").select("user_id, full_name").in("user_id", revStudentIds);
      rp?.forEach((p) => (revMap[p.user_id] = p.full_name));
    }
    setReviews((revData || []).map((r) => ({ ...r, student_name: revMap[r.student_id] || "Student" })));

    setStats({
      students: studentIds.length,
      completed: completedCount,
      rating: Number(tp?.rating) || 0,
      totalReviews: tp?.total_reviews || 0,
    });
    setLoading(false);
  };

  const handleAction = async (sessionId: string, status: string) => {
    await supabase.from("sessions").update({ status }).eq("id", sessionId);
    toast({ title: `Session ${status}` });
    loadData();
  };

  const statCards = [
    { label: "Total Students", value: stats.students, icon: Users, color: "text-primary" },
    { label: "Completed", value: stats.completed, icon: BookOpen, color: "text-secondary" },
    { label: "Avg Rating", value: stats.rating ? `${stats.rating}★` : "–", icon: Star, color: "text-accent-foreground" },
    { label: "Reviews", value: stats.totalReviews, icon: Star, color: "text-accent-foreground" },
  ];

  return (
    <DashboardLayout role="tutor">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Tutor Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.user_metadata?.full_name || "Tutor"}!</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`rounded-lg bg-muted p-2.5 ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{loading ? "–" : s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Profile Completeness */}
        {profileComplete < 100 && (
          <Card className="border-accent/30">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-foreground">Profile {profileComplete}% complete</p>
                <Progress value={profileComplete} className="h-2" />
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link to="/tutor/setup"><UserCog className="mr-2 h-4 w-4" /> Complete</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link to="/sessions"><CalendarDays className="mr-2 h-4 w-4" /> All Sessions</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/messages"><MessageSquare className="mr-2 h-4 w-4" /> Messages</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/tutor/setup"><UserCog className="mr-2 h-4 w-4" /> Edit Profile</Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : pending.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending requests.</p>
              ) : (
                pending.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{s.subject}</p>
                      <p className="text-sm text-muted-foreground">{s.student_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(s.session_date), "MMM d, yyyy")} · {s.start_time.slice(0, 5)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-secondary" onClick={() => handleAction(s.id, "confirmed")}>
                        <CheckCircle className="mr-1 h-3.5 w-3.5" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleAction(s.id, "declined")}>
                        <XCircle className="mr-1 h-3.5 w-3.5" /> Decline
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming sessions.</p>
              ) : (
                upcoming.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{s.subject}</p>
                      <p className="text-sm text-muted-foreground">{s.student_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(s.session_date), "MMM d, yyyy")} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <Badge className="bg-secondary/20 text-secondary">confirmed</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-foreground">{r.student_name}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-accent text-accent" : "text-muted"}`} />
                        ))}
                      </div>
                    </div>
                    {r.review_text && <p className="text-sm text-muted-foreground">{r.review_text}</p>}
                    <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TutorDashboard;
