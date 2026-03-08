
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
