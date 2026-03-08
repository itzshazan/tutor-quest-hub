import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, ArrowUpRight, Clock, CheckCircle, XCircle, AlertCircle, Wallet } from "lucide-react";
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
  pending: { label: "Pending", icon: Clock, className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  approved: { label: "Approved", icon: CheckCircle, className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  completed: { label: "Completed", icon: CheckCircle, className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  open: { label: "Open", icon: AlertCircle, className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  under_review: { label: "Under Review", icon: Clock, className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  resolved: { label: "Resolved", icon: CheckCircle, className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  closed: { label: "Closed", icon: XCircle, className: "bg-muted text-muted-foreground" },
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
      const captured = payments.filter(p => p.payment_status === "captured");
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="tutor">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Earnings & Withdrawals</h1>
            <p className="text-muted-foreground">Manage your earnings and request payouts</p>
          </div>
          <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Wallet className="h-4 w-4" />
                Request Withdrawal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Withdrawal</DialogTitle>
                <DialogDescription>
                  Enter the amount you'd like to withdraw. Minimum withdrawal is $10.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Available Balance</Label>
                  <p className="text-2xl font-bold text-foreground">${availableBalance.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Withdrawal Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="10"
                    max={availableBalance}
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleWithdraw} disabled={withdrawLoading}>
                  {withdrawLoading ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">${availableBalance.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Ready to withdraw</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">${pendingBalance.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Awaiting session completion</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">${totalEarnings.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">All time earnings</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Withdrawals and Disputes */}
        <Tabs defaultValue="withdrawals">
          <TabsList>
            <TabsTrigger value="withdrawals">Withdrawal History</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals" className="space-y-4">
            {withdrawals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Wallet className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No withdrawal requests yet</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {withdrawals.map((withdrawal) => {
                      const config = STATUS_CONFIG[withdrawal.status];
                      const Icon = config?.icon || Clock;
                      return (
                        <div key={withdrawal.id} className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("rounded-full p-2", config?.className)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">${withdrawal.amount.toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(withdrawal.requested_at), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <Badge className={cn(config?.className)}>{config?.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="disputes" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Create Dispute
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a Dispute</DialogTitle>
                    <DialogDescription>
                      Describe your issue and our team will review it.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason</Label>
                      <Input
                        id="reason"
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="e.g., Payment issue, Session dispute"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Textarea
                        id="description"
                        value={disputeDescription}
                        onChange={(e) => setDisputeDescription(e.target.value)}
                        placeholder="Provide more details about your issue..."
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDisputeDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateDispute} disabled={disputeLoading}>
                      {disputeLoading ? "Submitting..." : "Submit Dispute"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {disputes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No disputes filed</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {disputes.map((dispute) => {
                      const config = STATUS_CONFIG[dispute.status];
                      const Icon = config?.icon || AlertCircle;
                      return (
                        <div key={dispute.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={cn("rounded-full p-2", config?.className)}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{dispute.reason}</p>
                                {dispute.description && (
                                  <p className="mt-1 text-sm text-muted-foreground">{dispute.description}</p>
                                )}
                                <p className="mt-2 text-xs text-muted-foreground">
                                  Opened {format(new Date(dispute.created_at), "MMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                            <Badge className={cn(config?.className)}>{config?.label}</Badge>
                          </div>
                          {dispute.resolution && (
                            <div className="mt-3 rounded-lg bg-muted p-3">
                              <p className="text-sm font-medium text-foreground">Resolution:</p>
                              <p className="text-sm text-muted-foreground">{dispute.resolution}</p>
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
