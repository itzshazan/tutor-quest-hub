import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, GraduationCap, CalendarDays, Star } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalTutors: number;
  totalStudents: number;
  totalSessions: number;
  totalReviews: number;
}

interface RecentUser {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalTutors: 0, totalStudents: 0, totalSessions: 0, totalReviews: 0 });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [profiles, sessions, reviews] = await Promise.all([
        supabase.from("profiles").select("id, full_name, role, created_at"),
        supabase.from("sessions").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
      ]);

      const users = profiles.data || [];
      setStats({
        totalUsers: users.length,
        totalTutors: users.filter((u) => u.role === "tutor").length,
        totalStudents: users.filter((u) => u.role === "student").length,
        totalSessions: sessions.count || 0,
        totalReviews: reviews.count || 0,
      });

      setRecentUsers(
        [...users]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
      );
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users },
    { label: "Tutors", value: stats.totalTutors, icon: GraduationCap },
    { label: "Students", value: stats.totalStudents, icon: Users },
    { label: "Sessions", value: stats.totalSessions, icon: CalendarDays },
    { label: "Reviews", value: stats.totalReviews, icon: Star },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
            {statCards.map((s) => (
              <Card key={s.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{s.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Signups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{u.full_name || "Unnamed"}</span>
                    <div className="flex items-center gap-3">
                      <span className="capitalize text-muted-foreground">{u.role}</span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                {recentUsers.length === 0 && <p className="text-muted-foreground">No users yet.</p>}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </AdminLayout>
  );
}
