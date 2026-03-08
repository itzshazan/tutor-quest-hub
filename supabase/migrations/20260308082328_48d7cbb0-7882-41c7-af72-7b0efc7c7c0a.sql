
CREATE TABLE public.saved_tutors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  tutor_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, tutor_id)
);

ALTER TABLE public.saved_tutors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own saved tutors" ON public.saved_tutors
  FOR SELECT TO authenticated USING (auth.uid() = student_id);

CREATE POLICY "Students can save tutors" ON public.saved_tutors
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can unsave tutors" ON public.saved_tutors
  FOR DELETE TO authenticated USING (auth.uid() = student_id);
