# Payment Setup Guide for TutorQuest

## Issue
You're getting "Payment failed - Edge Function returned a non-2xx status code" because the Stripe integration is not configured.

## Solution: Configure Stripe in Lovable Cloud

### Step 1: Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up or log in to your Stripe account
3. Click on **Developers** in the left sidebar
4. Click on **API keys**
5. You'll see two keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)
6. Copy both keys (use test keys for development)

### Step 2: Add Stripe Keys to Lovable Cloud Secrets

Based on your screenshot, you're already in the Lovable Cloud Secrets panel. Here's what you need to add:

1. Click **"+ Add another"** button
2. Add the following secrets:

#### Secret 1: STRIPE_SECRET_KEY
- **Name**: `STRIPE_SECRET_KEY`
- **Value**: Your Stripe secret key (e.g., `sk_test_xxxxxxxxxxxxx`)
- Click **Save**

#### Secret 2: STRIPE_PUBLISHABLE_KEY (for frontend)
- **Name**: `STRIPE_PUBLISHABLE_KEY`
- **Value**: Your Stripe publishable key (e.g., `pk_test_xxxxxxxxxxxxx`)
- Click **Save**

#### Secret 3: STRIPE_WEBHOOK_SECRET (optional, for production)
- **Name**: `STRIPE_WEBHOOK_SECRET`
- **Value**: Get this from Stripe Dashboard > Developers > Webhooks
- Click **Save**

### Step 3: Redeploy Edge Functions

After adding the secrets:

1. Go back to your Lovable project
2. The edge functions should automatically pick up the new environment variables
3. If not, you may need to redeploy by making a small change and saving

### Step 4: Test Payment

1. Go to your Sessions page
2. Click "Pay Now" on a confirmed session
3. You should now be redirected to Stripe Checkout
4. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code

## Current Secrets You Have

From your screenshot, I can see you already have:
- ✅ `RESEND_API_KEY` - For email notifications
- ✅ `STRIPE_SECRET_KEY` - **Already configured!** (Lovable label)
- ✅ `LOVABLE_API_KEY` - For Lovable integration

## Troubleshooting

### If payment still fails after adding secrets:

1. **Check the secret name is exact**: `STRIPE_SECRET_KEY` (case-sensitive)
2. **Verify the key is valid**: Go to Stripe Dashboard and confirm the key is active
3. **Check Edge Function logs**: In Lovable, go to Edge Functions > Logs to see detailed error
4. **Ensure session is confirmed**: Payment only works for confirmed sessions

### Common Errors:

- **"Stripe API key is invalid"**: Wrong secret key or expired
- **"Session must be confirmed"**: Book a session first, then pay
- **"Only the student can pay"**: You must be logged in as the student who booked the session

## Payment Flow

1. Student books a session → Status: "pending"
2. Tutor confirms session → Status: "confirmed"
3. Student clicks "Pay Now" → Redirected to Stripe Checkout
4. Student completes payment → Status: "paid"
5. After session completion → Tutor can request payout

## Database Tables Involved

- `sessions` - Stores session bookings
- `payments` - Stores payment records
- `tutor_profiles` - Contains hourly_rate for pricing
- `notifications` - Sends payment notifications

## Edge Functions Used

- `create-session-payment` - Creates Stripe checkout session
- `stripe-webhook` - Handles Stripe payment events
- `capture-payment` - Captures payment after session completion
- `refund-payment` - Handles refunds if needed

## Next Steps

1. ✅ Add `STRIPE_SECRET_KEY` to Lovable Cloud Secrets
2. ✅ Test payment with Stripe test card
3. ✅ Verify payment appears in Stripe Dashboard
4. ✅ Check payment record in your database

## Support

If you continue to have issues:
1. Check Lovable Edge Function logs
2. Check Stripe Dashboard > Developers > Logs
3. Verify all environment variables are set correctly
