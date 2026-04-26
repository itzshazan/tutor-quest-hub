import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, MessageSquare, Search, Star, BookOpen, Users, Clock, Heart, Settings, CreditCard, Loader2 } from "lucide-react";
import { useSavedTutors } from "@/hooks/useSavedTutors";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

interface SessionRow {
  id: string;
  tutor_id: string;
  subject: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  tutor_name?: string;
  payment_status?: string | null;
}

interface ConvoRow {
  id: string;
  tutor_id: string;
  updated_at: string;
  tutor_name?: string;
  tutor_avatar?: string | null;
  last_message?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-[#ffd166] text-hd-ink border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d]",
  confirmed: "bg-[#90be6d] text-white border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d]",
  payment_pending: "bg-[#ff5a5a] text-white border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d]",
  completed: "bg-hd-muted text-hd-ink border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d]",
  cancelled: "bg-red-200 text-red-900 border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d]",
  declined: "bg-red-200 text-red-900 border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d]",
};

interface SavedTutorRow {
  tutor_id: string;
  full_name: string;
  subject: string;
  avatar_url: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Confirmation",
  confirmed: "Payment Required",
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { savedIds, toggle: toggleSave } = useSavedTutors(user?.id);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [conversations, setConversations] = useState<ConvoRow[]>([]);
  const [savedTutors, setSavedTutors] = useState<SavedTutorRow[]>([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, tutors: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);
  const [payingSessionId, setPayingSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const uid = user.id;

    // Sessions
    const { data: sessData } = await supabase
      .from("sessions")
      .select("id, tutor_id, subject, session_date, start_time, end_time, status")
      .eq("student_id", uid)
      .order("session_date", { ascending: true });

    const allSessions = sessData || [];
    const upcoming = allSessions.filter(
      (s) => s.status !== "completed" && s.status !== "cancelled" && s.status !== "declined"
    );

    // Enrich with tutor names
    const tutorIds = [...new Set(allSessions.map((s) => s.tutor_id))];
    let tutorMap: Record<string, string> = {};
    if (tutorIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", tutorIds);
      profiles?.forEach((p) => (tutorMap[p.user_id] = p.full_name));
    }

    // Fetch payment status for upcoming sessions
    const sessionIds = upcoming.map((s) => s.id);
    let paymentMap: Record<string, string> = {};
    if (sessionIds.length) {
      const { data: payments } = await supabase
        .from("payments")
        .select("session_id, payment_status")
        .in("session_id", sessionIds);
      payments?.forEach((p) => {
        if (p.session_id) paymentMap[p.session_id] = p.payment_status;
      });
    }

    const enriched = upcoming.slice(0, 4).map((s) => ({
      ...s,
      tutor_name: tutorMap[s.tutor_id] || "Tutor",
      payment_status: paymentMap[s.id] || null,
    }));
    setSessions(enriched);

    // Reviews count
    const { count: reviewCount } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("student_id", uid);

    // Conversations
    const { data: convos } = await supabase
      .from("conversations")
      .select("id, tutor_id, updated_at")
      .eq("student_id", uid)
      .order("updated_at", { ascending: false })
      .limit(4);

    const convoTutorIds = [...new Set((convos || []).map((c) => c.tutor_id))];
    let convoTutorMap: Record<string, { name: string; avatar: string | null }> = {};
    if (convoTutorIds.length) {
      const { data: cp } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", convoTutorIds);
      cp?.forEach((p) => (convoTutorMap[p.user_id] = { name: p.full_name, avatar: p.avatar_url }));
    }

    const enrichedConvos: ConvoRow[] = [];
    for (const c of convos || []) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("content")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1);
      enrichedConvos.push({
        ...c,
        tutor_name: convoTutorMap[c.tutor_id]?.name || "Tutor",
        tutor_avatar: convoTutorMap[c.tutor_id]?.avatar,
        last_message: msgs?.[0]?.content,
      });
    }
    setConversations(enrichedConvos);

    // Saved tutors
    const { data: savedData } = await supabase
      .from("saved_tutors")
      .select("tutor_id")
      .eq("student_id", uid);

    if (savedData && savedData.length > 0) {
      const savedTutorIds = savedData.map((s: any) => s.tutor_id);
      const { data: tp } = await supabase
        .from("tutor_profiles")
        .select("user_id, subject")
        .in("user_id", savedTutorIds);
      const { data: sp } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", savedTutorIds);

      const profileMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
      sp?.forEach((p) => (profileMap[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url }));

      const merged: SavedTutorRow[] = (tp || []).map((t: any) => ({
        tutor_id: t.user_id,
        full_name: profileMap[t.user_id]?.full_name || "Tutor",
        subject: t.subject,
        avatar_url: profileMap[t.user_id]?.avatar_url,
      })).slice(0, 4); // Limit to 4 to save space
      setSavedTutors(merged);
    }

    setStats({
      total: allSessions.length,
      upcoming: upcoming.length,
      tutors: tutorIds.length,
      reviews: reviewCount || 0,
    });
    setLoading(false);
  };

  const getPaymentErrorMessage = async (err: any) => {
    if (err?.context) {
      try {
        const payload = await err.context.json();
        const serverMessage = payload?.error || payload?.message || payload?.details;
        if (typeof serverMessage === "string" && serverMessage.trim()) {
          return serverMessage;
        }
      } catch {
        // Ignore non-JSON function responses
      }
    }

    if (typeof err?.message === "string" && err.message.trim()) {
      const isGenericHttpMessage = err.message.toLowerCase().includes("non-2xx");
      if (!isGenericHttpMessage) {
        return err.message;
      }
    }

    return "Could not initiate payment";
  };

  const handlePay = async (sessionId: string) => {
    setPayingSessionId(sessionId);
    try {
      const { data, error } = await supabase.functions.invoke("create-session-payment", {
        body: { session_id: sessionId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      const description = await getPaymentErrorMessage(err);
      toast({ title: "Payment failed", description, variant: "destructive" });
    }
    setPayingSessionId(null);
  };

  const getStatusDisplay = (s: SessionRow) => {
    if (s.status === "confirmed" && (!s.payment_status || s.payment_status === "failed")) {
      return { label: "Pay Now", color: "bg-[#ff5a5a] text-white border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d]" };
    }
    if (s.status === "confirmed" && s.payment_status === "pending") {
      return { label: "Payment Held", color: "bg-[#ffd166] text-hd-ink border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d]" };
    }
    if (s.status === "confirmed" && s.payment_status === "completed") {
      return { label: "Confirmed", color: "bg-[#90be6d] text-white border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d]" };
    }
    return { label: STATUS_LABELS[s.status]?.replace("Payment Required", "Pay Now")?.replace("Pending Confirmation", "Pending") || s.status, color: STATUS_COLORS[s.status] || "border-2 border-hd-ink" };
  };

  const statCards = [
    { label: "Total Sessions", value: stats.total, icon: BookOpen, bgColor: "bg-[#fff9c4]", iconColor: "text-[#d4a017]" },
    { label: "Upcoming", value: stats.upcoming, icon: Clock, bgColor: "bg-[#ff5a5a]/20", iconColor: "text-[#ff5a5a]" },
    { label: "Tutors", value: stats.tutors, icon: Users, bgColor: "bg-[#90be6d]/20", iconColor: "text-[#4a7a2a]" },
    { label: "Reviews Given", value: stats.reviews, icon: Star, bgColor: "bg-[#2d5da1]/20", iconColor: "text-[#2d5da1]" },
  ];

  if (loading) {
    return (
      <DashboardLayout role="student">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      {/* Container: strictly calculated height to fit viewport including parent padding */}
      <div className="space-y-4 max-w-7xl w-full mx-auto relative z-10 h-[calc(100vh-8.5rem)] flex flex-col">
        {/* Playful doodle */}
        <div className="absolute top-0 right-10 -z-10 opacity-30 pointer-events-none animate-float hidden md:block">
           <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffd166" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>

        {/* Header & Quick Actions in one flex row on desktop */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
          <div>
            <h1 className="font-kalam text-2xl md:text-3xl font-bold text-hd-ink mb-1">My Dashboard</h1>
            <p className="text-hd-ink/70 font-medium text-sm">Ready to learn, {user?.user_metadata?.full_name?.split(" ")[0] || "Student"}? 🚀</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-[#fff9c4] text-hd-ink hover:bg-[#fff07c] border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl font-bold text-sm h-10 px-4">
              <Link to="/find-tutors"><Search className="mr-1.5 h-4 w-4" /> Find Tutors</Link>
            </Button>
            <Button variant="outline" asChild className="bg-white text-hd-ink hover:bg-hd-muted border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl font-bold text-sm h-10 px-4 hidden sm:flex">
              <Link to="/sessions"><CalendarDays className="mr-1.5 h-4 w-4" /> Sessions</Link>
            </Button>
            <Button variant="outline" asChild className="bg-white text-hd-ink hover:bg-hd-muted border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl font-bold text-sm h-10 px-4">
              <Link to="/messages"><MessageSquare className="mr-1.5 h-4 w-4" /> Messages</Link>
            </Button>
            <Button variant="outline" asChild className="bg-white text-hd-ink hover:bg-hd-muted border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl font-bold text-sm h-10 px-4 hidden md:flex">
              <Link to="/settings"><Settings className="mr-1.5 h-4 w-4" /> Settings</Link>
            </Button>
          </div>
        </div>

        {/* Stats - Shrink height, flex to shrink-0 */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 shrink-0">
          {statCards.map((s) => (
            <Card key={s.label} className="border-2 border-hd-ink rounded-xl shadow-[2px_2px_0px_0px_#2d2d2d] bg-white overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
              <CardContent className="flex items-center gap-3 p-3">
                <div className={`rounded-lg ${s.bgColor} p-2 border border-hd-ink shadow-sm group-hover:scale-110 transition-transform`}>
                  <s.icon className={`h-4 w-4 ${s.iconColor}`} />
                </div>
                <div>
                  <p className="font-kalam text-2xl font-bold text-hd-ink leading-none mb-0.5">{loading ? "–" : s.value}</p>
                  <p className="text-xs font-semibold text-hd-ink/70">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Layout matching reference arrangement */}
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          
          {/* Top Row: Upcoming Sessions & Messages */}
          <div className="grid gap-4 lg:grid-cols-[3fr_2fr] flex-1 min-h-0">
            
            {/* Left Column: Upcoming Sessions */}
            <Card className="border-[3px] border-hd-ink rounded-xl shadow-[4px_4px_0px_0px_#2d2d2d] bg-white flex flex-col min-h-0 h-full relative overflow-hidden">
               <div className="absolute -top-2 -left-2 animate-wiggle hidden md:block z-10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#ff5a5a" stroke="#2d2d2d" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
              </div>

              <CardHeader className="border-b-2 border-hd-ink border-dashed pb-2 pt-3 px-4 shrink-0 z-10 bg-white/80 backdrop-blur-sm">
                <CardTitle className="font-kalam text-xl">Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent className="p-3 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar z-10 relative">
                {loading ? (
                  <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-[#ff5a5a]" /></div>
                ) : sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-4 text-center h-full border-2 border-hd-ink border-dashed rounded-lg bg-[#fdfbf7]/80 backdrop-blur-sm">
                    <p className="font-kalam text-lg font-bold text-hd-ink mb-1">No upcoming sessions.</p>
                    <Button asChild size="sm" className="bg-[#ff5a5a] text-white hover:bg-[#e04848] border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-lg font-bold text-xs h-8 mt-2">
                      <Link to="/find-tutors">Find a tutor to get started!</Link>
                    </Button>
                  </div>
                ) : (
                  sessions.map((s) => {
                    const statusDisplay = getStatusDisplay(s);
                    const needsPayment = s.status === "confirmed" && (!s.payment_status || s.payment_status === "failed");
                    return (
                      <div key={s.id} className="flex flex-col gap-1.5 rounded-lg border-2 border-hd-ink p-2.5 bg-[#fdfbf7]/90 backdrop-blur-sm hover:shadow-[2px_2px_0px_0px_#2d2d2d] transition-shadow duration-300 relative w-full lg:w-[80%]">
                        <div className="flex justify-between items-start w-full gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[13px] text-hd-ink leading-tight truncate">{s.subject}</p>
                            <p className="text-xs font-semibold text-hd-ink/80 flex items-center gap-1.5 mt-0.5 truncate">
                              <Avatar className="h-4 w-4 border border-hd-ink">
                                <AvatarFallback className="bg-[#ffd166] text-[10px] text-hd-ink font-bold">{(s.tutor_name || "T").charAt(0)}</AvatarFallback>
                              </Avatar>
                              {s.tutor_name}
                            </p>
                          </div>
                          <Badge className={`px-2 py-0.5 text-[10px] font-bold rounded shrink-0 whitespace-nowrap ${statusDisplay.color}`}>
                            {statusDisplay.label}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-[10px] font-bold text-hd-ink/60 bg-white border border-hd-ink/20 px-1.5 py-0.5 rounded">
                            {format(new Date(s.session_date), "MMM d")} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                          </p>
                          {needsPayment && (
                            <Button size="sm" className="h-6 px-2 text-[10px] bg-[#ff5a5a] text-white hover:bg-[#e04848] border-2 border-hd-ink rounded shadow-[1px_1px_0px_0px_#2d2d2d] font-bold" onClick={() => handlePay(s.id)} disabled={payingSessionId === s.id}>
                              {payingSessionId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Pay Now"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Right Column: Recent Messages */}
            <Card className="border-[3px] border-hd-ink rounded-xl shadow-[4px_4px_0px_0px_#2d2d2d] bg-white flex flex-col min-h-0 relative">
              <div className="absolute top-2 right-4 opacity-50 animate-bounce-gentle">
                <MessageSquare className="w-5 h-5 text-[#90be6d]" />
              </div>
              {/* Paper airplane doodle */}
              <div className="absolute top-1 right-12 opacity-70 animate-float hidden md:block pointer-events-none">
                <svg width="40" height="20" viewBox="0 0 40 20" fill="none" stroke="#2d2d2d" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 4">
                  <path d="M5,15 Q20,15 35,5" />
                  <polygon points="35,5 30,3 32,8" fill="white" stroke="#2d2d2d" strokeDasharray="none" />
                </svg>
              </div>
              <CardHeader className="border-b-2 border-hd-ink border-dashed pb-2 pt-3 px-4 shrink-0">
                <CardTitle className="font-kalam text-xl">Recent Messages</CardTitle>
              </CardHeader>
              <CardContent className="p-3 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
                {loading ? (
                  <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-[#90be6d]" /></div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-4 text-center h-full border-2 border-hd-ink border-dashed rounded-lg bg-[#fdfbf7]">
                    <p className="font-kalam text-lg font-bold text-hd-ink mb-1">It's quiet here...</p>
                  </div>
                ) : (
                  conversations.map((c) => (
                    <Link
                      key={c.id}
                      to="/messages"
                      className="flex items-center gap-3 rounded-lg border-2 border-hd-ink p-2.5 bg-white hover:shadow-[2px_2px_0px_0px_#2d2d2d] transition-all hover:-translate-y-0.5 group"
                    >
                      <Avatar className="h-9 w-9 border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] group-hover:scale-105 transition-transform">
                        <AvatarImage src={c.tutor_avatar || undefined} />
                        <AvatarFallback className="bg-[#90be6d] text-white font-bold text-sm">
                          {c.tutor_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-hd-ink truncate">{c.tutor_name}</p>
                        <p className="text-xs font-medium text-hd-ink/60 truncate mt-0.5">{c.last_message || "No messages yet"}</p>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row: Saved Tutors (Full Width) */}
          <Card className="border-[3px] border-hd-ink rounded-xl shadow-[4px_4px_0px_0px_#2d2d2d] bg-white flex flex-col shrink-0 h-[220px] relative overflow-hidden">
            <div className="absolute top-4 left-4 z-10">
              <Heart className="w-5 h-5 stroke-[#ff5a5a] text-[#ff5a5a]" fill="none" strokeWidth="2" />
            </div>

            {/* Boy on laptop illustration */}
            <img src="/ref-student.png" alt="Student on laptop" className="absolute bottom-0 right-[5%] w-40 md:w-60 opacity-100 pointer-events-none z-0" />

            {/* Paper plane doodle pointing to boy */}
            <div className="absolute bottom-10 right-[35%] opacity-70 hidden lg:block pointer-events-none">
              <svg width="60" height="40" viewBox="0 0 60 40" fill="none" stroke="#2d2d2d" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 4">
                <path d="M10,30 Q30,40 50,20" />
                <polygon points="50,20 45,18 48,25" fill="white" stroke="#2d2d2d" strokeDasharray="none" />
              </svg>
            </div>

            <CardHeader className="pb-2 pt-4 px-12 shrink-0 z-10 bg-white/60 backdrop-blur-sm border-b-2 border-hd-ink border-dashed">
              <CardTitle className="font-kalam text-xl">Saved Tutors</CardTitle>
            </CardHeader>
            <CardContent className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar z-10 relative">
              {loading ? (
                <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-[#ffd166]" /></div>
              ) : savedTutors.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-4 text-center h-full border-2 border-hd-ink border-dashed rounded-lg bg-[#fdfbf7]/80 backdrop-blur-sm w-fit min-w-[200px]">
                   <p className="font-kalam text-lg font-bold text-hd-ink mb-1">No favorites yet.</p>
                   <p className="text-xs font-medium text-hd-ink/70">
                     <Link to="/find-tutors" className="text-[#ff5a5a] underline decoration-2 hover:text-[#e04848]">Browse tutors</Link>
                   </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full lg:w-[65%]">
                  {savedTutors.map((t) => (
                    <div key={t.tutor_id} className="flex items-center gap-3 rounded-lg border-2 border-hd-ink p-2.5 bg-[#fdfbf7]/90 backdrop-blur-sm hover:shadow-[2px_2px_0px_0px_#2d2d2d] transition-all hover:-translate-y-0.5">
                      <Avatar className="h-10 w-10 border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d]">
                        <AvatarImage src={t.avatar_url || undefined} />
                        <AvatarFallback className="bg-[#ffd166] text-hd-ink font-bold text-xs">
                          {t.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <Link to={`/tutor/${t.tutor_id}`} className="font-bold text-[14px] text-hd-ink hover:text-[#ff5a5a] truncate block leading-tight">{t.full_name}</Link>
                        <p className="text-[11px] font-semibold text-hd-ink/60 truncate mt-0.5">{t.subject}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-transparent shrink-0" onClick={() => toggleSave(t.tutor_id)}>
                        <Heart className="h-5 w-5 fill-[#ff5a5a] text-[#ff5a5a] hover:scale-110 transition-transform" />
                      </Button>
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

export default StudentDashboard;
