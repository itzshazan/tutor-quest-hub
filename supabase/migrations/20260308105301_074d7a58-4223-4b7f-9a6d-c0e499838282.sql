-- Fix overly permissive INSERT policy on notifications
-- Drop the permissive policy
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Notifications will be inserted via service role from edge functions
-- No direct user inserts needed - edge functions use service role which bypasses RLS