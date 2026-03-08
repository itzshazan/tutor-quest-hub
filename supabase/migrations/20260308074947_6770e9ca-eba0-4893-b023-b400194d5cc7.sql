
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
