import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, MessageSquare, Search, Star, BookOpen, Users, Clock, Heart } from "lucide-react";
import { useSavedTutors } from "@/hooks/useSavedTutors";
import { format } from "date-fns";

interface SessionRow {
  id: string;
  tutor_id: string;
  subject: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  tutor_name?: string;
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
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/20 text-destructive",
  declined: "bg-destructive/20 text-destructive",
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [conversations, setConversations] = useState<ConvoRow[]>([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, tutors: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);

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

    const enriched = upcoming.slice(0, 5).map((s) => ({
      ...s,
      tutor_name: tutorMap[s.tutor_id] || "Tutor",
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

    setStats({
      total: allSessions.length,
      upcoming: upcoming.length,
      tutors: tutorIds.length,
      reviews: reviewCount || 0,
    });
    setLoading(false);
  };

  const statCards = [
    { label: "Total Sessions", value: stats.total, icon: BookOpen, color: "text-primary" },
    { label: "Upcoming", value: stats.upcoming, icon: Clock, color: "text-secondary" },
    { label: "Tutors", value: stats.tutors, icon: Users, color: "text-accent-foreground" },
    { label: "Reviews Given", value: stats.reviews, icon: Star, color: "text-accent-foreground" },
  ];

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
                sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{s.subject}</p>
                      <p className="text-sm text-muted-foreground">with {s.tutor_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(s.session_date), "MMM d, yyyy")} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <Badge className={STATUS_COLORS[s.status] || ""}>{s.status}</Badge>
                  </div>
                ))
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
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
