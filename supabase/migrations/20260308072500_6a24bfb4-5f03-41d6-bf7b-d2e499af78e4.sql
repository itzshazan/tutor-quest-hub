-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subjects are viewable by everyone" ON public.subjects FOR SELECT TO public USING (true);

-- Seed common subjects
INSERT INTO public.subjects (name) VALUES
  ('Mathematics'), ('Physics'), ('Chemistry'), ('Biology'),
  ('English'), ('Hindi'), ('Computer Science'), ('Economics'),
  ('History'), ('Geography'), ('Accountancy'), ('Political Science'),
  ('Sanskrit'), ('French'), ('Music'), ('Art');

-- Add subjects array to tutor_profiles for multi-subject support
ALTER TABLE public.tutor_profiles ADD COLUMN subjects TEXT[] DEFAULT '{}';

-- Create index for search performance
CREATE INDEX idx_tutor_profiles_subjects ON public.tutor_profiles USING GIN(subjects);
CREATE INDEX idx_tutor_profiles_location ON public.tutor_profiles (location);
CREATE INDEX idx_tutor_profiles_hourly_rate ON public.tutor_profiles (hourly_rate);
CREATE INDEX idx_tutor_profiles_rating ON public.tutor_profiles (rating);