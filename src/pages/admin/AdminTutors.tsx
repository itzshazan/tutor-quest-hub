import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, FileText, Eye, Flag, ShieldCheck, CheckCheck, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportToCSV } from "@/lib/exportUtils";
import { format } from "date-fns";

interface TutorRow {
  id: string;
  user_id: string;
  subject: string;
  subjects: string[] | null;
  hourly_rate: number | null;
  rating: number | null;
  total_reviews: number | null;
  is_verified: boolean | null;
  trust_score: number | null;
  tutor_name?: string;
}

interface VerificationDoc {
  id: string;
  tutor_id: string;
  document_type: string;
  file_url: string;
  status: string;
  created_at: string;
  tutor_name?: string;
}

interface ReportRow {
  id: string;
  tutor_id: string;
  reporter_id: string;
  reason: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  tutor_name?: string;
  reporter_name?: string;
}

export default function AdminTutors() {
  const [tutors, setTutors] = useState<TutorRow[]>([]);
  const [docs, setDocs] = useState<VerificationDoc[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const loadData = async () => {
    const { data: tp } = await supabase.from("tutor_profiles").select("*");
    if (!tp) return setLoading(false);

    const userIds = tp.map((t) => t.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
    const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

    setTutors(tp.map((t) => ({ ...t, tutor_name: nameMap.get(t.user_id) || "Unknown" })));

    // Load verification docs
    const { data: verDocs } = await supabase
      .from("tutor_verifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (verDocs) {
      const docTutorIds = [...new Set(verDocs.map((d: any) => d.tutor_id))];
      const { data: docProfiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", docTutorIds);
      const docNameMap = new Map((docProfiles || []).map((p) => [p.user_id, p.full_name]));
      setDocs(verDocs.map((d: any) => ({ ...d, tutor_name: docNameMap.get(d.tutor_id) || "Unknown" })));
    }

    // Load reports
    const { data: reportData } = await supabase
      .from("tutor_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (reportData) {
      const allIds = [...new Set([
        ...reportData.map((r: any) => r.tutor_id),
        ...reportData.map((r: any) => r.reporter_id),
      ])];
      const { data: allProfiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", allIds);
      const allNameMap = new Map((allProfiles || []).map((p) => [p.user_id, p.full_name]));

      setReports(reportData.map((r: any) => ({
        ...r,
        tutor_name: allNameMap.get(r.tutor_id) || "Unknown",
        reporter_name: allNameMap.get(r.reporter_id) || "Unknown",
      })));
    }

    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const toggleVerify = async (tutorId: string, current: boolean | null) => {
    const { error } = await supabase
      .from("tutor_profiles")
      .update({ is_verified: !current })
      .eq("id", tutorId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: current ? "Verification removed" : "Tutor verified" });
      loadData();
    }
  };

  const updateDocStatus = async (docId: string, status: string) => {
    const { error } = await supabase
      .from("tutor_verifications")
      .update({ status, reviewed_at: new Date().toISOString() } as any)
      .eq("id", docId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Document ${status}` });
      loadData();
    }
  };

  const bulkUpdateDocStatus = async (status: string) => {
    if (selectedDocIds.size === 0) return;
    const ids = Array.from(selectedDocIds);
    const { error } = await supabase
      .from("tutor_verifications")
      .update({ status, reviewed_at: new Date().toISOString() } as any)
      .in("id", ids);

    if (error) {
      toast({ title: "Bulk update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${ids.length} documents ${status}` });
      setSelectedDocIds(new Set());
      loadData();
    }
  };

  const toggleDocSelection = (docId: string) => {
    setSelectedDocIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const toggleAllPendingDocs = () => {
    const pendingIds = docs.filter((d) => d.status === "pending").map((d) => d.id);
    if (pendingIds.every((id) => selectedDocIds.has(id))) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(pendingIds));
    }
  };

  const handleExportTutors = () => {
    exportToCSV(
      tutors.map((t) => ({
        name: t.tutor_name || "Unknown",
        subjects: t.subjects?.join(", ") || t.subject || "",
        hourly_rate: t.hourly_rate || 0,
        rating: t.rating || 0,
        reviews: t.total_reviews || 0,
        trust_score: t.trust_score || 0,
        verified: t.is_verified ? "Yes" : "No",
      })),
      `tutors-export-${format(new Date(), "yyyy-MM-dd")}`,
      [
        { key: "name", label: "Name" },
        { key: "subjects", label: "Subjects" },
        { key: "hourly_rate", label: "Rate (₹/hr)" },
        { key: "rating", label: "Rating" },
        { key: "reviews", label: "Reviews" },
        { key: "trust_score", label: "Trust Score" },
        { key: "verified", label: "Verified" },
      ]
    );
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    const notes = adminNotes[reportId] || null;
    const { error } = await supabase
      .from("tutor_reports")
      .update({ status, admin_notes: notes, reviewed_at: new Date().toISOString() } as any)
      .eq("id", reportId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Report ${status}` });
      loadData();
    }
  };

  const suspendTutor = async (tutorUserId: string) => {
    const { error } = await supabase
      .from("tutor_profiles")
      .update({ is_verified: false })
      .eq("user_id", tutorUserId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Tutor suspended", description: "Verification revoked and tutor hidden from search." });
      loadData();
    }
  };

  const viewDocument = async (fileUrl: string) => {
    const { data } = await supabase.storage.from("tutor-documents").createSignedUrl(fileUrl, 300);
    if (data?.signedUrl) {
      setSelectedDoc(data.signedUrl);
    }
  };

  const pendingDocs = docs.filter((d) => d.status === "pending");
  const pendingReports = reports.filter((r) => r.status === "pending");

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Tutor Management</h1>

      <Tabs defaultValue="tutors">
        <TabsList className="mb-4">
          <TabsTrigger value="tutors">All Tutors</TabsTrigger>
          <TabsTrigger value="verifications" className="gap-2">
            Verification Docs
            {pendingDocs.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">{pendingDocs.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            Reports
            {pendingReports.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">{pendingReports.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tutors">
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
                      <TableHead>Subject</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Trust Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tutors.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.tutor_name}</TableCell>
                        <TableCell>{t.subjects?.join(", ") || t.subject || "—"}</TableCell>
                        <TableCell>₹{t.hourly_rate || 0}/hr</TableCell>
                        <TableCell>⭐ {t.rating || 0} ({t.total_reviews || 0})</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                            <span className="font-medium">{t.trust_score || 0}</span>
                            <span className="text-xs text-muted-foreground">/100</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {t.is_verified ? (
                            <Badge className="bg-green-100 text-green-800">Verified</Badge>
                          ) : (
                            <Badge variant="secondary">Unverified</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={t.is_verified ? "outline" : "default"}
                            onClick={() => toggleVerify(t.id, t.is_verified)}
                            className="gap-1"
                          >
                            {t.is_verified ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                            {t.is_verified ? "Revoke" : "Verify"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {tutors.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No tutors found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verification Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.tutor_name}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {d.document_type}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={d.status === "approved" ? "default" : d.status === "rejected" ? "destructive" : "secondary"}>
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(d.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => viewDocument(d.file_url)}>
                            <Eye className="h-3 w-3" /> View
                          </Button>
                          {d.status === "pending" && (
                            <>
                              <Button size="sm" className="gap-1" onClick={() => updateDocStatus(d.id, "approved")}>
                                <CheckCircle className="h-3 w-3" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" className="gap-1" onClick={() => updateDocStatus(d.id, "rejected")}>
                                <XCircle className="h-3 w-3" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {docs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No verification documents submitted.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Flag className="h-5 w-5 text-destructive" /> Tutor Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reports.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No reports submitted.</p>
              ) : (
                reports.map((r) => (
                  <div key={r.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          Report against <span className="text-foreground">{r.tutor_name}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          By {r.reporter_name} · {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={r.status === "resolved" ? "default" : r.status === "dismissed" ? "secondary" : "destructive"}>
                        {r.status}
                      </Badge>
                    </div>

                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-sm font-medium text-destructive">{r.reason}</p>
                      {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                    </div>

                    {r.admin_notes && (
                      <div className="rounded-md bg-primary/5 p-3">
                        <p className="text-xs font-medium text-primary">Admin Notes:</p>
                        <p className="text-sm text-muted-foreground">{r.admin_notes}</p>
                      </div>
                    )}

                    {r.status === "pending" && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Admin notes (optional)..."
                          value={adminNotes[r.id] || ""}
                          onChange={(e) => setAdminNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          rows={2}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" className="gap-1" onClick={() => updateReportStatus(r.id, "resolved")}>
                            <CheckCircle className="h-3 w-3" /> Resolve
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => updateReportStatus(r.id, "dismissed")}>
                            <XCircle className="h-3 w-3" /> Dismiss
                          </Button>
                          <Button size="sm" variant="destructive" className="gap-1" onClick={() => suspendTutor(r.tutor_id)}>
                            <Flag className="h-3 w-3" /> Suspend Tutor
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Document Viewer Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <iframe src={selectedDoc} className="w-full h-[60vh] rounded-md border" title="Document preview" />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}