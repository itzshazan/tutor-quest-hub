
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
