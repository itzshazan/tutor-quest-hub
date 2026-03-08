
-- Add grade_levels to tutor_profiles
ALTER TABLE public.tutor_profiles ADD COLUMN grade_levels text[] DEFAULT '{}';

-- Add coordinates to profiles for distance-based search
ALTER TABLE public.profiles ADD COLUMN latitude numeric DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN longitude numeric DEFAULT NULL;

-- Add preferred_subjects to profiles for student preferences
ALTER TABLE public.profiles ADD COLUMN preferred_subjects text[] DEFAULT '{}';

-- Create tutor_verifications table for document uploads
CREATE TABLE public.tutor_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  document_type text NOT NULL,
  file_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tutor_verifications ENABLE ROW LEVEL SECURITY;

-- RLS: Tutors can view and insert own verifications
CREATE POLICY "Tutors can view own verifications" ON public.tutor_verifications
  FOR SELECT TO authenticated USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can insert own verifications" ON public.tutor_verifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = tutor_id);

-- RLS: Admins can view all and update verifications
CREATE POLICY "Admins can view all verifications" ON public.tutor_verifications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update verifications" ON public.tutor_verifications
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Create private storage bucket for tutor verification documents
INSERT INTO storage.buckets (id, name, public) VALUES ('tutor-documents', 'tutor-documents', false);

-- Storage RLS: tutors upload own docs (folder = their user_id)
CREATE POLICY "Tutors can upload own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tutor-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Tutors can view own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'tutor-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can view all tutor documents
CREATE POLICY "Admins can view all tutor documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'tutor-documents' AND public.has_role(auth.uid(), 'admin'));
