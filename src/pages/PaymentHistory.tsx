import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, IndianRupee, Filter, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number;
  platform_commission: number;
  tutor_earnings: number;
  payment_status: string;
  created_at: string;
  captured_at: string | null;
  refunded_at: string | null;
  session_id: string | null;
  student_id: string;
  tutor_id: string;
  stripe_checkout_session_id: string | null;
  otherName?: string;
  subject?: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Held in Escrow", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  refunded: { label: "Refunded", variant: "destructive" },
  failed: { label: "Failed", variant: "destructive" },
};

export default function PaymentHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [userRole, setUserRole] = useState<"student" | "tutor">("student");
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, refunded: 0 });

  useEffect(() => {
    if (!user) return;
    loadRole();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadPayments();
  }, [user, userRole, statusFilter, dateFrom, dateTo]);

  const loadRole = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user!.id)
      .single();
    if (data) setUserRole(data.role === "tutor" ? "tutor" : "student");
  };

  const loadPayments = async () => {
    setLoading(true);
    const column = userRole === "tutor" ? "tutor_id" : "student_id";
    let query = supabase
      .from("payments")
      .select("*")
      .eq(column, user!.id)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("payment_status", statusFilter);
    }
    if (dateFrom) {
      query = query.gte("created_at", dateFrom.toISOString());
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte("created_at", endOfDay.toISOString());
    }

    const { data: paymentsData } = await query;
    if (!paymentsData) { setLoading(false); return; }

    // Enrich with names and subjects
    const otherIds = [...new Set(paymentsData.map(p => userRole === "tutor" ? p.student_id : p.tutor_id))];
    const sessionIds = [...new Set(paymentsData.filter(p => p.session_id).map(p => p.session_id!))];

    const [profilesRes, sessionsRes] = await Promise.all([
      otherIds.length > 0
        ? supabase.from("profiles").select("user_id, full_name").in("user_id", otherIds)
        : Promise.resolve({ data: [] }),
      sessionIds.length > 0
        ? supabase.from("sessions").select("id, subject").in("id", sessionIds)
        : Promise.resolve({ data: [] }),
    ]);

    const nameMap = new Map((profilesRes.data || []).map(p => [p.user_id, p.full_name]));
    const subjectMap = new Map((sessionsRes.data || []).map(s => [s.id, s.subject]));

    const enriched = paymentsData.map(p => ({
      ...p,
      otherName: nameMap.get(userRole === "tutor" ? p.student_id : p.tutor_id) || "Unknown",
      subject: p.session_id ? subjectMap.get(p.session_id) || "N/A" : "N/A",
    }));

    setPayments(enriched);

    // Compute stats from all payments (not filtered)
    const allQuery = supabase.from("payments").select("amount, payment_status").eq(column, user!.id);
    const { data: allPayments } = await allQuery;
    if (allPayments) {
      setStats({
        total: allPayments.reduce((s, p) => s + Number(p.amount), 0),
        completed: allPayments.filter(p => p.payment_status === "completed").reduce((s, p) => s + Number(p.amount), 0),
        pending: allPayments.filter(p => p.payment_status === "pending").reduce((s, p) => s + Number(p.amount), 0),
        refunded: allPayments.filter(p => p.payment_status === "refunded").reduce((s, p) => s + Number(p.amount), 0),
      });
    }

    setLoading(false);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Please log in to view payment history.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Payment History</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Completed", value: stats.completed, color: "text-green-600" },
            { label: "In Escrow", value: stats.pending, color: "text-amber-600" },
            { label: "Refunded", value: stats.refunded, color: "text-destructive" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className={cn("text-2xl font-bold flex items-center gap-1", s.color)}>
                  <IndianRupee className="h-5 w-5" />
                  {s.value.toLocaleString("en-IN")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">In Escrow</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">From</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd MMM yyyy") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">To</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd MMM yyyy") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              {(statusFilter !== "all" || dateFrom || dateTo) && (
                <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transactions ({payments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <IndianRupee className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No transactions found</p>
                <p className="text-sm">Payments will appear here once sessions are booked and paid.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {payments.map(payment => {
                  const config = STATUS_CONFIG[payment.payment_status] || STATUS_CONFIG.pending;
                  const displayAmount = userRole === "tutor" ? payment.tutor_earnings : payment.amount;
                  return (
                    <div key={payment.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {payment.subject} — {payment.otherName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(payment.created_at), "dd MMM yyyy, hh:mm a")}
                          {payment.captured_at && (
                            <span> · Released {format(new Date(payment.captured_at), "dd MMM")}</span>
                          )}
                          {payment.refunded_at && (
                            <span> · Refunded {format(new Date(payment.refunded_at), "dd MMM")}</span>
                          )}
                        </p>
                        {userRole === "student" && payment.payment_status === "completed" && (
                          <p className="text-xs text-muted-foreground">
                            Commission: ₹{payment.platform_commission} · Tutor received: ₹{payment.tutor_earnings}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={config.variant}>{config.label}</Badge>
                        <span className={cn(
                          "font-bold text-lg flex items-center",
                          payment.payment_status === "refunded" ? "text-destructive" : "text-foreground"
                        )}>
                          {payment.payment_status === "refunded" ? "-" : ""}₹{displayAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
