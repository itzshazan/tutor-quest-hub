import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSavedTutors(userId: string | undefined) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase
      .from("saved_tutors")
      .select("tutor_id")
      .eq("student_id", userId)
      .then(({ data }) => {
        setSavedIds(new Set((data || []).map((r: any) => r.tutor_id)));
        setLoading(false);
      });
  }, [userId]);

  const toggle = useCallback(async (tutorId: string) => {
    if (!userId) return;
    const isSaved = savedIds.has(tutorId);

    // Optimistic update
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(tutorId); else next.add(tutorId);
      return next;
    });

    if (isSaved) {
      await supabase
        .from("saved_tutors")
        .delete()
        .eq("student_id", userId)
        .eq("tutor_id", tutorId);
    } else {
      await supabase
        .from("saved_tutors")
        .insert({ student_id: userId, tutor_id: tutorId } as any);
    }
  }, [userId, savedIds]);

  return { savedIds, toggle, loading };
}
