import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { IndianRupee, TrendingUp, Users, Percent, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { exportToCSV } from "@/lib/exportUtils";

interface Payment {
  id: string;
  amount: number;
  tutor_earnings: number;
  platform_commission: number;
  payment_status: string;
  created_at: string;
  captured_at: string | null;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  commission: number;
}

export default function AdminRevenue() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    loadPayments();
  }, [dateRange]);

  const loadPayments = async () => {
    setLoading(true);
    const startDate = format(subDays(new Date(), parseInt(dateRange)), "yyyy-MM-dd");
    
    const { data } = await supabase
      .from("payments")
      .select("id, amount, tutor_earnings, platform_commission, payment_status, created_at, captured_at")
      .gte("created_at", startDate)
      .order("created_at", { ascending: false });

    setPayments(data || []);
    setLoading(false);
  };

  // Calculate stats
  const capturedPayments = payments.filter((p) => p.payment_status === "captured");
  const totalRevenue = capturedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCommission = capturedPayments.reduce((sum, p) => sum + p.platform_commission, 0);
  const totalTutorEarnings = capturedPayments.reduce((sum, p) => sum + p.tutor_earnings, 0);
  const avgCommissionRate = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0;

  // Build daily revenue chart data
  const dailyData: DailyRevenue[] = [];
  const days = parseInt(dateRange);
  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const dayStr = format(day, "yyyy-MM-dd");
    const dayPayments = capturedPayments.filter(
      (p) => p.captured_at && format(new Date(p.captured_at), "yyyy-MM-dd") === dayStr
    );
    dailyData.push({
      date: format(day, "MMM d"),
      revenue: dayPayments.reduce((sum, p) => sum + p.amount, 0),
      commission: dayPayments.reduce((sum, p) => sum + p.platform_commission, 0),
    });
  }

  const handleExport = () => {
    exportToCSV(
      payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        tutor_earnings: p.tutor_earnings,
        platform_commission: p.platform_commission,
        status: p.payment_status,
        created_at: p.created_at,
        captured_at: p.captured_at || "",
      })),
      `revenue-export-${format(new Date(), "yyyy-MM-dd")}`,
      [
        { key: "id", label: "Payment ID" },
        { key: "amount", label: "Amount (₹)" },
        { key: "tutor_earnings", label: "Tutor Earnings (₹)" },
        { key: "platform_commission", label: "Commission (₹)" },
        { key: "status", label: "Status" },
        { key: "created_at", label: "Created" },
        { key: "captured_at", label: "Captured" },
      ]
    );
  };

  const statCards = [
    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: IndianRupee, color: "text-primary" },
    { label: "Platform Commission", value: `₹${totalCommission.toLocaleString()}`, icon: TrendingUp, color: "text-secondary" },
    { label: "Tutor Payouts", value: `₹${totalTutorEarnings.toLocaleString()}`, icon: Users, color: "text-accent" },
    { label: "Avg Commission Rate", value: `${avgCommissionRate.toFixed(1)}%`, icon: Percent, color: "text-muted-foreground" },
  ];

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Revenue Dashboard</h1>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {statCards.map((s) => (
              <Card key={s.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{s.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="commission"
                      name="Commission"
                      stroke="hsl(var(--secondary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments Table */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">Amount</th>
                      <th className="px-4 py-3 text-left font-medium">Commission</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payments.slice(0, 10).map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">{format(new Date(p.created_at), "MMM d, yyyy")}</td>
                        <td className="px-4 py-3 font-medium">₹{p.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-muted-foreground">₹{p.platform_commission.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              p.payment_status === "captured"
                                ? "bg-primary/20 text-primary"
                                : p.payment_status === "refunded"
                                ? "bg-destructive/20 text-destructive"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {p.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          No payments in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </AdminLayout>
  );
}
