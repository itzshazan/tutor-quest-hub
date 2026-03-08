-- Create tutor_availability table
CREATE TABLE public.tutor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  day_of_week text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Availability is viewable by everyone"
  ON public.tutor_availability FOR SELECT
  USING (true);

CREATE POLICY "Tutors can insert own availability"
  ON public.tutor_availability FOR INSERT
  WITH CHECK (
    tutor_id IN (SELECT user_id FROM public.tutor_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Tutors can update own availability"
  ON public.tutor_availability FOR UPDATE
  USING (
    tutor_id IN (SELECT user_id FROM public.tutor_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Tutors can delete own availability"
  ON public.tutor_availability FOR DELETE
  USING (
    tutor_id IN (SELECT user_id FROM public.tutor_profiles WHERE user_id = auth.uid())
  );

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Storage RLS policies
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);