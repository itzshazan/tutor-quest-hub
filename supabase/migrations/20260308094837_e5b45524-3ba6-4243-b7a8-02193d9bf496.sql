
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
