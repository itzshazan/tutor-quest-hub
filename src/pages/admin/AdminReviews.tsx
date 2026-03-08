import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Star } from "lucide-react";

interface ReviewRow {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  student_id: string;
  tutor_id: string;
  student_name?: string;
  tutor_name?: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadReviews = async () => {
    const { data: revData } = await supabase.from("reviews").select("*");
    if (!revData) return setLoading(false);

    const userIds = [...new Set(revData.flatMap((r) => [r.student_id, r.tutor_id]))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
    const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

    setReviews(
      revData.map((r) => ({
        ...r,
        student_name: nameMap.get(r.student_id) || "Unknown",
        tutor_name: nameMap.get(r.tutor_id) || "Unknown",
      }))
    );
    setLoading(false);
  };

  useEffect(() => { loadReviews(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review deleted" });
      loadReviews();
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Review Moderation</h1>
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
                  <TableHead>Student</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.student_name}</TableCell>
                    <TableCell>{r.tutor_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {r.rating}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{r.review_text || "—"}</TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)} className="gap-1">
                        <Trash2 className="h-3 w-3" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {reviews.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No reviews found.
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
