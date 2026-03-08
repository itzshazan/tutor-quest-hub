import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from "lucide-react";

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

export default function AdminTutors() {
  const [tutors, setTutors] = useState<TutorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadTutors = async () => {
    const { data: tp } = await supabase.from("tutor_profiles").select("*");
    if (!tp) return setLoading(false);

    const userIds = tp.map((t) => t.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
    const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

    setTutors(tp.map((t) => ({ ...t, tutor_name: nameMap.get(t.user_id) || "Unknown" })));
    setLoading(false);
  };

  useEffect(() => { loadTutors(); }, []);

  const toggleVerify = async (tutorId: string, current: boolean | null) => {
    const { error } = await supabase
      .from("tutor_profiles")
      .update({ is_verified: !current })
      .eq("id", tutorId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: current ? "Verification removed" : "Tutor verified" });
      loadTutors();
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Tutor Management</h1>
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
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No tutors found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
