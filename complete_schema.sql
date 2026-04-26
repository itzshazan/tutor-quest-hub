-- Create role enum
CREATE TYPE public.app_role AS ENUM ('student', 'tutor');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role app_role NOT NULL DEFAULT 'student',
  bio TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tutor_profiles table for tutor-specific data
CREATE TABLE public.tutor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT '',
  experience_years INTEGER DEFAULT 0,
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  location TEXT DEFAULT '',
  education TEXT DEFAULT '',
  is_verified BOOLEAN DEFAULT false,
  rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (security best practice)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tutor profiles policies
CREATE POLICY "Tutor profiles are viewable by everyone" ON public.tutor_profiles FOR SELECT USING (true);
CREATE POLICY "Tutors can update own tutor profile" ON public.tutor_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Tutors can insert own tutor profile" ON public.tutor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tutor_profiles_updated_at BEFORE UPDATE ON public.tutor_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'));
  
  IF (NEW.raw_user_meta_data->>'role') = 'tutor' THEN
    INSERT INTO public.tutor_profiles (user_id, subject)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'subject', ''));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Tutor profiles are viewable by everyone" ON public.tutor_profiles;
DROP POLICY IF EXISTS "Tutors can update own tutor profile" ON public.tutor_profiles;
DROP POLICY IF EXISTS "Tutors can insert own tutor profile" ON public.tutor_profiles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

-- Profiles - permissive
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT TO public USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Tutor profiles - permissive
CREATE POLICY "Tutor profiles are viewable by everyone" ON public.tutor_profiles FOR SELECT TO public USING (true);
CREATE POLICY "Tutors can update own tutor profile" ON public.tutor_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Tutors can insert own tutor profile" ON public.tutor_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles - permissive
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
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
-- Conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  tutor_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, tutor_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Participants can update conversation"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = student_id OR auth.uid() = tutor_id);

-- Messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can view messages"
  ON public.messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE student_id = auth.uid() OR tutor_id = auth.uid()
    )
  );

CREATE POLICY "Conversation participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND conversation_id IN (
      SELECT id FROM public.conversations
      WHERE student_id = auth.uid() OR tutor_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE student_id = auth.uid() OR tutor_id = auth.uid()
    )
  );

-- Index for fast message lookup
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id, created_at);
CREATE INDEX idx_conversations_student ON public.conversations(student_id);
CREATE INDEX idx_conversations_tutor ON public.conversations(tutor_id);

-- Trigger to update conversation updated_at
CREATE TRIGGER update_conversation_timestamp
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
-- Sessions table
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  tutor_id uuid NOT NULL,
  subject text NOT NULL,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Both student and tutor can view their sessions
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() = tutor_id);

-- Students can create sessions (book)
CREATE POLICY "Students can book sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Both can update (tutor accepts/declines, student cancels)
CREATE POLICY "Participants can update sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = student_id OR auth.uid() = tutor_id);

-- Indexes
CREATE INDEX idx_sessions_student ON public.sessions(student_id);
CREATE INDEX idx_sessions_tutor ON public.sessions(tutor_id);
CREATE INDEX idx_sessions_date ON public.sessions(session_date);
CREATE INDEX idx_sessions_status ON public.sessions(status);

-- Trigger for updated_at
CREATE TRIGGER update_sessions_timestamp
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;

-- Create reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  student_id uuid NOT NULL,
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can read reviews
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (true);

-- Students can insert reviews for their own completed sessions
CREATE POLICY "Students can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = student_id
    AND session_id IN (
      SELECT id FROM public.sessions
      WHERE student_id = auth.uid() AND status = 'completed'
    )
  );

-- Students can update their own reviews
CREATE POLICY "Students can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = student_id);

-- Function to update tutor rating after review insert/update/delete
CREATE OR REPLACE FUNCTION public.update_tutor_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.tutor_profiles
  SET rating = COALESCE((
    SELECT ROUND(AVG(r.rating)::numeric, 1)
    FROM public.reviews r
    WHERE r.tutor_id = COALESCE(NEW.tutor_id, OLD.tutor_id)
  ), 0),
  total_reviews = COALESCE((
    SELECT COUNT(*)
    FROM public.reviews r
    WHERE r.tutor_id = COALESCE(NEW.tutor_id, OLD.tutor_id)
  ), 0)
  WHERE user_id = COALESCE(NEW.tutor_id, OLD.tutor_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to auto-update rating
CREATE TRIGGER update_tutor_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tutor_rating();

-- Enable realtime for reviews
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

CREATE POLICY "Admins can view all sessions" ON public.sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all conversations" ON public.conversations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all user_roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tutor_profiles" ON public.tutor_profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete reviews" ON public.reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

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

-- Add teaching_method to tutor_profiles (online, offline, both)
ALTER TABLE public.tutor_profiles ADD COLUMN IF NOT EXISTS teaching_method text NOT NULL DEFAULT 'offline';

-- Add teaching_radius in km to tutor_profiles
ALTER TABLE public.tutor_profiles ADD COLUMN IF NOT EXISTS teaching_radius numeric DEFAULT 10;

-- Add phone to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text DEFAULT '';

-- Add trust_score to tutor_profiles for ranking
ALTER TABLE public.tutor_profiles ADD COLUMN IF NOT EXISTS trust_score numeric DEFAULT 0;

-- Create tutor_reports table for students to report tutors
CREATE TABLE public.tutor_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tutor_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reports
CREATE POLICY "Users can report tutors" ON public.tutor_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON public.tutor_reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports" ON public.tutor_reports
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update reports
CREATE POLICY "Admins can update reports" ON public.tutor_reports
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Function to calculate trust score
CREATE OR REPLACE FUNCTION public.calculate_trust_score(_tutor_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _score numeric := 0;
  _tp tutor_profiles%ROWTYPE;
  _completed_sessions integer;
  _doc_count integer;
BEGIN
  SELECT * INTO _tp FROM tutor_profiles WHERE user_id = _tutor_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Verification status (25 points)
  IF _tp.is_verified THEN _score := _score + 25; END IF;

  -- Profile completeness (25 points)
  IF _tp.hourly_rate > 0 THEN _score := _score + 5; END IF;
  IF _tp.education IS NOT NULL AND _tp.education != '' THEN _score := _score + 5; END IF;
  IF _tp.location IS NOT NULL AND _tp.location != '' THEN _score := _score + 5; END IF;
  IF _tp.experience_years > 0 THEN _score := _score + 5; END IF;
  IF _tp.subjects IS NOT NULL AND array_length(_tp.subjects, 1) > 0 THEN _score := _score + 5; END IF;

  -- Rating (25 points)
  IF _tp.rating > 0 THEN _score := _score + LEAST(_tp.rating * 5, 25); END IF;

  -- Completed sessions (25 points)
  SELECT COUNT(*) INTO _completed_sessions FROM sessions
    WHERE tutor_id = _tutor_id AND status = 'completed';
  _score := _score + LEAST(_completed_sessions * 2.5, 25);

  RETURN ROUND(_score, 1);
END;
$$;

-- Trigger to update trust score when tutor_profiles or reviews change
CREATE OR REPLACE FUNCTION public.update_trust_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tutor_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'tutor_profiles' THEN
    _tutor_id := COALESCE(NEW.user_id, OLD.user_id);
  ELSIF TG_TABLE_NAME = 'sessions' THEN
    _tutor_id := COALESCE(NEW.tutor_id, OLD.tutor_id);
  ELSIF TG_TABLE_NAME = 'reviews' THEN
    _tutor_id := COALESCE(NEW.tutor_id, OLD.tutor_id);
  END IF;

  UPDATE tutor_profiles SET trust_score = calculate_trust_score(_tutor_id) WHERE user_id = _tutor_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_trust_score_tutor_profiles
  AFTER INSERT OR UPDATE ON public.tutor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_trust_score();

CREATE TRIGGER trg_trust_score_sessions
  AFTER INSERT OR UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION update_trust_score();

CREATE TRIGGER trg_trust_score_reviews
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_trust_score();

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

-- Create payments table for tracking all transactions
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  tutor_id uuid NOT NULL,
  session_id uuid REFERENCES public.sessions(id),
  amount numeric NOT NULL,
  platform_commission numeric NOT NULL DEFAULT 0,
  tutor_earnings numeric NOT NULL DEFAULT 0,
  payment_method text,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  payment_status text NOT NULL DEFAULT 'pending',
  captured_at timestamp with time zone,
  refunded_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Students can view their own payments
CREATE POLICY "Students can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

-- Tutors can view payments where they are the tutor
CREATE POLICY "Tutors can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = tutor_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only edge functions (service role) insert/update payments, but allow authenticated insert for the checkout flow
CREATE POLICY "Authenticated users can create payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

-- Allow updates by participants (for status changes via edge functions)
CREATE POLICY "Participants can update payments"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id OR auth.uid() = tutor_id);

-- Add trigger for updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- The unique constraint on profiles.user_id was added successfully in the previous migration.
-- The FK tutor_profiles_user_id_fkey already exists.
-- Now fix the recursive trigger.

-- 1. Drop the existing recursive trigger on tutor_profiles (if exists)
DROP TRIGGER IF EXISTS update_trust_score_tutor_profiles ON public.tutor_profiles;

-- 2. Recreate the update_trust_score function to avoid recursion
CREATE OR REPLACE FUNCTION public.update_trust_score()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _tutor_id uuid;
  _new_score numeric;
BEGIN
  IF TG_TABLE_NAME = 'tutor_profiles' THEN
    _tutor_id := COALESCE(NEW.user_id, OLD.user_id);
  ELSIF TG_TABLE_NAME = 'sessions' THEN
    _tutor_id := COALESCE(NEW.tutor_id, OLD.tutor_id);
  ELSIF TG_TABLE_NAME = 'reviews' THEN
    _tutor_id := COALESCE(NEW.tutor_id, OLD.tutor_id);
  END IF;

  _new_score := calculate_trust_score(_tutor_id);

  -- For tutor_profiles: set directly on NEW row (BEFORE trigger), no recursive UPDATE
  IF TG_TABLE_NAME = 'tutor_profiles' THEN
    IF NEW.trust_score IS DISTINCT FROM _new_score THEN
      NEW.trust_score := _new_score;
    END IF;
    RETURN NEW;
  ELSE
    UPDATE tutor_profiles SET trust_score = _new_score WHERE user_id = _tutor_id;
    RETURN COALESCE(NEW, OLD);
  END IF;
END;
$function$;

-- 3. Create BEFORE trigger on tutor_profiles (no recursion)
CREATE TRIGGER update_trust_score_tutor_profiles
  BEFORE INSERT OR UPDATE ON public.tutor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trust_score();

-- 4. Recreate triggers on other tables
DROP TRIGGER IF EXISTS update_trust_score_sessions ON public.sessions;
CREATE TRIGGER update_trust_score_sessions
  AFTER INSERT OR UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trust_score();

DROP TRIGGER IF EXISTS update_trust_score_reviews ON public.reviews;
CREATE TRIGGER update_trust_score_reviews
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trust_score();

-- Add unique constraint on profiles.user_id
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Add FK from tutor_profiles.user_id to profiles.user_id
ALTER TABLE public.tutor_profiles 
  ADD CONSTRAINT tutor_profiles_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- =============================================
-- FIX: Convert all RESTRICTIVE policies to PERMISSIVE
-- This is critical: with RESTRICTIVE, ALL policies must pass (AND logic).
-- Tables with multiple SELECT policies (user + admin) block regular users.
-- PERMISSIVE uses OR logic: any matching policy grants access.
-- =============================================

-- CONVERSATIONS
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update conversation" ON public.conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;

CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING ((auth.uid() = student_id) OR (auth.uid() = tutor_id));
CREATE POLICY "Authenticated users can create conversations" ON public.conversations FOR INSERT WITH CHECK ((auth.uid() = student_id) OR (auth.uid() = tutor_id));
CREATE POLICY "Participants can update conversation" ON public.conversations FOR UPDATE USING ((auth.uid() = student_id) OR (auth.uid() = tutor_id));
CREATE POLICY "Admins can view all conversations" ON public.conversations FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- MESSAGES
DROP POLICY IF EXISTS "Conversation participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Conversation participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;

CREATE POLICY "Conversation participants can view messages" ON public.messages FOR SELECT USING (conversation_id IN (SELECT id FROM conversations WHERE student_id = auth.uid() OR tutor_id = auth.uid()));
CREATE POLICY "Conversation participants can send messages" ON public.messages FOR INSERT WITH CHECK ((auth.uid() = sender_id) AND (conversation_id IN (SELECT id FROM conversations WHERE student_id = auth.uid() OR tutor_id = auth.uid())));
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (conversation_id IN (SELECT id FROM conversations WHERE student_id = auth.uid() OR tutor_id = auth.uid()));
CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- PAYMENTS
DROP POLICY IF EXISTS "Students can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Tutors can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Participants can update payments" ON public.payments;

CREATE POLICY "Students can view own payments" ON public.payments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Tutors can view own payments" ON public.payments FOR SELECT USING (auth.uid() = tutor_id);
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can create payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Participants can update payments" ON public.payments FOR UPDATE USING ((auth.uid() = student_id) OR (auth.uid() = tutor_id));

-- SESSIONS
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Students can book sessions" ON public.sessions;
DROP POLICY IF EXISTS "Participants can update sessions" ON public.sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.sessions;

CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT USING ((auth.uid() = student_id) OR (auth.uid() = tutor_id));
CREATE POLICY "Students can book sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Participants can update sessions" ON public.sessions FOR UPDATE USING ((auth.uid() = student_id) OR (auth.uid() = tutor_id));
CREATE POLICY "Admins can view all sessions" ON public.sessions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- REVIEWS
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Students can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Students can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;

CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Students can create reviews" ON public.reviews FOR INSERT WITH CHECK ((auth.uid() = student_id) AND (session_id IN (SELECT id FROM sessions WHERE student_id = auth.uid() AND status = 'completed')));
CREATE POLICY "Students can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Admins can delete reviews" ON public.reviews FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- SAVED_TUTORS
DROP POLICY IF EXISTS "Students can view own saved tutors" ON public.saved_tutors;
DROP POLICY IF EXISTS "Students can save tutors" ON public.saved_tutors;
DROP POLICY IF EXISTS "Students can unsave tutors" ON public.saved_tutors;

CREATE POLICY "Students can view own saved tutors" ON public.saved_tutors FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can save tutors" ON public.saved_tutors FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can unsave tutors" ON public.saved_tutors FOR DELETE USING (auth.uid() = student_id);

-- SUBJECTS
DROP POLICY IF EXISTS "Subjects are viewable by everyone" ON public.subjects;
CREATE POLICY "Subjects are viewable by everyone" ON public.subjects FOR SELECT USING (true);

-- TUTOR_AVAILABILITY
DROP POLICY IF EXISTS "Availability is viewable by everyone" ON public.tutor_availability;
DROP POLICY IF EXISTS "Tutors can insert own availability" ON public.tutor_availability;
DROP POLICY IF EXISTS "Tutors can update own availability" ON public.tutor_availability;
DROP POLICY IF EXISTS "Tutors can delete own availability" ON public.tutor_availability;

CREATE POLICY "Availability is viewable by everyone" ON public.tutor_availability FOR SELECT USING (true);
CREATE POLICY "Tutors can insert own availability" ON public.tutor_availability FOR INSERT WITH CHECK (tutor_id IN (SELECT user_id FROM tutor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tutors can update own availability" ON public.tutor_availability FOR UPDATE USING (tutor_id IN (SELECT user_id FROM tutor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tutors can delete own availability" ON public.tutor_availability FOR DELETE USING (tutor_id IN (SELECT user_id FROM tutor_profiles WHERE user_id = auth.uid()));

-- TUTOR_PROFILES
DROP POLICY IF EXISTS "Tutor profiles are viewable by everyone" ON public.tutor_profiles;
DROP POLICY IF EXISTS "Tutors can update own tutor profile" ON public.tutor_profiles;
DROP POLICY IF EXISTS "Tutors can insert own tutor profile" ON public.tutor_profiles;
DROP POLICY IF EXISTS "Admins can update tutor_profiles" ON public.tutor_profiles;

CREATE POLICY "Tutor profiles are viewable by everyone" ON public.tutor_profiles FOR SELECT USING (true);
CREATE POLICY "Tutors can update own tutor profile" ON public.tutor_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Tutors can insert own tutor profile" ON public.tutor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update tutor_profiles" ON public.tutor_profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- TUTOR_REPORTS
DROP POLICY IF EXISTS "Users can report tutors" ON public.tutor_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON public.tutor_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.tutor_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.tutor_reports;

CREATE POLICY "Users can report tutors" ON public.tutor_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own reports" ON public.tutor_reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all reports" ON public.tutor_reports FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update reports" ON public.tutor_reports FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- TUTOR_VERIFICATIONS
DROP POLICY IF EXISTS "Admins can view all verifications" ON public.tutor_verifications;
DROP POLICY IF EXISTS "Admins can update verifications" ON public.tutor_verifications;
DROP POLICY IF EXISTS "Tutors can view own verifications" ON public.tutor_verifications;
DROP POLICY IF EXISTS "Tutors can insert own verifications" ON public.tutor_verifications;

CREATE POLICY "Admins can view all verifications" ON public.tutor_verifications FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update verifications" ON public.tutor_verifications FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Tutors can view own verifications" ON public.tutor_verifications FOR SELECT USING (auth.uid() = tutor_id);
CREATE POLICY "Tutors can insert own verifications" ON public.tutor_verifications FOR INSERT WITH CHECK (auth.uid() = tutor_id);

-- USER_ROLES
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user_roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all user_roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Add unique constraint on conversations to prevent duplicates
ALTER TABLE public.conversations ADD CONSTRAINT conversations_student_tutor_unique UNIQUE (student_id, tutor_id);
-- Add notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add suspended_at column to profiles for user suspension
ALTER TABLE public.profiles ADD COLUMN suspended_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- System can insert notifications (via service role)
CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- Fix overly permissive INSERT policy on notifications
-- Drop the permissive policy
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Notifications will be inserted via service role from edge functions
-- No direct user inserts needed - edge functions use service role which bypasses RLS
-- Create withdrawal_requests table for tutor earnings withdrawal
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  payout_method TEXT DEFAULT 'bank_transfer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create disputes table for session disputes
CREATE TABLE public.disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id),
  payment_id UUID REFERENCES public.payments(id),
  raised_by UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
  resolution TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Withdrawal requests policies
CREATE POLICY "Tutors can view own withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can create withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Admins can view all withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update withdrawal requests" ON public.withdrawal_requests
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Disputes policies
CREATE POLICY "Users can view own disputes" ON public.disputes
  FOR SELECT USING (auth.uid() = raised_by);

CREATE POLICY "Users can create disputes" ON public.disputes
  FOR INSERT WITH CHECK (auth.uid() = raised_by);

CREATE POLICY "Users can update own open disputes" ON public.disputes
  FOR UPDATE USING (auth.uid() = raised_by AND status = 'open');

CREATE POLICY "Admins can view all disputes" ON public.disputes
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all disputes" ON public.disputes
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
ALTER TABLE public.tutor_profiles ADD COLUMN IF NOT EXISTS latitude NUMERIC, ADD COLUMN IF NOT EXISTS longitude NUMERIC, ADD COLUMN IF NOT EXISTS city TEXT;
DELETE FROM payments WHERE session_id = '6b8fd0a5-e60e-456c-9d13-6b87b95de5cf' AND stripe_payment_intent_id IS NULL AND payment_status = 'pending';
DELETE FROM payments WHERE stripe_payment_intent_id IS NULL AND payment_status = 'pending';
