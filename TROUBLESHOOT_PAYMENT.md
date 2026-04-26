# 🔧 Troubleshooting: "Failed to send a request to the Edge Function"

## What This Error Means

This error means the frontend can't reach your Edge Function at all. The request isn't even getting to your code.

## ✅ Checklist to Fix

### 1. Verify Edge Function is Deployed

Go to your Supabase Dashboard:
1. Open: https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci
2. Go to **Edge Functions** (left sidebar)
3. Check if `create-session-payment` function exists
4. If it doesn't exist or shows "Not deployed", you need to deploy it

### 2. Deploy the Edge Function

**Option A: Using Supabase Dashboard (Easiest)**

1. In Supabase Dashboard → Edge Functions
2. Click **"Create a new function"** or **"Deploy"**
3. Name: `create-session-payment`
4. Copy the ENTIRE code from: `supabase/functions/create-session-payment/index.ts`
5. Paste it in the editor
6. Click **"Deploy"**

**Option B: Using Supabase CLI** (if you have it installed)

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref aiuufmhfmjubvkedwhci

# Deploy the function
supabase functions deploy create-session-payment
```

### 3. Set Edge Function Secrets

After deploying, you MUST set these secrets:

1. In Supabase Dashboard → **Edge Functions** → **Manage secrets**
2. Add these secrets:

```
STRIPE_SECRET_KEY = sk_test_51SyLxaHvhpaO6nKV... (your full Stripe secret key)
STRIPE_WEBHOOK_SECRET = whsec_... (from Stripe webhook setup)
```

**Where to get Stripe keys:**
- Secret key: https://dashboard.stripe.com/test/apikeys
- Webhook secret: https://dashboard.stripe.com/test/webhooks (click your endpoint)

### 4. Verify Function URL

The function should be accessible at:
```
https://aiuufmhfmjubvkedwhci.supabase.co/functions/v1/create-session-payment
```

Test it in your browser (you'll get an auth error, but that's OK - it means the function exists):
- Open: https://aiuufmhfmjubvkedwhci.supabase.co/functions/v1/create-session-payment
- If you see "User not authenticated" → ✅ Function is deployed
- If you see "Function not found" → ❌ Function not deployed

### 5. Check Function Logs

After deploying:
1. Go to Supabase Dashboard → Edge Functions
2. Click on `create-session-payment`
3. Go to **Logs** tab
4. Try the payment again
5. Check if any errors appear in logs

### 6. Verify Your .env File

Make sure your `.env` has the correct values:

```env
VITE_SUPABASE_URL=https://aiuufmhfmjubvkedwhci.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc... (your anon key)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SyLxaHvhpaO6nKV... (your Stripe publishable key)
```

After changing `.env`, restart your dev server:
```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## 🎯 Most Common Causes

### Cause 1: Edge Function Not Deployed
**Solution**: Deploy it using Supabase Dashboard (see step 2 above)

### Cause 2: Missing Secrets
**Solution**: Add `STRIPE_SECRET_KEY` in Edge Function secrets (see step 3 above)

### Cause 3: Wrong Project URL
**Solution**: Verify `.env` has correct `VITE_SUPABASE_URL`

### Cause 4: Function Name Mismatch
**Solution**: Ensure function is named exactly `create-session-payment` (no typos)

---

## 🧪 Quick Test

### Test 1: Check if function exists
Open in browser:
```
https://aiuufmhfmjubvkedwhci.supabase.co/functions/v1/create-session-payment
```

Expected: "User not authenticated" error (this is good!)
Bad: "Function not found" or 404

### Test 2: Check browser console
1. Open your app: http://localhost:8080
2. Open browser DevTools (F12)
3. Go to Console tab
4. Try payment
5. Look for errors

### Test 3: Check Network tab
1. Open DevTools (F12) → Network tab
2. Try payment
3. Look for request to `create-session-payment`
4. Click on it to see response

---

## 📋 Step-by-Step Fix (Most Likely Solution)

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci

2. **Click "Edge Functions" in left sidebar**

3. **Check if `create-session-payment` exists**
   - If NO → Click "Create a new function"
   - If YES → Click on it and check deployment status

4. **Deploy the function:**
   - Click "Create function" or "Deploy"
   - Name: `create-session-payment`
   - Copy code from `supabase/functions/create-session-payment/index.ts`
   - Paste and click "Deploy"

5. **Set secrets:**
   - Click "Manage secrets"
   - Add `STRIPE_SECRET_KEY` = your Stripe secret key
   - Add `STRIPE_WEBHOOK_SECRET` = your webhook secret

6. **Test again:**
   - Go to your app
   - Try payment
   - Should redirect to Stripe checkout!

---

## 🆘 Still Not Working?

### Check these:

1. **Function logs** (Supabase Dashboard → Edge Functions → Logs)
2. **Browser console** (F12 → Console)
3. **Network tab** (F12 → Network)
4. **Stripe Dashboard** (check if API keys are correct)

### Common Error Messages:

| Error | Cause | Fix |
|-------|-------|-----|
| "Failed to send request" | Function not deployed | Deploy function |
| "User not authenticated" | Not logged in | Log in first |
| "Session not found" | Invalid session ID | Check session exists |
| "Payment system not configured" | Missing STRIPE_SECRET_KEY | Add secret |
| "Tutor has no hourly rate" | Tutor profile incomplete | Set hourly rate |

---

## ✅ Success Checklist

- [ ] Edge Function `create-session-payment` is deployed
- [ ] Secret `STRIPE_SECRET_KEY` is set
- [ ] Secret `STRIPE_WEBHOOK_SECRET` is set (optional for now)
- [ ] `.env` file has correct `VITE_SUPABASE_URL`
- [ ] `.env` file has correct `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] `.env` file has `VITE_STRIPE_PUBLISHABLE_KEY`
- [ ] Dev server restarted after `.env` changes
- [ ] Logged in to the app
- [ ] Session is in "confirmed" status
- [ ] Tutor has hourly rate set

Once all checked, payment should work! 🎉
