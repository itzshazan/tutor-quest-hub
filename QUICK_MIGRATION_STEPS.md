# Quick Migration: Remove Lovable, Use Your Own Supabase + Stripe

## What You Need
1. ✅ Stripe account with test API keys
2. ✅ Create a new Supabase project (free)
3. ✅ Your project files (you have these)

---

## STEP 1: Create New Supabase Project (5 minutes)

1. Go to: **https://supabase.com/dashboard**
2. Click **"New Project"**
3. Fill in:
   - Name: `TutorQuest`
   - Database Password: (create a strong password - SAVE IT!)
   - Region: Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for setup

---

## STEP 2: Get Your New Credentials

Once project is ready:

1. Go to **Settings → API** (left sidebar)
2. Copy these 3 values:

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGc...
service_role key: eyJhbGc... (keep secret!)
```

---

## STEP 3: Update Your .env File

Replace your current `.env` with:

```env
# Your NEW Supabase Project
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here

# Stripe Keys (from https://dashboard.stripe.com/test/apikeys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## STEP 4: Set Up Database Schema

### Option A: Using Supabase Dashboard (Easiest)

1. In your new Supabase project, go to **SQL Editor**
2. I'll generate the SQL schema for you - run it there

### Option B: Copy from Lovable

1. Go to your Lovable Supabase: https://supabase.com/dashboard/project/zbewmwlvacvedkbqtwrk
2. Go to **Database → Schema**
3. Export each table's schema
4. Import into new project

---

## STEP 5: Deploy Edge Functions

### Using Supabase Dashboard (No CLI needed!)

1. In your new Supabase project, go to **Edge Functions**
2. Click **"Create a new function"**
3. Create these 5 functions by copying code from your `supabase/functions/` folder:
   - `create-session-payment`
   - `capture-payment`
   - `refund-payment`
   - `stripe-webhook`
   - `send-session-notification`

For each function:
- Click "Create function"
- Name it (e.g., `create-session-payment`)
- Paste the code from your local file
- Click "Deploy"

---

## STEP 6: Set Edge Function Secrets

In Supabase Dashboard:

1. Go to **Edge Functions → Manage secrets**
2. Add these secrets:

```
STRIPE_SECRET_KEY = sk_test_your_key_from_stripe_dashboard
STRIPE_WEBHOOK_SECRET = (we'll get this in next step)
```

To get your Stripe keys:
- Go to: https://dashboard.stripe.com/test/apikeys
- Copy "Secret key" (starts with `sk_test_`)

---

## STEP 7: Configure Stripe Webhook

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Endpoint URL: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook`
4. Select these events:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
   - ✅ `charge.dispute.created`
   - ✅ `charge.dispute.closed`
5. Click **"Add endpoint"**
6. Copy the **"Signing secret"** (starts with `whsec_`)
7. Add it to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

---

## STEP 8: Migrate Your Data (Optional)

If you have existing users/data in Lovable:

### Export from Lovable:
1. Go to Lovable Supabase: https://supabase.com/dashboard/project/zbewmwlvacvedkbqtwrk
2. Go to **Table Editor**
3. For each table, click **"..."** → **"Export as CSV"**

### Import to New Supabase:
1. In your new project, go to **Table Editor**
2. Select table → **"..."** → **"Import data from CSV"**

---

## STEP 9: Test Your Setup

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Test these features:
   - ✅ Sign up / Login
   - ✅ Browse tutors
   - ✅ Book a session
   - ✅ Make a payment (use test card: `4242 4242 4242 4242`)

---

## STEP 10: Remove Lovable

Once everything works:

1. Update production `.env` with new Supabase credentials
2. Deploy your app (Vercel/Netlify/etc.)
3. Cancel Lovable subscription
4. Delete Lovable project

---

## Troubleshooting

### "Invalid API key" error?
- Double-check your `.env` file has correct Supabase URL and keys
- Restart dev server after changing `.env`

### Payment not working?
- Check Edge Function logs in Supabase Dashboard
- Verify Stripe webhook secret is correct
- Test webhook: https://dashboard.stripe.com/test/webhooks → Click your endpoint → "Send test webhook"

### Database connection error?
- Verify Supabase project is active (not paused)
- Check URL format: `https://xxxxx.supabase.co` (no trailing slash)

---

## Cost Breakdown

**Lovable**: ~$20-50/month

**Your Own Setup**:
- Supabase Free: $0/month (500MB DB, 2GB bandwidth)
- Stripe: 2.9% + 30¢ per transaction
- **Total: $0/month** (until you outgrow free tier)

---

## Need Help?

1. Check Supabase logs: **Logs & Analytics** in dashboard
2. Check Stripe webhook logs: https://dashboard.stripe.com/test/webhooks
3. Check browser console for frontend errors

---

## What's Next?

After migration works locally:
1. Deploy to production (Vercel/Netlify)
2. Update production environment variables
3. Switch Stripe from test mode to live mode
4. Set up monitoring and backups
