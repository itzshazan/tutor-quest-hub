import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  CalendarDays, MessageSquare, UserCog, Star, Users, BookOpen,
  CheckCircle, XCircle, IndianRupee, Wallet, Settings, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

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
  const navigate = useNavigate();
  const [pending, setPending] = useState<SessionRow[]>([]);
  const [upcoming, setUpcoming] = useState<SessionRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [stats, setStats] = useState({ students: 0, completed: 0, rating: 0, totalReviews: 0, totalEarnings: 0, pendingEarnings: 0 });
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

    // Earnings
    const { data: completedPayments } = await supabase
      .from("payments")
      .select("tutor_earnings, payment_status")
      .eq("tutor_id", uid);

    const totalEarnings = (completedPayments || [])
      .filter((p) => p.payment_status === "completed")
      .reduce((sum, p) => sum + Number(p.tutor_earnings), 0);
    const pendingEarnings = (completedPayments || [])
      .filter((p) => p.payment_status === "pending")
      .reduce((sum, p) => sum + Number(p.tutor_earnings), 0);

    setStats({
      students: studentIds.length,
      completed: completedCount,
      rating: Number(tp?.rating) || 0,
      totalReviews: tp?.total_reviews || 0,
      totalEarnings,
      pendingEarnings,
    });
    setLoading(false);
  };

  const handleAction = async (sessionId: string, status: string) => {
    const { error } = await supabase.from("sessions").update({ status }).eq("id", sessionId);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: `Session ${status}` });

    // Keep email and in-app notifications in sync with status updates from dashboard actions.
    const eventMap: Record<string, "confirmed" | "declined" | "cancelled"> = {
      confirmed: "confirmed",
      declined: "declined",
      cancelled: "cancelled",
    };

    const eventType = eventMap[status];
    if (eventType) {
      const { data, error: notificationError } = await supabase.functions.invoke("send-session-notification", {
        body: { session_id: sessionId, event_type: eventType },
      });

      if (notificationError) {
        // Do not block status updates if notification delivery fails.
        console.error("send-session-notification failed:", notificationError);
        toast({
          title: `Session ${status}, email failed`,
          description: "Status changed, but confirmation email failed. Check Resend setup.",
          variant: "destructive",
        });
      } else {
        const payload = data as { success?: boolean; failedEmails?: Array<{ email: string; emailError?: string | null }> } | null;
        if (payload?.success === false || (payload?.failedEmails?.length ?? 0) > 0) {
          const failedEmail = payload?.failedEmails?.[0]?.email;
          const failedReason = payload?.failedEmails?.[0]?.emailError;
          toast({
            title: `Session ${status}, email failed`,
            description: failedEmail
              ? `Email to ${failedEmail} failed${failedReason ? `: ${failedReason}` : ""}.`
              : "Status changed, but email delivery may have failed.",
            variant: "destructive",
          });
        }
      }
    }

    await loadData();
  };

  const statCards = [
    { label: "Total Earnings", value: `₹${stats.totalEarnings}`, icon: Wallet, bgColor: "bg-[#E5F6D3]", iconColor: "text-[#4a7a2a]" },
    { label: "Pending", value: `₹${stats.pendingEarnings}`, icon: IndianRupee, bgColor: "bg-[#fff9c4]", iconColor: "text-[#d4a017]" },
    { label: "Completed", value: stats.completed, icon: BookOpen, bgColor: "bg-[#ff5a5a]/20", iconColor: "text-[#ff5a5a]" },
    { label: "Avg Rating", value: stats.rating ? `${stats.rating}★` : "–", icon: Star, bgColor: "bg-[#2d5da1]/20", iconColor: "text-[#2d5da1]" },
  ];

  if (loading) {
    return (
      <DashboardLayout role="tutor">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="tutor">
      <div className="space-y-4 max-w-7xl w-full mx-auto relative z-10 h-[calc(100vh-8.5rem)] flex flex-col">
        {/* Playful doodle decorations */}
        <div className="absolute top-0 right-10 -z-10 opacity-30 pointer-events-none animate-float hidden md:block">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#90be6d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <div className="absolute bottom-20 right-8 -z-10 opacity-20 pointer-events-none animate-wiggle hidden lg:block">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2d5da1" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
        </div>

        {/* Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
          <div>
            <h1 className="font-kalam text-2xl md:text-3xl font-bold text-hd-ink mb-1">Tutor Dashboard</h1>
            <p className="text-hd-ink/70 font-medium text-sm">Welcome back, {user?.user_metadata?.full_name?.split(" ")[0] || "Tutor"}! 📚</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-[#E5F6D3] text-hd-ink hover:bg-[#d0edba] border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl font-bold text-sm h-10 px-4">
              <Link to="/sessions"><CalendarDays className="mr-1.5 h-4 w-4" /> Sessions</Link>
            </Button>
            <Button variant="outline" asChild className="bg-white text-hd-ink hover:bg-hd-muted border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl font-bold text-sm h-10 px-4">
              <Link to="/messages"><MessageSquare className="mr-1.5 h-4 w-4" /> Messages</Link>
            </Button>
            <Button variant="outline" asChild className="bg-white text-hd-ink hover:bg-hd-muted border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl font-bold text-sm h-10 px-4 hidden sm:flex">
              <Link to="/tutor/setup"><UserCog className="mr-1.5 h-4 w-4" /> Edit Profile</Link>
            </Button>
            <Button variant="outline" asChild className="bg-white text-hd-ink hover:bg-hd-muted border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl font-bold text-sm h-10 px-4 hidden md:flex">
              <Link to="/settings"><Settings className="mr-1.5 h-4 w-4" /> Settings</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 shrink-0">
          {statCards.map((s) => (
            <Card key={s.label} className="border-2 border-hd-ink rounded-xl shadow-[2px_2px_0px_0px_#2d2d2d] bg-white overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
              <CardContent className="flex items-center gap-3 p-3">
                <div className={`rounded-lg ${s.bgColor} p-2 border border-hd-ink shadow-sm group-hover:scale-110 transition-transform`}>
                  <s.icon className={`h-4 w-4 ${s.iconColor}`} />
                </div>
                <div>
                  <p className="font-kalam text-2xl font-bold text-hd-ink leading-none mb-0.5">{s.value}</p>
                  <p className="text-xs font-semibold text-hd-ink/70">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Profile Completeness */}
        {profileComplete < 100 && (
          <Card className="border-2 border-hd-ink rounded-xl shadow-[2px_2px_0px_0px_#2d2d2d] bg-[#fff9c4]/50 shrink-0">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex-1 space-y-2">
                <p className="text-sm font-bold text-hd-ink">Profile {profileComplete}% complete</p>
                <Progress value={profileComplete} className="h-2" />
              </div>
              <Button size="sm" asChild className="bg-[#ff5a5a] text-white hover:bg-[#e04848] border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-lg font-bold text-xs h-8">
                <Link to="/tutor/setup"><UserCog className="mr-1 h-3.5 w-3.5" /> Complete</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Top Row: Pending Requests & Upcoming Sessions */}
          <div className="grid gap-4 lg:grid-cols-2 flex-1 min-h-0">

            {/* Pending Requests */}
            <Card className="border-[3px] border-hd-ink rounded-xl shadow-[4px_4px_0px_0px_#2d2d2d] bg-white flex flex-col min-h-0 h-full relative overflow-hidden">
              <div className="absolute -top-2 -left-2 animate-wiggle hidden md:block z-10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffd166" stroke="#2d2d2d" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
              </div>
              <CardHeader className="border-b-2 border-hd-ink border-dashed pb-2 pt-3 px-4 shrink-0 z-10 bg-white/80 backdrop-blur-sm">
                <CardTitle className="font-kalam text-xl">Pending Requests</CardTitle>
              </CardHeader>
              <CardContent className="p-3 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar z-10 relative">
                {pending.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-4 text-center h-full border-2 border-hd-ink border-dashed rounded-lg bg-[#fdfbf7]/80 backdrop-blur-sm">
                    <p className="font-kalam text-lg font-bold text-hd-ink mb-1">No pending requests.</p>
                    <p className="text-xs font-medium text-hd-ink/60">New session requests will appear here ✨</p>
                  </div>
                ) : (
                  pending.map((s) => (
                    <div key={s.id} className="flex flex-col gap-1.5 rounded-lg border-2 border-hd-ink p-2.5 bg-[#fdfbf7]/90 backdrop-blur-sm hover:shadow-[2px_2px_0px_0px_#2d2d2d] transition-shadow duration-300 relative">
                      <div className="flex justify-between items-start w-full gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[13px] text-hd-ink leading-tight truncate">{s.subject}</p>
                          <p className="text-xs font-semibold text-hd-ink/80 flex items-center gap-1.5 mt-0.5 truncate">
                            <Avatar className="h-4 w-4 border border-hd-ink">
                              <AvatarFallback className="bg-[#90be6d] text-[10px] text-white font-bold">{(s.student_name || "S").charAt(0)}</AvatarFallback>
                            </Avatar>
                            {s.student_name}
                          </p>
                        </div>
                        <Badge className="px-2 py-0.5 text-[10px] font-bold rounded shrink-0 whitespace-nowrap bg-[#ffd166] text-hd-ink border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d]">
                          Pending
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-[10px] font-bold text-hd-ink/60 bg-white border border-hd-ink/20 px-1.5 py-0.5 rounded">
                          {format(new Date(s.session_date), "MMM d")} · {s.start_time.slice(0, 5)}
                        </p>
                        <div className="flex gap-1.5">
                          <Button size="sm" className="h-6 px-2 text-[10px] bg-[#90be6d] text-white hover:bg-[#7aae57] border-2 border-hd-ink rounded shadow-[1px_1px_0px_0px_#2d2d2d] font-bold" onClick={() => handleAction(s.id, "confirmed")}>
                            <CheckCircle className="mr-0.5 h-3 w-3" /> Accept
                          </Button>
                          <Button size="sm" className="h-6 px-2 text-[10px] bg-white text-[#ff5a5a] hover:bg-[#FFF0F1] border-2 border-hd-ink rounded shadow-[1px_1px_0px_0px_#2d2d2d] font-bold" onClick={() => handleAction(s.id, "declined")}>
                            <XCircle className="mr-0.5 h-3 w-3" /> Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Upcoming Sessions */}
            <Card className="border-[3px] border-hd-ink rounded-xl shadow-[4px_4px_0px_0px_#2d2d2d] bg-white flex flex-col min-h-0 relative overflow-hidden">
              <div className="absolute top-2 right-4 opacity-50 animate-bounce-gentle">
                <CalendarDays className="w-5 h-5 text-[#2d5da1]" />
              </div>
              <div className="absolute top-1 right-12 opacity-70 animate-float hidden md:block pointer-events-none">
                <svg width="40" height="20" viewBox="0 0 40 20" fill="none" stroke="#2d2d2d" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 4">
                  <path d="M5,15 Q20,15 35,5" />
                  <polygon points="35,5 30,3 32,8" fill="white" stroke="#2d2d2d" strokeDasharray="none" />
                </svg>
              </div>
              <CardHeader className="border-b-2 border-hd-ink border-dashed pb-2 pt-3 px-4 shrink-0">
                <CardTitle className="font-kalam text-xl">Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent className="p-3 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar">
                {upcoming.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-4 text-center h-full border-2 border-hd-ink border-dashed rounded-lg bg-[#fdfbf7]">
                    <p className="font-kalam text-lg font-bold text-hd-ink mb-1">No upcoming sessions.</p>
                    <p className="text-xs font-medium text-hd-ink/60">Confirmed sessions will show up here 📅</p>
                  </div>
                ) : (
                  upcoming.map((s) => (
                    <div key={s.id} className="flex flex-col gap-1.5 rounded-lg border-2 border-hd-ink p-2.5 bg-[#fdfbf7]/90 backdrop-blur-sm hover:shadow-[2px_2px_0px_0px_#2d2d2d] transition-shadow duration-300">
                      <div className="flex justify-between items-start w-full gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[13px] text-hd-ink leading-tight truncate">{s.subject}</p>
                          <p className="text-xs font-semibold text-hd-ink/80 flex items-center gap-1.5 mt-0.5 truncate">
                            <Avatar className="h-4 w-4 border border-hd-ink">
                              <AvatarFallback className="bg-[#2d5da1] text-[10px] text-white font-bold">{(s.student_name || "S").charAt(0)}</AvatarFallback>
                            </Avatar>
                            {s.student_name}
                          </p>
                        </div>
                        <Badge className="px-2 py-0.5 text-[10px] font-bold rounded shrink-0 whitespace-nowrap bg-[#90be6d] text-white border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d]">
                          Confirmed
                        </Badge>
                      </div>
                      <p className="text-[10px] font-bold text-hd-ink/60 bg-white border border-hd-ink/20 px-1.5 py-0.5 rounded w-fit">
                        {format(new Date(s.session_date), "MMM d")} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom: Recent Reviews (Full Width) */}
          <Card className="border-[3px] border-hd-ink rounded-xl shadow-[4px_4px_0px_0px_#2d2d2d] bg-white flex flex-col shrink-0 min-h-[180px] max-h-[240px] relative overflow-hidden">
            <div className="absolute top-4 left-4 z-10">
              <Star className="w-5 h-5 text-[#ffd166] fill-[#ffd166]" />
            </div>
            <div className="absolute bottom-4 right-6 opacity-20 pointer-events-none hidden lg:block">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#2d2d2d" strokeWidth="1.5" strokeLinecap="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <CardHeader className="pb-2 pt-4 px-12 shrink-0 z-10 bg-white/60 backdrop-blur-sm border-b-2 border-hd-ink border-dashed">
              <CardTitle className="font-kalam text-xl">Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent className="p-3 overflow-y-auto space-y-2 flex-1 custom-scrollbar z-10 relative">
              {reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-4 text-center h-full border-2 border-hd-ink border-dashed rounded-lg bg-[#fdfbf7]/80 backdrop-blur-sm w-fit min-w-[200px]">
                  <p className="font-kalam text-lg font-bold text-hd-ink mb-1">No reviews yet.</p>
                  <p className="text-xs font-medium text-hd-ink/60">Student reviews will appear here ⭐</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="rounded-lg border-2 border-hd-ink p-2.5 bg-[#fdfbf7]/90 backdrop-blur-sm hover:shadow-[2px_2px_0px_0px_#2d2d2d] transition-all hover:-translate-y-0.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm text-hd-ink truncate">{r.student_name}</p>
                        <div className="flex gap-0.5 shrink-0">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-[#ffd166] text-[#ffd166]" : "text-hd-muted"}`} />
                          ))}
                        </div>
                      </div>
                      {r.review_text && <p className="text-xs font-medium text-hd-ink/70 line-clamp-2">{r.review_text}</p>}
                      <p className="text-[10px] font-bold text-hd-ink/50">{format(new Date(r.created_at), "MMM d, yyyy")}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TutorDashboard;
