import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { MoreHorizontal, ShieldCheck, Ban, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { exportToCSV } from "@/lib/exportUtils";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  phone: string | null;
  created_at: string;
  user_id: string;
  suspended_at: string | null;
}

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<{ type: "suspend" | "promote" | "delete"; user: Profile } | null>(null);
  const { toast } = useToast();

  const loadProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*");
    setProfiles(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleSuspend = async (user: Profile) => {
    const newSuspendedAt = user.suspended_at ? null : new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({ suspended_at: newSuspendedAt })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: user.suspended_at ? "User unsuspended" : "User suspended" });
      loadProfiles();
    }
    setActionDialog(null);
  };

  const handlePromoteToAdmin = async (user: Profile) => {
    // Check if already admin
    const { data: existing } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.user_id)
      .eq("role", "admin")
      .maybeSingle();

    if (existing) {
      toast({ title: "Already an admin", variant: "destructive" });
      setActionDialog(null);
      return;
    }

    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: user.user_id, role: "admin" });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User promoted to admin" });
    }
    setActionDialog(null);
  };

  const handleExport = () => {
    exportToCSV(
      filtered.map((p) => ({
        name: p.full_name,
        role: p.role,
        phone: p.phone || "",
        status: p.suspended_at ? "Suspended" : "Active",
        joined: format(new Date(p.created_at), "yyyy-MM-dd"),
      })),
      `users-export-${format(new Date(), "yyyy-MM-dd")}`,
      [
        { key: "name", label: "Name" },
        { key: "role", label: "Role" },
        { key: "phone", label: "Phone" },
        { key: "status", label: "Status" },
        { key: "joined", label: "Joined" },
      ]
    );
  };

  const filtered = roleFilter === "all" ? profiles : profiles.filter((p) => p.role === roleFilter);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex items-center gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="tutor">Tutors</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className={p.suspended_at ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{p.full_name || "Unnamed"}</TableCell>
                    <TableCell className="capitalize">{p.role}</TableCell>
                    <TableCell>{p.phone || "—"}</TableCell>
                    <TableCell>
                      {p.suspended_at ? (
                        <span className="text-xs font-medium text-destructive">Suspended</span>
                      ) : (
                        <span className="text-xs font-medium text-primary">Active</span>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setActionDialog({ type: "suspend", user: p })}>
                            <Ban className="mr-2 h-4 w-4" />
                            {p.suspended_at ? "Unsuspend" : "Suspend"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setActionDialog({ type: "promote", user: p })}>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Promote to Admin
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog?.type === "suspend" && (actionDialog.user.suspended_at ? "Unsuspend User" : "Suspend User")}
              {actionDialog?.type === "promote" && "Promote to Admin"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog?.type === "suspend" && (
                actionDialog.user.suspended_at
                  ? `Are you sure you want to unsuspend ${actionDialog.user.full_name || "this user"}?`
                  : `Are you sure you want to suspend ${actionDialog.user.full_name || "this user"}? They will not be able to access their account.`
              )}
              {actionDialog?.type === "promote" && (
                `Are you sure you want to give ${actionDialog.user.full_name || "this user"} admin privileges? This action cannot be easily undone.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (actionDialog?.type === "suspend") handleSuspend(actionDialog.user);
                if (actionDialog?.type === "promote") handlePromoteToAdmin(actionDialog.user);
              }}
              className={actionDialog?.type === "suspend" && !actionDialog.user.suspended_at ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
