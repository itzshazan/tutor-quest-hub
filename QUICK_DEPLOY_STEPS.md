# 🚀 Quick Deploy: 3 Steps to Fix Emails

## The Problem
The email function returns an error status (502) even when in-app notifications work, causing the frontend to show error toasts.

## The Fix (3 minutes)

### Step 1: Copy the Updated Code
1. Open `supabase/functions/send-session-notification/index.ts` in your editor
2. Select all (Ctrl+A or Cmd+A)
3. Copy (Ctrl+C or Cmd+C)

OR use the file: `COPY_THIS_TO_SUPABASE.txt`

### Step 2: Deploy to Supabase
1. Go to: https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci/functions/send-session-notification
2. Click **Deploy new version** or **Edit function**
3. Delete all existing code
4. Paste the copied code
5. Click **Deploy** or **Save**

### Step 3: Test It
1. Log in as a tutor
2. Confirm a session
3. Check if error toast is gone

## What Changed

The function now returns HTTP 200 status even when emails fail, so the frontend doesn't show error toasts. In-app notifications still work regardless.

## Expected Behavior After Deploy

### Before:
- ❌ "Session confirmed, email failed" error toast (red)
- ✅ Session status changes
- ✅ In-app notification appears

### After:
- ✅ Session status changes
- ✅ In-app notification appears
- ⚠️ Warning toast if email fails (yellow, not red)
- 📧 Email sent if Resend API works

## Still Having Issues?

If emails still don't send after deploying, check the logs:
https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci/functions/send-session-notification/logs

Look for "Email API response" to see the exact Resend API error.

Common issues:
- **401 Unauthorized**: API key is wrong
- **403 Forbidden**: Domain not verified (use `onboarding@resend.dev`)
- **422 Validation Error**: Invalid email address
- **429 Too Many Requests**: Rate limit (wait a few minutes)

## Visual Guide

```
┌─────────────────────────────────────────────────────┐
│ 1. Copy Code                                        │
│    supabase/functions/send-session-notification/    │
│    index.ts                                         │
│    [Ctrl+A] → [Ctrl+C]                              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. Deploy to Supabase                               │
│    Dashboard → Edge Functions →                     │
│    send-session-notification → Deploy               │
│    [Paste code] → [Deploy]                          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. Test                                             │
│    Login as tutor → Confirm session                 │
│    ✅ No error toast                                │
│    ✅ In-app notification works                     │
└─────────────────────────────────────────────────────┘
```

## Need Help?

If you can't deploy via Dashboard, share a screenshot and I'll help you troubleshoot.

---

**Next**: Deploy the function and test it!
