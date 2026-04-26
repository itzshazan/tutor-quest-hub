-- Migration to add a Database Webhook for sending session notifications
-- Replace [PROJECT_REF] with your Supabase Project Reference ID
-- Replace [ANON_KEY] with your Supabase Project Anon Key

-- Ensure we're in the right schema
SET search_path TO public;

-- Drop trigger if it exists to allow re-running
DROP TRIGGER IF EXISTS "session_notification_webhook" ON public.sessions;

-- Create the webhook trigger
-- The supabase_functions.http_request function handles making async HTTP calls via pg_net
CREATE TRIGGER "session_notification_webhook"
  AFTER INSERT OR UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://aiuufmhfmjubvkedwhci.supabase.co/functions/v1/send-session-notification',
    'POST',
    '{"Content-Type":"application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdXVmbWhmbWp1YnZrZWR3aGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjI5MDAsImV4cCI6MjA5MjY5ODkwMH0.XVh2XfBpHbQz9NPYH-exOSfPbciJaumgxHqy6nWhj64"}',
    '{}',
    '1000'
  );

-- NOTE: 
-- You must manually replace [PROJECT_REF] and [ANON_KEY] with your actual Supabase project values.
-- Alternatively, if you are configuring this via the Supabase Dashboard UI (Database -> Webhooks):
-- 1. Name: send_session_notification
-- 2. Table: sessions
-- 3. Events: Insert, Update
-- 4. HTTP Request URL: https://[PROJECT_REF].supabase.co/functions/v1/send-session-notification
-- 5. HTTP Headers: 
--      Authorization: Bearer [ANON_KEY]
--      Content-Type: application/json
