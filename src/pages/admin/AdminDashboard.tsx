import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, GraduationCap, CalendarDays, Star, IndianRupee } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, subDays } from "date-fns";
import { AdminDashboardSkeleton } from "@/components/skeletons/AdminDashboardSkeleton";

interface Stats {
  totalUsers: number;
  totalTutors: number;
  totalStudents: number;
  totalSessions: number;
  totalReviews: number;
  totalRevenue: number;
  totalCommission: number;
}

interface RecentUser {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface DailySignup {
  date: string;
  count: number;
}

interface SessionByStatus {
  status: string;
  count: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalTutors: 0, totalStudents: 0, totalSessions: 0, totalReviews: 0, totalRevenue: 0, totalCommission: 0
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [dailySignups, setDailySignups] = useState<DailySignup[]>([]);
  const [sessionsByStatus, setSessionsByStatus] = useState<SessionByStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [profiles, sessions, reviews, payments] = await Promise.all([
        supabase.from("profiles").select("id, full_name, role, created_at"),
        supabase.from("sessions").select("id, status, created_at"),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("amount, platform_commission, payment_status"),
      ]);

      const users = profiles.data || [];
      const sessionsData = sessions.data || [];
      const paymentsData = payments.data || [];
      
      // Calculate revenue from captured payments
      const capturedPayments = paymentsData.filter((p) => p.payment_status === "captured");
      const totalRevenue = capturedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalCommission = capturedPayments.reduce((sum, p) => sum + (p.platform_commission || 0), 0);

      setStats({
        totalUsers: users.length,
        totalTutors: users.filter((u) => u.role === "tutor").length,
        totalStudents: users.filter((u) => u.role === "student").length,
        totalSessions: sessionsData.length,
        totalReviews: reviews.count || 0,
        totalRevenue,
        totalCommission,
      });

      // Recent users
      setRecentUsers(
        [...users]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
      );

      // Daily signups for last 30 days
      const last30Days: DailySignup[] = [];
      for (let i = 29; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const dayStr = format(day, "yyyy-MM-dd");
        const count = users.filter((u) => format(new Date(u.created_at), "yyyy-MM-dd") === dayStr).length;
        last30Days.push({ date: format(day, "MMM d"), count });
      }
      setDailySignups(last30Days);

      // Sessions by status
      const statusCounts = sessionsData.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      setSessionsByStatus(
        Object.entries(statusCounts).map(([status, count]) => ({ status, count: count as number }))
      );

      setLoading(false);
    }
    load();
  }, []);

  const roleDistribution = [
    { name: "Students", value: stats.totalStudents },
    { name: "Tutors", value: stats.totalTutors },
  ];

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users },
    { label: "Tutors", value: stats.totalTutors, icon: GraduationCap },
    { label: "Students", value: stats.totalStudents, icon: Users },
    { label: "Sessions", value: stats.totalSessions, icon: CalendarDays },
    { label: "Reviews", value: stats.totalReviews, icon: Star },
    { label: "Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee },
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
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 mb-8">
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

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-3 mb-8">
            {/* Signups Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Signups (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailySignups}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        interval={4}
                      />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Signups"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {roleDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sessions by Status */}
          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Sessions by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sessionsByStatus} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis 
                        type="category" 
                        dataKey="status" 
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Signups */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Signups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{u.full_name || "Unnamed"}</span>
                      <div className="flex items-center gap-3">
                        <span className="capitalize text-muted-foreground">{u.role}</span>
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(u.created_at), "MMM d")}
                        </span>
                      </div>
                    </div>
                  ))}
                  {recentUsers.length === 0 && <p className="text-muted-foreground">No users yet.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
