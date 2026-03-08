
-- Add teaching_method to tutor_profiles (online, offline, both)
ALTER TABLE public.tutor_profiles ADD COLUMN IF NOT EXISTS teaching_method text NOT NULL DEFAULT 'offline';

-- Add teaching_radius in km to tutor_profiles
ALTER TABLE public.tutor_profiles ADD COLUMN IF NOT EXISTS teaching_radius numeric DEFAULT 10;

-- Add phone to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
