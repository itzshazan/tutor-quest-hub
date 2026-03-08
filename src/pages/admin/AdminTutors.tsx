import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, FileText, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TutorRow {
  id: string;
  user_id: string;
  subject: string;
  subjects: string[] | null;
  hourly_rate: number | null;
  rating: number | null;
  total_reviews: number | null;
  is_verified: boolean | null;
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

export default function AdminTutors() {
  const [tutors, setTutors] = useState<TutorRow[]>([]);
  const [docs, setDocs] = useState<VerificationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
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

  const viewDocument = async (fileUrl: string) => {
    const { data } = await supabase.storage.from("tutor-documents").createSignedUrl(fileUrl, 300);
    if (data?.signedUrl) {
      setSelectedDoc(data.signedUrl);
    }
  };

  const pendingDocs = docs.filter((d) => d.status === "pending");

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
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No tutors found.</TableCell>
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
