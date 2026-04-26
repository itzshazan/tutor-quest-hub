import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IndianRupee, ArrowUpRight, Clock, CheckCircle, XCircle, AlertCircle, Wallet, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  requested_at: string;
  processed_at: string | null;
  admin_notes: string | null;
}

interface Dispute {
  id: string;
  session_id: string | null;
  payment_id: string | null;
  reason: string;
  description: string | null;
  status: string;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-[#fff9c4] text-[#a07d1c] border-2 border-hd-ink" },
  approved: { label: "Approved", icon: CheckCircle, className: "bg-[#d0e8ff] text-[#2d5da1] border-2 border-hd-ink" },
  completed: { label: "Completed", icon: CheckCircle, className: "bg-[#E5F6D3] text-[#4a7a2a] border-2 border-hd-ink" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-[#ffe0e0] text-[#c0392b] border-2 border-hd-ink" },
  open: { label: "Open", icon: AlertCircle, className: "bg-[#fff9c4] text-[#a07d1c] border-2 border-hd-ink" },
  under_review: { label: "Under Review", icon: Clock, className: "bg-[#d0e8ff] text-[#2d5da1] border-2 border-hd-ink" },
  resolved: { label: "Resolved", icon: CheckCircle, className: "bg-[#E5F6D3] text-[#4a7a2a] border-2 border-hd-ink" },
  closed: { label: "Closed", icon: XCircle, className: "bg-hd-muted text-hd-ink border-2 border-hd-ink" },
};

export default function TutorEarnings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  
  // Dispute form
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputeLoading, setDisputeLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    // Load payments to calculate earnings
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("tutor_id", user.id);

    if (payments) {
      const captured = payments.filter(p => p.payment_status === "completed");
      const pending = payments.filter(p => p.payment_status === "authorized" || p.payment_status === "pending");
      
      setTotalEarnings(captured.reduce((sum, p) => sum + Number(p.tutor_earnings), 0));
      setPendingBalance(pending.reduce((sum, p) => sum + Number(p.tutor_earnings), 0));
    }

    // Load withdrawal requests
    const { data: withdrawalData } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("tutor_id", user.id)
      .order("requested_at", { ascending: false });

    if (withdrawalData) {
      setWithdrawals(withdrawalData);
      const pendingWithdrawals = withdrawalData
        .filter(w => w.status === "pending" || w.status === "approved")
        .reduce((sum, w) => sum + Number(w.amount), 0);
      const completedWithdrawals = withdrawalData
        .filter(w => w.status === "completed")
        .reduce((sum, w) => sum + Number(w.amount), 0);
      
      setAvailableBalance(totalEarnings - completedWithdrawals - pendingWithdrawals);
    }

    // Load disputes
    const { data: disputeData } = await supabase
      .from("disputes")
      .select("*")
      .eq("raised_by", user.id)
      .order("created_at", { ascending: false });

    if (disputeData) {
      setDisputes(disputeData);
    }

    setLoading(false);
  };

  // Recalculate available balance when totalEarnings changes
  useEffect(() => {
    const pendingWithdrawals = withdrawals
      .filter(w => w.status === "pending" || w.status === "approved")
      .reduce((sum, w) => sum + Number(w.amount), 0);
    const completedWithdrawals = withdrawals
      .filter(w => w.status === "completed")
      .reduce((sum, w) => sum + Number(w.amount), 0);
    
    setAvailableBalance(totalEarnings - completedWithdrawals - pendingWithdrawals);
  }, [totalEarnings, withdrawals]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    if (amount > availableBalance) {
      toast({ title: "Insufficient balance", description: "You cannot withdraw more than your available balance.", variant: "destructive" });
      return;
    }

    setWithdrawLoading(true);
    const { error } = await supabase.from("withdrawal_requests").insert({
      tutor_id: user!.id,
      amount,
    });

    if (error) {
      toast({ title: "Failed to submit request", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Withdrawal request submitted", description: "We'll process your request within 3-5 business days." });
      setWithdrawDialogOpen(false);
      setWithdrawAmount("");
      loadData();
    }
    setWithdrawLoading(false);
  };

  const handleCreateDispute = async () => {
    if (!disputeReason.trim()) {
      toast({ title: "Please provide a reason", variant: "destructive" });
      return;
    }

    setDisputeLoading(true);
    const { error } = await supabase.from("disputes").insert({
      raised_by: user!.id,
      reason: disputeReason.trim(),
      description: disputeDescription.trim() || null,
    });

    if (error) {
      toast({ title: "Failed to create dispute", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dispute submitted", description: "Our team will review your case." });
      setDisputeDialogOpen(false);
      setDisputeReason("");
      setDisputeDescription("");
      loadData();
    }
    setDisputeLoading(false);
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout role="tutor">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ff5a5a] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="tutor">
      <div className="space-y-5 max-w-5xl w-full mx-auto relative z-10">
        {/* Floating doodles */}
        <div className="absolute top-0 right-6 -z-10 opacity-25 pointer-events-none animate-float hidden md:block">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#90be6d" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div className="absolute top-40 right-2 -z-10 opacity-20 pointer-events-none animate-wiggle hidden lg:block">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffd166" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-kalam text-2xl md:text-3xl font-bold text-hd-ink mb-1">Earnings & Withdrawals</h1>
            <p className="text-hd-ink/70 font-medium text-sm">Manage your earnings and request payouts 💰</p>
          </div>
          <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#90be6d] text-white hover:bg-[#7aae57] border-2 border-hd-ink shadow-[3px_3px_0px_0px_#2d2d2d] rounded-xl font-bold text-sm h-10 px-5 transition-all hover:-translate-y-0.5">
                <Wallet className="mr-1.5 h-4 w-4" />
                Request Withdrawal
              </Button>
            </DialogTrigger>
            <DialogContent className="border-2 border-hd-ink rounded-xl shadow-[6px_6px_0px_0px_#2d2d2d] bg-[#fdfbf7]">
              <DialogHeader>
                <DialogTitle className="font-kalam text-xl text-hd-ink">Request Withdrawal</DialogTitle>
                <DialogDescription className="text-hd-ink/70 font-medium">
                  Enter the amount you'd like to withdraw. Minimum withdrawal is ₹10.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="font-semibold text-hd-ink">Available Balance</Label>
                  <p className="font-kalam text-3xl font-bold text-[#4a7a2a]">₹{availableBalance.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="font-semibold text-hd-ink">Withdrawal Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="10"
                    max={availableBalance}
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="border-2 border-hd-ink rounded-xl shadow-[2px_2px_0px_0px_#2d2d2d] font-medium"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)} className="border-2 border-hd-ink rounded-xl shadow-[2px_2px_0px_0px_#2d2d2d] font-bold">Cancel</Button>
                <Button onClick={handleWithdraw} disabled={withdrawLoading} className="bg-[#90be6d] text-white hover:bg-[#7aae57] border-2 border-hd-ink rounded-xl shadow-[2px_2px_0px_0px_#2d2d2d] font-bold">
                  {withdrawLoading ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Available Balance */}
          <Card className="border-2 border-hd-ink rounded-xl shadow-[3px_3px_0px_0px_#2d2d2d] bg-white overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-bold text-hd-ink/70 uppercase tracking-wide">Available Balance</CardTitle>
              <div className="rounded-lg bg-[#E5F6D3] p-1.5 border border-hd-ink group-hover:scale-110 transition-transform">
                <IndianRupee className="h-4 w-4 text-[#4a7a2a]" />
              </div>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <p className="font-kalam text-3xl font-bold text-hd-ink leading-none">₹{availableBalance.toFixed(2)}</p>
              <p className="text-[11px] font-semibold text-[#4a7a2a] mt-1">Ready to withdraw</p>
            </CardContent>
          </Card>

          {/* Pending */}
          <Card className="border-2 border-hd-ink rounded-xl shadow-[3px_3px_0px_0px_#2d2d2d] bg-white overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-bold text-hd-ink/70 uppercase tracking-wide">Pending</CardTitle>
              <div className="rounded-lg bg-[#fff9c4] p-1.5 border border-hd-ink group-hover:scale-110 transition-transform">
                <Clock className="h-4 w-4 text-[#d4a017]" />
              </div>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <p className="font-kalam text-3xl font-bold text-hd-ink leading-none">₹{pendingBalance.toFixed(2)}</p>
              <p className="text-[11px] font-semibold text-[#d4a017] mt-1">Awaiting session completion</p>
            </CardContent>
          </Card>

          {/* Total Earnings */}
          <Card className="border-2 border-hd-ink rounded-xl shadow-[3px_3px_0px_0px_#2d2d2d] bg-white overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-bold text-hd-ink/70 uppercase tracking-wide">Total Earnings</CardTitle>
              <div className="rounded-lg bg-[#2d5da1]/15 p-1.5 border border-hd-ink group-hover:scale-110 transition-transform">
                <ArrowUpRight className="h-4 w-4 text-[#2d5da1]" />
              </div>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <p className="font-kalam text-3xl font-bold text-hd-ink leading-none">₹{totalEarnings.toFixed(2)}</p>
              <p className="text-[11px] font-semibold text-[#2d5da1] mt-1">All time earnings</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="withdrawals">
          <TabsList className="bg-white border-2 border-hd-ink rounded-xl shadow-[2px_2px_0px_0px_#2d2d2d] p-1 h-auto">
            <TabsTrigger
              value="withdrawals"
              className="rounded-lg font-bold text-sm px-4 py-2 data-[state=active]:bg-[#fff9c4] data-[state=active]:text-hd-ink data-[state=active]:border-2 data-[state=active]:border-hd-ink data-[state=active]:shadow-[2px_2px_0px_0px_#2d2d2d] text-hd-ink/60 transition-all"
            >
              Withdrawal History
            </TabsTrigger>
            <TabsTrigger
              value="disputes"
              className="rounded-lg font-bold text-sm px-4 py-2 data-[state=active]:bg-[#ff5a5a]/15 data-[state=active]:text-hd-ink data-[state=active]:border-2 data-[state=active]:border-hd-ink data-[state=active]:shadow-[2px_2px_0px_0px_#2d2d2d] text-hd-ink/60 transition-all"
            >
              Disputes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals" className="space-y-4 mt-4">
            {withdrawals.length === 0 ? (
              <Card className="border-[3px] border-hd-ink rounded-xl shadow-[4px_4px_0px_0px_#2d2d2d] bg-white">
                <CardContent className="flex flex-col items-center justify-center py-14">
                  <div className="rounded-xl bg-[#E5F6D3] p-4 border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] mb-4">
                    <Wallet className="h-8 w-8 text-[#4a7a2a]" />
                  </div>
                  <p className="font-kalam text-lg font-bold text-hd-ink">No withdrawal requests yet</p>
                  <p className="text-xs font-medium text-hd-ink/60 mt-1">Your withdrawal history will appear here 💸</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-[3px] border-hd-ink rounded-xl shadow-[4px_4px_0px_0px_#2d2d2d] bg-white overflow-hidden">
                <CardContent className="p-0">
                  <div className="divide-y-2 divide-dashed divide-hd-ink/30">
                    {withdrawals.map((withdrawal) => {
                      const config = STATUS_CONFIG[withdrawal.status];
                      const Icon = config?.icon || Clock;
                      return (
                        <div key={withdrawal.id} className="flex items-center justify-between p-4 hover:bg-[#fdfbf7] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={cn("rounded-lg p-2 border shadow-sm", config?.className)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-hd-ink text-sm">₹{withdrawal.amount.toFixed(2)}</p>
                              <p className="text-[11px] font-semibold text-hd-ink/60">
                                {format(new Date(withdrawal.requested_at), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <Badge className={cn("font-bold text-[10px] rounded-md shadow-[1px_1px_0px_0px_#2d2d2d]", config?.className)}>{config?.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="disputes" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-white text-hd-ink hover:bg-[#FFF0F1] border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl font-bold text-sm h-10 px-4 transition-all hover:-translate-y-0.5">
                    <AlertCircle className="mr-1.5 h-4 w-4 text-[#ff5a5a]" />
                    Create Dispute
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-2 border-hd-ink rounded-xl shadow-[6px_6px_0px_0px_#2d2d2d] bg-[#fdfbf7]">
                  <DialogHeader>
                    <DialogTitle className="font-kalam text-xl text-hd-ink">Create a Dispute</DialogTitle>
                    <DialogDescription className="text-hd-ink/70 font-medium">
                      Describe your issue and our team will review it.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="reason" className="font-semibold text-hd-ink">Reason</Label>
                      <Input
                        id="reason"
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="e.g., Payment issue, Session dispute"
                        className="border-2 border-hd-ink rounded-xl shadow-[2px_2px_0px_0px_#2d2d2d] font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="font-semibold text-hd-ink">Description (optional)</Label>
                      <Textarea
                        id="description"
                        value={disputeDescription}
                        onChange={(e) => setDisputeDescription(e.target.value)}
                        placeholder="Provide more details about your issue..."
                        rows={4}
                        className="border-2 border-hd-ink rounded-xl shadow-[2px_2px_0px_0px_#2d2d2d] font-medium"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDisputeDialogOpen(false)} className="border-2 border-hd-ink rounded-xl shadow-[2px_2px_0px_0px_#2d2d2d] font-bold">Cancel</Button>
                    <Button onClick={handleCreateDispute} disabled={disputeLoading} className="bg-[#ff5a5a] text-white hover:bg-[#e04848] border-2 border-hd-ink rounded-xl shadow-[2px_2px_0px_0px_#2d2d2d] font-bold">
                      {disputeLoading ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Dispute"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {disputes.length === 0 ? (
              <Card className="border-[3px] border-hd-ink rounded-xl shadow-[4px_4px_0px_0px_#2d2d2d] bg-white">
                <CardContent className="flex flex-col items-center justify-center py-14">
                  <div className="rounded-xl bg-[#fff9c4] p-4 border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] mb-4">
                    <AlertCircle className="h-8 w-8 text-[#d4a017]" />
                  </div>
                  <p className="font-kalam text-lg font-bold text-hd-ink">No disputes filed</p>
                  <p className="text-xs font-medium text-hd-ink/60 mt-1">Hopefully you'll never need this! ✌️</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-[3px] border-hd-ink rounded-xl shadow-[4px_4px_0px_0px_#2d2d2d] bg-white overflow-hidden">
                <CardContent className="p-0">
                  <div className="divide-y-2 divide-dashed divide-hd-ink/30">
                    {disputes.map((dispute) => {
                      const config = STATUS_CONFIG[dispute.status];
                      const Icon = config?.icon || AlertCircle;
                      return (
                        <div key={dispute.id} className="p-4 hover:bg-[#fdfbf7] transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className={cn("rounded-lg p-2 border shadow-sm shrink-0", config?.className)}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-hd-ink">{dispute.reason}</p>
                                {dispute.description && (
                                  <p className="mt-0.5 text-xs font-medium text-hd-ink/60 line-clamp-2">{dispute.description}</p>
                                )}
                                <p className="mt-1.5 text-[10px] font-bold text-hd-ink/50">
                                  Opened {format(new Date(dispute.created_at), "MMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                            <Badge className={cn("font-bold text-[10px] rounded-md shadow-[1px_1px_0px_0px_#2d2d2d] shrink-0", config?.className)}>{config?.label}</Badge>
                          </div>
                          {dispute.resolution && (
                            <div className="mt-3 rounded-lg bg-[#E5F6D3]/50 border-2 border-hd-ink/20 p-3">
                              <p className="text-xs font-bold text-hd-ink">Resolution:</p>
                              <p className="text-xs font-medium text-hd-ink/70 mt-0.5">{dispute.resolution}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
