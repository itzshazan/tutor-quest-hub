# Migration Guide: From Lovable to Self-Hosted Supabase + Stripe

## Overview
This guide will help you migrate from Lovable's managed infrastructure to your own Supabase project with direct Stripe integration.

## Prerequisites
- [ ] Stripe account with API keys
- [ ] Supabase account (free tier works)
- [ ] Supabase CLI installed

## Step 1: Install Supabase CLI

### Windows (PowerShell):
```powershell
# Using Scoop
scoop install supabase

# Or using npm
npm install -g supabase
```

### Verify installation:
```bash
supabase --version
```

## Step 2: Create New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: TutorQuest (or your choice)
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to your users
4. Wait for project to be created (~2 minutes)

## Step 3: Get Your Supabase Credentials

From your new Supabase project dashboard:

1. Go to **Settings → API**
2. Copy these values:
   - **Project URL** (e.g., https://xxxxx.supabase.co)
   - **anon/public key** (starts with eyJhbGc...)
   - **service_role key** (starts with eyJhbGc... - keep this secret!)

## Step 4: Export Data from Lovable Supabase

### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Lovable Supabase dashboard: https://supabase.com/dashboard/project/zbewmwlvacvedkbqtwrk
2. Go to **Database → Backups**
3. Click "Download backup" or use SQL Editor to export tables

### Option B: Using SQL Dump
```bash
# Connect to Lovable Supabase and export
pg_dump "postgresql://postgres:[PASSWORD]@db.zbewmwlvacvedkbqtwrk.supabase.co:5432/postgres" > backup.sql
```

## Step 5: Set Up Local Supabase

```bash
# Initialize Supabase in your project
supabase init

# Link to your new Supabase project
supabase link --project-ref YOUR_NEW_PROJECT_REF

# Push your database schema
supabase db push

# Deploy Edge Functions
supabase functions deploy create-session-payment
supabase functions deploy capture-payment
supabase functions deploy refund-payment
supabase functions deploy stripe-webhook
supabase functions deploy send-session-notification
```

## Step 6: Update Environment Variables

Update your `.env` file:

```env
# NEW Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_NEW_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_new_anon_key

# For Edge Functions (set in Supabase Dashboard → Edge Functions → Secrets)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
RESEND_API_KEY=re_your_resend_key (optional)
```

## Step 7: Set Edge Function Secrets

In your new Supabase dashboard:

1. Go to **Edge Functions → Manage secrets**
2. Add these secrets:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   RESEND_API_KEY=re_... (if using email)
   ```

## Step 8: Configure Stripe Webhook

1. Go to Stripe Dashboard: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Set URL: `https://YOUR_NEW_PROJECT.supabase.co/functions/v1/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`
   - `charge.dispute.closed`
5. Copy the webhook signing secret
6. Add it to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

## Step 9: Migrate Database Schema

If you don't have migration files, create them:

```bash
# Generate migration from existing schema
supabase db diff -f initial_schema

# Or manually create migration files in supabase/migrations/
```

## Step 10: Import Data

```bash
# Import your backup
psql "postgresql://postgres:[PASSWORD]@db.YOUR_NEW_PROJECT.supabase.co:5432/postgres" < backup.sql

# Or use Supabase Dashboard → SQL Editor to run import scripts
```

## Step 11: Test Everything

1. **Test Authentication**: Sign up/login
2. **Test Database**: Create/read data
3. **Test Edge Functions**: Make a test payment
4. **Test Webhooks**: Complete a Stripe payment

## Step 12: Update Frontend

Your frontend should automatically work with the new `.env` values. Just restart your dev server:

```bash
npm run dev
```

## Troubleshooting

### Edge Functions not deploying?
```bash
# Check Supabase CLI is logged in
supabase login

# Re-link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy with verbose logging
supabase functions deploy --debug
```

### Database connection issues?
- Check your database password
- Verify project URL is correct
- Check if IP is whitelisted (Supabase allows all by default)

### Stripe webhook not working?
- Verify webhook URL is correct
- Check webhook secret matches
- Test with Stripe CLI: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`

## Cost Comparison

### Lovable (Current)
- Managed Supabase + hosting
- Cost: ~$20-50/month

### Self-Hosted (New)
- Supabase Free Tier: $0/month (500MB database, 2GB bandwidth)
- Supabase Pro: $25/month (8GB database, 50GB bandwidth)
- Stripe: Pay-as-you-go (2.9% + 30¢ per transaction)
- Total: $0-25/month + transaction fees

## Next Steps

After migration:
1. Update DNS/domain if needed
2. Set up monitoring (Supabase has built-in logs)
3. Configure backups (automatic in Supabase)
4. Remove Lovable project (after confirming everything works)

## Rollback Plan

If something goes wrong:
1. Keep Lovable project active during migration
2. Test new setup thoroughly before switching
3. Update `.env` back to Lovable credentials if needed
