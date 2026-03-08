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
  pending: "bg-accent/20 text-accent-foreground",
  confirmed: "bg-secondary/20 text-secondary",
  payment_pending: "bg-primary/20 text-primary",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/20 text-destructive",
  declined: "bg-destructive/20 text-destructive",
};

interface SavedTutorRow {
  tutor_id: string;
  full_name: string;
  subject: string;
  avatar_url: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Tutor Confirmation",
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

    const enriched = upcoming.slice(0, 5).map((s) => ({
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
      .limit(3);

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
      }));
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
      toast({ title: "Payment failed", description: err.message || "Could not initiate payment", variant: "destructive" });
    }
    setPayingSessionId(null);
  };

  const getStatusDisplay = (s: SessionRow) => {
    if (s.status === "confirmed" && (!s.payment_status || s.payment_status === "failed" || s.payment_status === "pending")) {
      return { label: "Payment Required", color: "bg-primary/20 text-primary" };
    }
    if (s.status === "confirmed" && s.payment_status === "completed") {
      return { label: "Session Confirmed", color: "bg-secondary/20 text-secondary" };
    }
    return { label: STATUS_LABELS[s.status] || s.status, color: STATUS_COLORS[s.status] || "" };
  };

  const statCards = [
    { label: "Total Sessions", value: stats.total, icon: BookOpen, color: "text-primary" },
    { label: "Upcoming", value: stats.upcoming, icon: Clock, color: "text-secondary" },
    { label: "Tutors", value: stats.tutors, icon: Users, color: "text-accent-foreground" },
    { label: "Reviews Given", value: stats.reviews, icon: Star, color: "text-accent-foreground" },
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
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.user_metadata?.full_name || "Student"}!</p>
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

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/find-tutors"><Search className="mr-2 h-4 w-4" /> Find Tutors</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/sessions"><CalendarDays className="mr-2 h-4 w-4" /> All Sessions</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/messages"><MessageSquare className="mr-2 h-4 w-4" /> Messages</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming sessions. <Link to="/find-tutors" className="text-primary hover:underline">Find a tutor</Link> to get started!</p>
              ) : (
                sessions.map((s) => {
                  const statusDisplay = getStatusDisplay(s);
                  const needsPayment = s.status === "confirmed" && (!s.payment_status || s.payment_status === "failed");
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{s.subject}</p>
                        <p className="text-sm text-muted-foreground">with {s.tutor_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(s.session_date), "MMM d, yyyy")} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {needsPayment && (
                          <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => handlePay(s.id)} disabled={payingSessionId === s.id}>
                            {payingSessionId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
                            Pay Now
                          </Button>
                        )}
                        <Badge className={statusDisplay.color}>{statusDisplay.label}</Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No conversations yet.</p>
              ) : (
                conversations.map((c) => (
                  <Link
                    key={c.id}
                    to="/messages"
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={c.tutor_avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {c.tutor_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground">{c.tutor_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.last_message || "No messages yet"}</p>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Saved Tutors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Heart className="h-4 w-4 text-destructive" /> Saved Tutors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : savedTutors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved tutors yet. <Link to="/find-tutors" className="text-primary hover:underline">Browse tutors</Link> and tap the heart icon to save.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {savedTutors.map((t) => (
                  <div key={t.tutor_id} className="flex items-center gap-3 rounded-lg border p-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={t.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {t.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <Link to={`/tutor/${t.tutor_id}`} className="font-medium text-sm text-foreground hover:underline">{t.full_name}</Link>
                      <p className="text-xs text-muted-foreground">{t.subject}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0 px-2" onClick={() => toggleSave(t.tutor_id)}>
                      <Heart className="h-4 w-4 fill-destructive text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
