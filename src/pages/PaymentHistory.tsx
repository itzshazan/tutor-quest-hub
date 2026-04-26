import { useCallback, useEffect, useState, type SVGProps } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

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

interface Stats {
  total: number;
  completed: number;
  pending: number;
  refunded: number;
}

interface ViewerProfile {
  full_name: string;
  avatar_url: string | null;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
  }
> = {
  pending: {
    label: "Held in Escrow",
    variant: "secondary",
    className: "bg-[#FEF3C7] text-[#B45309]",
  },
  completed: {
    label: "Completed",
    variant: "default",
    className: "bg-[#DCFCE7] text-[#15803D]",
  },
  refunded: {
    label: "Refunded",
    variant: "destructive",
    className: "bg-[#FEE2E2] text-[#B91C1C]",
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    className: "bg-[#FEE2E2] text-[#B91C1C]",
  },
  disputed: {
    label: "Disputed",
    variant: "outline",
    className: "bg-white text-[#1E1E1E]",
  },
};

const statCards: Array<{
  label: string;
  stat: keyof Stats;
  amountClass: string;
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
  rotate: string;
}> = [
  { label: "Total", stat: "total", amountClass: "text-[#111827]", Icon: WalletStatIcon, rotate: "-rotate-[0.8deg]" },
  { label: "Completed", stat: "completed", amountClass: "text-[#22C55E]", Icon: CompletedStatIcon, rotate: "rotate-[0.6deg]" },
  { label: "In Escrow", stat: "pending", amountClass: "text-[#F59E0B]", Icon: EscrowStatIcon, rotate: "-rotate-[0.5deg]" },
  { label: "Refunded", stat: "refunded", amountClass: "text-[#EF4444]", Icon: RefundedStatIcon, rotate: "rotate-[0.5deg]" },
];

const panelRadius = "22px 18px 24px 19px / 19px 24px 18px 22px";
const cardRadius = "20px 18px 22px 17px / 17px 22px 18px 20px";
const inputRadius = "14px 12px 15px 13px / 13px 15px 12px 14px";
const sketchPanel = "border-[3px] border-[#1E1E1E] bg-white shadow-[3px_4px_0px_#1E1E1E]";
const sketchControl =
  "h-11 w-full border-[2px] border-[#1E1E1E] bg-white px-4 text-left font-patrick text-[18px] text-[#1E1E1E] shadow-none transition-all hover:-translate-y-0.5 hover:shadow-[2px_3px_0px_#1E1E1E] focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]/40";

export default function PaymentHistory() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [userRole, setUserRole] = useState<"student" | "tutor">("student");
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, pending: 0, refunded: 0 });
  const [profile, setProfile] = useState<ViewerProfile | null>(null);

  const loadRole = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("role, full_name, avatar_url")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setUserRole(data.role === "tutor" ? "tutor" : "student");
      setProfile({ full_name: data.full_name, avatar_url: data.avatar_url });
    }
  }, [user]);

  const loadPayments = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const column = userRole === "tutor" ? "tutor_id" : "student_id";
    let query = supabase
      .from("payments")
      .select("*")
      .eq(column, user.id)
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
    if (!paymentsData) {
      setLoading(false);
      return;
    }

    const otherIds = [...new Set(paymentsData.map((p) => (userRole === "tutor" ? p.student_id : p.tutor_id)))];
    const sessionIds = [...new Set(paymentsData.filter((p) => p.session_id).map((p) => p.session_id!))];

    const [profilesRes, sessionsRes] = await Promise.all([
      otherIds.length > 0
        ? supabase.from("profiles").select("user_id, full_name").in("user_id", otherIds)
        : Promise.resolve({ data: [] }),
      sessionIds.length > 0
        ? supabase.from("sessions").select("id, subject").in("id", sessionIds)
        : Promise.resolve({ data: [] }),
    ]);

    const nameMap = new Map((profilesRes.data || []).map((p) => [p.user_id, p.full_name]));
    const subjectMap = new Map((sessionsRes.data || []).map((s) => [s.id, s.subject]));

    const enriched = paymentsData.map((p) => ({
      ...p,
      otherName: nameMap.get(userRole === "tutor" ? p.student_id : p.tutor_id) || "Unknown",
      subject: p.session_id ? subjectMap.get(p.session_id) || "N/A" : "N/A",
    }));

    setPayments(enriched);

    const allQuery = supabase.from("payments").select("amount, tutor_earnings, payment_status").eq(column, user.id);
    const { data: allPayments } = await allQuery;
    if (allPayments) {
      const getAmount = (p: any) => Number(userRole === "tutor" ? p.tutor_earnings : p.amount);
      setStats({
        total: allPayments.reduce((s, p) => s + getAmount(p), 0),
        completed: allPayments
          .filter((p) => p.payment_status === "completed")
          .reduce((s, p) => s + getAmount(p), 0),
        pending: allPayments.filter((p) => p.payment_status === "pending").reduce((s, p) => s + getAmount(p), 0),
        refunded: allPayments
          .filter((p) => p.payment_status === "refunded")
          .reduce((s, p) => s + getAmount(p), 0),
      });
    }

    setLoading(false);
  }, [dateFrom, dateTo, statusFilter, user, userRole]);

  useEffect(() => {
    loadRole();
  }, [loadRole]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F1E9] text-[#6B7280]">
        <p className="font-patrick text-2xl">Please log in to view payment history.</p>
      </div>
    );
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || undefined;
  const initials = getInitials(displayName);

  return (
    <DashboardLayout role={userRole}>
      <div className="relative text-[#1E1E1E]">
        <PaymentDoodles />

        <div className="mb-5">
          <h1 className="font-kalam text-2xl md:text-3xl font-bold text-hd-ink mb-1">Payment History</h1>
          <p className="text-hd-ink/70 font-medium text-sm">Track all your transactions 💳</p>
        </div>

      <div className="flex flex-col gap-4">
        <section aria-label="Payment totals" className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ label, stat, amountClass, Icon, rotate }) => (
            <article
              key={label}
              className={cn(
                sketchPanel,
                rotate,
                "group px-4 py-3 transition-transform duration-200 hover:-translate-y-1 hover:rotate-0",
              )}
              style={{ borderRadius: cardRadius, minHeight: 90 }}
            >
              <div className="flex h-full items-center gap-4">
                <Icon
                  className="shrink-0"
                  style={{ width: 44, height: 44, minWidth: 44, maxWidth: 44, flexBasis: 44 }}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="font-kalam text-[18px] font-bold leading-tight text-[#111827]">{label}</p>
                  <p className={cn("mt-1 font-kalam text-[28px] font-bold leading-none", amountClass)}>
                    ₹ {stats[stat].toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className={cn(sketchPanel, "shrink-0 px-5 py-3")} style={{ borderRadius: panelRadius }}>
          <h2 className="font-kalam text-[23px] font-bold leading-none text-[#111827]">Filters</h2>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end">
            <label className="w-full space-y-2 lg:w-56">
              <span className="block font-kalam text-[14px] font-bold text-[#111827]">Status</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className={cn(sketchControl, "rounded-none")}
                  style={{ borderRadius: inputRadius }}
                  aria-label="Filter by payment status"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className="border-[2px] border-[#1E1E1E] bg-white font-patrick text-[18px] shadow-[3px_4px_0px_#1E1E1E]"
                  style={{ borderRadius: inputRadius }}
                >
                  <SelectItem value="all" className="font-patrick text-[18px]">
                    All Statuses
                  </SelectItem>
                  <SelectItem value="pending" className="font-patrick text-[18px]">
                    In Escrow
                  </SelectItem>
                  <SelectItem value="completed" className="font-patrick text-[18px]">
                    Completed
                  </SelectItem>
                  <SelectItem value="refunded" className="font-patrick text-[18px]">
                    Refunded
                  </SelectItem>
                  <SelectItem value="failed" className="font-patrick text-[18px]">
                    Failed
                  </SelectItem>
                </SelectContent>
              </Select>
            </label>

            <DateFilter label="From" value={dateFrom} placeholder="Start date" onChange={setDateFrom} />
            <DateFilter label="To" value={dateTo} placeholder="End date" onChange={setDateTo} />

            {(statusFilter !== "all" || dateFrom || dateTo) && (
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="h-11 w-fit border-[2px] border-[#1E1E1E] bg-white px-4 font-kalam text-[17px] text-[#1E1E1E] shadow-[2px_3px_0px_#1E1E1E] hover:bg-[#F6F1E9]"
                style={{ borderRadius: inputRadius }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </section>

        <section className={cn(sketchPanel, "flex min-h-0 flex-1 flex-col px-5 py-4")} style={{ borderRadius: panelRadius }}>
          <h2 className="shrink-0 font-kalam text-[24px] font-bold leading-none text-[#111827]">Transactions ({payments.length})</h2>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            {loading ? (
              <LoadingTransactions />
            ) : payments.length === 0 ? (
              <EmptyTransactions />
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => {
                  const config = STATUS_CONFIG[payment.payment_status] || STATUS_CONFIG.pending;
                  const displayAmount = userRole === "tutor" ? payment.tutor_earnings : payment.amount;

                  return (
                    <article
                      key={payment.id}
                      className="flex flex-col gap-3 border-[2px] border-[#1E1E1E] bg-[#FFFCF8] p-3 shadow-[2px_3px_0px_#1E1E1E] sm:flex-row sm:items-center sm:justify-between"
                      style={{ borderRadius: cardRadius }}
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-kalam text-[20px] font-bold leading-tight text-[#111827]">
                          {payment.subject} - {payment.otherName}
                        </p>
                        <p className="font-sans text-sm text-[#6B7280]">
                          {format(new Date(payment.created_at), "dd MMM yyyy, hh:mm a")}
                          {payment.captured_at && (
                            <span> · Released {format(new Date(payment.captured_at), "dd MMM")}</span>
                          )}
                          {payment.refunded_at && (
                            <span> · Refunded {format(new Date(payment.refunded_at), "dd MMM")}</span>
                          )}
                        </p>
                        {userRole === "student" && payment.payment_status === "completed" && (
                          <p className="font-sans text-xs text-[#6B7280]">
                            Commission: ₹{payment.platform_commission} · Tutor received: ₹{payment.tutor_earnings}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <Badge
                          variant={config.variant}
                          className={cn(
                            "border-[2px] border-[#1E1E1E] px-3 py-1 font-kalam text-[16px] shadow-[2px_2px_0px_#1E1E1E]",
                            config.className,
                          )}
                        >
                          {config.label}
                        </Badge>
                        <span
                          className={cn(
                            "font-kalam text-[23px] font-bold leading-none",
                            payment.payment_status === "refunded" ? "text-[#EF4444]" : "text-[#111827]",
                          )}
                        >
                          {payment.payment_status === "refunded" ? "-" : ""}₹{displayAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
      </div>
    </DashboardLayout>
  );
}

function DateFilter({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: Date | undefined;
  placeholder: string;
  onChange: (date: Date | undefined) => void;
}) {
  return (
    <label className="w-full space-y-2 lg:w-56">
      <span className="block font-kalam text-[14px] font-bold text-[#111827]">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(sketchControl, "flex items-center gap-4")}
            style={{ borderRadius: inputRadius }}
          >
            <CalendarIcon className="h-5 w-5 shrink-0 text-[#1E1E1E]" strokeWidth={2.2} />
            <span className={cn("truncate", !value && "text-[#1E1E1E]")}>
              {value ? format(value, "dd MMM yyyy") : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto border-[3px] border-[#1E1E1E] bg-white p-0 shadow-[3px_4px_0px_#1E1E1E]"
          style={{ borderRadius: panelRadius }}
        >
          <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
    </label>
  );
}

function LoadingTransactions() {
  return (
    <div className="space-y-3 pt-1">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-16 animate-pulse border-[2px] border-[#1E1E1E]/30 bg-white/70"
          style={{ borderRadius: cardRadius }}
        />
      ))}
    </div>
  );
}

function EmptyTransactions() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center text-center">
      <img
        src="/payment-wallet-empty.svg"
        alt=""
        className="shrink-0 select-none"
        style={{ width: 210, height: 134, maxWidth: "100%" }}
        aria-hidden="true"
      />
      <h3 className="mt-2 font-kalam text-[28px] font-bold leading-none text-[#111827]">No transactions found</h3>
      <p className="mt-2 max-w-[560px] font-sans text-[15px] leading-relaxed text-[#6B7280]">
        Payments will appear here once sessions are booked and paid.
      </p>
    </div>
  );
}

function PaymentDoodles() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <SparkleDoodle className="absolute left-20 top-28 animate-float" style={{ width: 30, height: 30 }} />
      <SparkleDoodle className="absolute bottom-64 left-16 animate-bounce-gentle" style={{ width: 24, height: 24 }} />
      <SparkleDoodle className="absolute bottom-64 right-20 animate-float" style={{ width: 34, height: 34 }} />

      <span className="absolute left-12 top-60 h-7 w-7 rounded-full border-[3px] border-[#1E1E1E] bg-[#FFE2D8]" />
      <span className="absolute right-12 top-80 h-5 w-5 rounded-full border-[3px] border-[#1E1E1E] bg-[#FFD84D]" />
      <span className="absolute bottom-24 right-32 h-10 w-10 rounded-full border-[3px] border-[#1E1E1E] bg-[#5BDD82]" />
      <span className="absolute bottom-16 right-12 h-8 w-8 rounded-full border-[3px] border-[#1E1E1E] bg-[#FFE2D8]" />

      <PaperPlaneDoodle
        className="absolute right-16 top-24 hidden animate-float lg:block"
        style={{ width: 150, height: 150 }}
      />
      <CurvyLineDoodle className="absolute right-12 hidden lg:block" style={{ top: 540, width: 100, height: 100 }} />

    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function WalletStatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" {...props}>
      <path d="M12 24.5c0-4.1 3.3-7.2 7.4-7l27.8 1.4c3.4.2 6.1 3 6.1 6.4v21.8c0 3.5-2.9 6.4-6.4 6.4H18.4c-3.5 0-6.4-2.9-6.4-6.4V24.5Z" fill="#FFAFA7" stroke="#1E1E1E" strokeWidth="3" strokeLinejoin="round" />
      <path d="M16 22.7h31.7c2.6 0 4.8 2.1 4.8 4.8v3H16v-7.8Z" fill="#FFD8D4" stroke="#1E1E1E" strokeWidth="3" strokeLinejoin="round" />
      <path d="M41.4 33.8h12.4v11.4H41.4c-3.1 0-5.7-2.6-5.7-5.7 0-3.2 2.6-5.7 5.7-5.7Z" fill="#FFE9C8" stroke="#1E1E1E" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="43.1" cy="39.5" r="2.3" fill="#FFD84D" stroke="#1E1E1E" strokeWidth="2" />
      <path d="M21.4 11.8c3.1 1.5 5.1 4.3 5.5 7.7" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" />
      <path d="M31.5 9.6c1.4 2.3 1.8 4.7 1.1 7.3" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CompletedStatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" {...props}>
      <circle cx="32" cy="32" r="25" fill="#74F28D" stroke="#1E1E1E" strokeWidth="3" />
      <path d="M19.5 33.3 28 42 45.5 22.5" stroke="#1E1E1E" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.7 30.5 28.3 37 43.2 20.5" stroke="#FFF7B8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EscrowStatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" {...props}>
      <path d="M19 10.5h26" stroke="#1E1E1E" strokeWidth="3" strokeLinecap="round" />
      <path d="M19 53.5h26" stroke="#1E1E1E" strokeWidth="3" strokeLinecap="round" />
      <path d="M23.2 14.5h17.6c0 8.9-6 11.5-8.8 15.8-2.8-4.3-8.8-6.9-8.8-15.8Z" fill="#FFE8B5" stroke="#1E1E1E" strokeWidth="3" strokeLinejoin="round" />
      <path d="M23.2 49.5h17.6c0-8.9-6-11.5-8.8-15.8-2.8 4.3-8.8 6.9-8.8 15.8Z" fill="#FFB43B" stroke="#1E1E1E" strokeWidth="3" strokeLinejoin="round" />
      <path d="M27 19.3h10" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <path d="M25.4 47.7h13.2" stroke="#FFF2C9" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function RefundedStatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" {...props}>
      <circle cx="32" cy="32" r="25" fill="#FF7B6F" stroke="#1E1E1E" strokeWidth="3" />
      <path d="M42.5 24.5c-6.2-6.4-17.1-3.1-19.1 5.3" stroke="#1E1E1E" strokeWidth="4" strokeLinecap="round" />
      <path d="M21 23.6v7.9h7.9" stroke="#1E1E1E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.5 39.5c6.2 6.4 17.1 3.1 19.1-5.3" stroke="#1E1E1E" strokeWidth="4" strokeLinecap="round" />
      <path d="M43 40.4v-7.9h-7.9" stroke="#1E1E1E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42.5 24.5c-6.2-6.4-17.1-3.1-19.1 5.3" stroke="#FFE6E2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SparkleDoodle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="none" {...props}>
      <path d="M20 3.5c2.2 8.2 4.3 12.1 16 16.5-11.7 4.4-13.8 8.3-16 16.5-2.2-8.2-4.3-12.1-16-16.5C15.7 15.6 17.8 11.7 20 3.5Z" fill="#FFD84D" stroke="#1E1E1E" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

function PaperPlaneDoodle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 180 180" fill="none" {...props}>
      <path d="M48 96c-5 11-3 22 6 30 10 9 24 9 32-2 9-12-1-24-13-18-16 8-10 39 15 45" stroke="#1E1E1E" strokeWidth="3" strokeLinecap="round" strokeDasharray="10 10" />
      <path d="M87 44 150 20 121 95l-18-31-34-7 18-13Z" fill="white" stroke="#1E1E1E" strokeWidth="4" strokeLinejoin="round" />
      <path d="M103 64 150 20" stroke="#1E1E1E" strokeWidth="4" strokeLinecap="round" />
      <path d="M103 64 93 84l-6-27" fill="#F6F1E9" />
      <path d="M103 64 93 84l-6-27" stroke="#1E1E1E" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="72" cy="29" r="2.8" fill="#1E1E1E" />
    </svg>
  );
}

function CurvyLineDoodle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 120" fill="none" {...props}>
      <path d="M18 78c26 4 47-14 41-35-4-14-21-11-20 2 2 25 43 15 56-8" stroke="#1E1E1E" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
