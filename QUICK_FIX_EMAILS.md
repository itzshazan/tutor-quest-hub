# 🚀 Quick Fix: Email Notifications Not Working

## The Problem
Emails stopped working after migrating from Lovable because **Edge Functions don't read `.env` files** - they need secrets configured in Supabase Dashboard.

## The Fix (2 minutes)

### 1. Add RESEND_API_KEY to Supabase Secrets

**Go to**: https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci/settings/functions

**Add this secret**:
```
Name:  RESEND_API_KEY
Value: re_JeosjnCz_3oup79Wv4U19Cce5c1s43iPy
```

Click **Add secret** or **Save**.

### 2. Restart Edge Functions (Automatic)

Edge Functions automatically restart when secrets are updated. No manual restart needed.

### 3. Test It

1. Log in as a tutor
2. Go to Sessions page
3. Confirm a pending session
4. Check if the student receives an email

### 4. Check Logs (if emails still fail)

**Go to**: https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci/functions/send-session-notification/logs

Look for:
- ✅ "RESEND_API_KEY found: re_Jeosj..." (means secret is configured)
- ❌ "RESEND_API_KEY is not configured" (means secret is missing)
- 📧 "Email API response" logs showing Resend API status

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "RESEND_API_KEY is not configured" | Secret not set in Dashboard | Add secret in Dashboard (Step 1) |
| "403 Forbidden" or "Domain not verified" | Using unverified email domain | Use `onboarding@resend.dev` (already configured) |
| "401 Unauthorized" | Invalid API key | Verify key: `re_JeosjnCz_3oup79Wv4U19Cce5c1s43iPy` |
| "429 Too Many Requests" | Rate limit exceeded | Wait a few minutes |

## Why This Happened

- **Before (Lovable)**: Lovable automatically synced `.env` to Edge Function secrets
- **After (Self-hosted)**: You must manually add secrets in Supabase Dashboard
- **`.env` file**: Only used for frontend variables (VITE_* prefix)
- **Edge Functions**: Read secrets from Supabase Dashboard only

## Verification Checklist

- [ ] RESEND_API_KEY added to Supabase Dashboard secrets
- [ ] Confirmed a session as tutor
- [ ] Student received email
- [ ] Checked Edge Function logs (no errors)
- [ ] In-app notifications working (should work regardless)

## Still Not Working?

1. Check Resend Dashboard: https://resend.com/emails
   - See if emails are being sent but failing delivery
   - Check for API errors

2. Check Edge Function logs for detailed error messages

3. Verify the API key is active in Resend Dashboard

4. Try sending a test email directly from Resend Dashboard to verify the key works

## Need Help?

The Edge Function has detailed logging. After confirming a session, check the logs at:
https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci/functions/send-session-notification/logs

The logs will show exactly what's failing.
