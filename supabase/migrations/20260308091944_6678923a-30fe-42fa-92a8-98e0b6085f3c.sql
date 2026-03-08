
-- Add unique constraint on profiles.user_id
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Add FK from tutor_profiles.user_id to profiles.user_id
ALTER TABLE public.tutor_profiles 
  ADD CONSTRAINT tutor_profiles_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
