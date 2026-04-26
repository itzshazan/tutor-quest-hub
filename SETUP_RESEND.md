# Setup Resend Email Notifications

## Problem
After migrating from Lovable to self-hosted Supabase, email notifications stopped working because the RESEND_API_KEY needs to be configured in Supabase secrets (not just in `.env`).

## Solution

### Step 1: Set Resend API Key in Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci
2. Navigate to **Project Settings** → **Edge Functions** → **Manage secrets**
3. Add a new secret:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_JeosjnCz_3oup79Wv4U19Cce5c1s43iPy`
4. Click **Add secret** or **Save**

**IMPORTANT**: Edge Functions do NOT read from `.env` files. They only read from Supabase Dashboard secrets.

### Step 2: Deploy Updated Edge Function (Optional but Recommended)

The function has been updated with better error logging. To deploy it:

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci
2. Navigate to **Edge Functions** → **send-session-notification**
3. Click **Deploy new version**
4. Copy and paste the content from `supabase/functions/send-session-notification/index.ts`
5. Click **Deploy**

OR use the Supabase CLI (if you have it installed and authenticated):
```bash
supabase functions deploy send-session-notification --project-ref aiuufmhfmjubvkedwhci
```

### Step 3: Test Email Notifications

1. Confirm a session as a tutor
2. Check if the student receives an email
3. Check the Edge Function logs for any errors:
   - Go to **Edge Functions** → **send-session-notification** → **Logs**
   - Look for the log message: "RESEND_API_KEY found: re_Jeosj..."
   - Look for "Email API response" logs with status and error details

## Common Issues

### Issue 1: "From" Email Not Verified
- **Error**: `403 Forbidden` or `Domain not verified`
- **Solution**: 
  - For testing, use `onboarding@resend.dev` (already configured)
  - For production, verify your own domain in Resend Dashboard

### Issue 2: Rate Limit Exceeded
- **Error**: `429 Too Many Requests`
- **Solution**: Wait a few minutes or upgrade your Resend plan

### Issue 3: Invalid API Key Format
- **Error**: `401 Unauthorized`
- **Solution**: Verify the API key starts with `re_` and is copied correctly

## Current Configuration

- **Resend API Key**: `re_JeosjnCz_3oup79Wv4U19Cce5c1s43iPy`
- **From Email**: `Tutor Quest <onboarding@resend.dev>`
- **Edge Function**: `send-session-notification`

## Testing Checklist

- [ ] Set RESEND_API_KEY in Supabase Dashboard secrets
- [ ] Confirm a session as tutor
- [ ] Check student receives email
- [ ] Check Edge Function logs for errors
- [ ] Verify in-app notifications still work (they should work regardless of email)

## Alternative: Use Supabase CLI (if installed)

```bash
# Set the secret via CLI
supabase secrets set RESEND_API_KEY=re_JeosjnCz_3oup79Wv4U19Cce5c1s43iPy --project-ref aiuufmhfmjubvkedwhci

# List all secrets to verify
supabase secrets list --project-ref aiuufmhfmjubvkedwhci
```

## Notes

- The `.env` file is only for frontend environment variables (prefixed with `VITE_`)
- Edge Functions read secrets from Supabase Dashboard, not from `.env`
- In-app notifications will still work even if emails fail
- The function already has detailed error logging to help debug issues
