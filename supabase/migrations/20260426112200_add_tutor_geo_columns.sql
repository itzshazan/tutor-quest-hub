-- Add latitude/longitude/city columns to tutor_profiles (skip if already present)
ALTER TABLE public.tutor_profiles
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS city TEXT;

-- Add a composite index for faster filtering on coordinates
CREATE INDEX IF NOT EXISTS tutor_profiles_lat_lng_idx
  ON public.tutor_profiles (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
