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