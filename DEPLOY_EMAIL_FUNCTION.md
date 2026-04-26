# Deploy Updated Email Function

## What Was Fixed

Changed the `send-session-notification` function to return HTTP 200 status even when emails fail (instead of 502). This prevents the frontend from showing error toasts when in-app notifications work but emails fail.

## How to Deploy

### Option 1: Via Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci/functions/send-session-notification
2. Click **Deploy new version** or **Edit**
3. Copy the entire content from `supabase/functions/send-session-notification/index.ts`
4. Paste it into the editor
5. Click **Deploy**

### Option 2: Copy-Paste Method

1. Open `supabase/functions/send-session-notification/index.ts` in your editor
2. Select all (Ctrl+A / Cmd+A)
3. Copy (Ctrl+C / Cmd+C)
4. Go to Supabase Dashboard: https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci/functions/send-session-notification
5. Click **Deploy new version**
6. Paste the code
7. Click **Deploy**

### Option 3: Via Supabase CLI (If Installed)

```bash
# Make sure you're logged in
supabase login

# Deploy the function
supabase functions deploy send-session-notification --project-ref aiuufmhfmjubvkedwhci
```

## What Changed

**Before:**
```typescript
if (allEmailsFailed) {
  return new Response(JSON.stringify({...}), {
    status: 502,  // ❌ This causes frontend to show error
  });
}
```

**After:**
```typescript
// Always return 200 status since in-app notifications work
return new Response(JSON.stringify({
  success: failedEmails.length === 0,
  error: allEmailsFailed ? "Email delivery failed" : null,
  failedEmails,
}), {
  status: 200,  // ✅ Frontend checks success field instead
});
```

## After Deploying

1. **Wait 10-20 seconds** for the function to deploy
2. **Test**: Confirm a session as tutor
3. **Expected behavior**:
   - ✅ Session status changes to "confirmed"
   - ✅ In-app notification appears
   - ⚠️ If email fails, you'll see a warning (not an error)
   - ❌ No more "Session confirmed, email failed" error toast

## Troubleshooting

### If deployment fails
- Make sure you're logged in to Supabase Dashboard
- Try the copy-paste method (Option 2)
- Check for syntax errors in the code

### If emails still don't work
After deploying, check the logs to see the actual Resend API error:
https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci/functions/send-session-notification/logs

Look for:
- "Email API response" logs
- The exact error from Resend API

## Common Resend API Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid API key | Verify key in Supabase secrets |
| 403 Forbidden | Domain not verified | Use `onboarding@resend.dev` |
| 422 Validation Error | Invalid email format | Check student email address |
| 429 Too Many Requests | Rate limit | Wait a few minutes |

## Next Steps

1. Deploy the function (see options above)
2. Test by confirming a session
3. If emails still fail, check the logs and share the error message
4. The error message will now be more detailed and helpful

---

**TL;DR**: Deploy the updated function via Supabase Dashboard, then test again.
