# How to Add Secrets to Supabase Edge Functions

## What Are Secrets?

Secrets are environment variables that Edge Functions can access. They're like `.env` variables but stored securely in Supabase's cloud infrastructure.

## Why Can't Edge Functions Read `.env`?

Edge Functions run on Supabase's servers (not your local machine), so they can't access your local `.env` file. You must configure secrets in the Supabase Dashboard.

## Step-by-Step: Add RESEND_API_KEY

### Method 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `aiuufmhfmjubvkedwhci`

2. **Navigate to Edge Functions Settings**
   - Click **Project Settings** (gear icon in left sidebar)
   - Click **Edge Functions** in the settings menu
   - OR go directly to: https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci/settings/functions

3. **Add the Secret**
   - Scroll to the **Secrets** section
   - Click **Add secret** or **New secret**
   - Enter:
     - **Name**: `RESEND_API_KEY`
     - **Value**: `re_JeosjnCz_3oup79Wv4U19Cce5c1s43iPy`
   - Click **Add** or **Save**

4. **Verify**
   - The secret should now appear in the list
   - Edge Functions will automatically restart and have access to it

### Method 2: Via Supabase CLI (Alternative)

If you have Supabase CLI installed and authenticated:

```bash
# Set the secret
supabase secrets set RESEND_API_KEY=re_JeosjnCz_3oup79Wv4U19Cce5c1s43iPy --project-ref aiuufmhfmjubvkedwhci

# Verify it was set
supabase secrets list --project-ref aiuufmhfmjubvkedwhci
```

## Other Secrets You May Need

Your project also needs these secrets (likely already configured):

| Secret Name | Purpose | Where to Find |
|-------------|---------|---------------|
| `STRIPE_SECRET_KEY` | Process payments | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Verify Stripe webhooks | Stripe Dashboard → Developers → Webhooks |
| `RESEND_API_KEY` | Send emails | Resend Dashboard → API Keys |

## How Edge Functions Access Secrets

In your Edge Function code:

```typescript
const apiKey = Deno.env.get("RESEND_API_KEY");
```

This reads from Supabase secrets, NOT from `.env` file.

## Common Mistakes

❌ **Wrong**: Adding secrets to `.env` file
```env
RESEND_API_KEY="re_JeosjnCz_3oup79Wv4U19Cce5c1s43iPy"
```
This only works for frontend code (VITE_* variables).

✅ **Right**: Adding secrets to Supabase Dashboard
- Go to Project Settings → Edge Functions → Secrets
- Add the secret there

## Troubleshooting

### "Secret not found" error
- Make sure you added the secret in the Dashboard
- Check the secret name matches exactly (case-sensitive)
- Wait a few seconds for Edge Functions to restart

### "403 Forbidden" when deploying
- You need to authenticate with Supabase CLI
- Run: `supabase login`
- Or add secrets via Dashboard instead

### How to update a secret
- Go to Project Settings → Edge Functions → Secrets
- Click the secret you want to update
- Enter the new value
- Click Save

### How to delete a secret
- Go to Project Settings → Edge Functions → Secrets
- Click the trash icon next to the secret
- Confirm deletion

## Security Best Practices

1. **Never commit secrets to Git**
   - `.env` is in `.gitignore` (good)
   - Never hardcode API keys in code

2. **Use different keys for development and production**
   - Test keys for development (e.g., `pk_test_...`)
   - Live keys for production (e.g., `pk_live_...`)

3. **Rotate keys regularly**
   - Generate new API keys periodically
   - Update secrets in Supabase Dashboard

4. **Limit key permissions**
   - Use restricted API keys when possible
   - Only grant necessary permissions

## Quick Reference

| What | Where |
|------|-------|
| Add secrets | Dashboard → Project Settings → Edge Functions → Secrets |
| View Edge Function logs | Dashboard → Edge Functions → [function name] → Logs |
| Deploy Edge Functions | Dashboard → Edge Functions → [function name] → Deploy |
| Manage API keys | Resend/Stripe Dashboard |

## Your Current Setup

- **Project**: `aiuufmhfmjubvkedwhci`
- **Region**: `ap-south-1`
- **Secrets needed**:
  - ✅ `STRIPE_SECRET_KEY` (already set)
  - ✅ `STRIPE_WEBHOOK_SECRET` (already set)
  - ⚠️ `RESEND_API_KEY` (needs to be set)

## Next Steps

1. Add `RESEND_API_KEY` to Supabase Dashboard (see Method 1 above)
2. Test email notifications by confirming a session
3. Check Edge Function logs if emails still fail
4. See `QUICK_FIX_EMAILS.md` for troubleshooting
