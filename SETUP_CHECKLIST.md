# 🚀 Setup Checklist: Migrate from Lovable to Your Own Infrastructure

## ✅ Pre-Migration Checklist

- [ ] I have a Stripe account (https://dashboard.stripe.com)
- [ ] I have my Stripe test API keys ready
- [ ] I'm ready to create a new Supabase project
- [ ] I've backed up any important data from Lovable

---

## 📋 Step-by-Step Setup

### 1. Create Supabase Project (5 min)

- [ ] Go to https://supabase.com/dashboard
- [ ] Click "New Project"
- [ ] Name: `TutorQuest` (or your choice)
- [ ] Set a strong database password (SAVE IT!)
- [ ] Choose region closest to you
- [ ] Wait for project creation (~2 min)

### 2. Get Supabase Credentials (2 min)

- [ ] Go to Settings → API
- [ ] Copy **Project URL**: `https://xxxxx.supabase.co`
- [ ] Copy **anon public** key (starts with `eyJhbGc...`)
- [ ] Copy **service_role** key (starts with `eyJhbGc...`)

### 3. Set Up Database Schema (10 min)

- [ ] Go to SQL Editor in Supabase Dashboard
- [ ] Click "New query"
- [ ] Open the file `complete_schema.sql` from your project
- [ ] Copy all content and paste into SQL Editor
- [ ] Click "Run" to execute
- [ ] Verify tables are created (check Table Editor)

### 4. Deploy Edge Functions (15 min)

For each function, do this:

#### Function 1: create-session-payment
- [ ] Go to Edge Functions → Create function
- [ ] Name: `create-session-payment`
- [ ] Copy code from `supabase/functions/create-session-payment/index.ts`
- [ ] Paste and click "Deploy"

#### Function 2: capture-payment
- [ ] Create function: `capture-payment`
- [ ] Copy code from `supabase/functions/capture-payment/index.ts`
- [ ] Deploy

#### Function 3: refund-payment
- [ ] Create function: `refund-payment`
- [ ] Copy code from `supabase/functions/refund-payment/index.ts`
- [ ] Deploy

#### Function 4: stripe-webhook
- [ ] Create function: `stripe-webhook`
- [ ] Copy code from `supabase/functions/stripe-webhook/index.ts`
- [ ] Deploy

#### Function 5: send-session-notification
- [ ] Create function: `send-session-notification`
- [ ] Copy code from `supabase/functions/send-session-notification/index.ts`
- [ ] Deploy

### 5. Configure Stripe (5 min)

#### Get Stripe Keys:
- [ ] Go to https://dashboard.stripe.com/test/apikeys
- [ ] Copy **Publishable key** (starts with `pk_test_`)
- [ ] Copy **Secret key** (starts with `sk_test_`)

#### Set Up Webhook:
- [ ] Go to https://dashboard.stripe.com/test/webhooks
- [ ] Click "Add endpoint"
- [ ] URL: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook`
- [ ] Select events:
  - [ ] `checkout.session.completed`
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `charge.refunded`
  - [ ] `charge.dispute.created`
  - [ ] `charge.dispute.closed`
- [ ] Click "Add endpoint"
- [ ] Copy **Signing secret** (starts with `whsec_`)

### 6. Set Edge Function Secrets (3 min)

- [ ] In Supabase Dashboard, go to Edge Functions → Manage secrets
- [ ] Add secret: `STRIPE_SECRET_KEY` = `sk_test_...`
- [ ] Add secret: `STRIPE_WEBHOOK_SECRET` = `whsec_...`
- [ ] (Optional) Add secret: `RESEND_API_KEY` = `re_...` (for emails)

### 7. Update Local Environment (2 min)

- [ ] Open `.env` file in your project
- [ ] Update `VITE_SUPABASE_URL` with your new project URL
- [ ] Update `VITE_SUPABASE_PUBLISHABLE_KEY` with your new anon key
- [ ] Add `VITE_STRIPE_PUBLISHABLE_KEY` with your Stripe publishable key
- [ ] Save the file

### 8. Test Locally (5 min)

- [ ] Stop dev server if running (Ctrl+C)
- [ ] Start dev server: `npm run dev`
- [ ] Open http://localhost:8080
- [ ] Test sign up / login
- [ ] Test browsing tutors
- [ ] Test booking a session
- [ ] Test payment with card: `4242 4242 4242 4242`

### 9. Verify Everything Works

- [ ] ✅ Authentication (sign up/login)
- [ ] ✅ Database queries (view tutors, sessions)
- [ ] ✅ Edge Functions (payment processing)
- [ ] ✅ Stripe webhook (check Stripe dashboard logs)
- [ ] ✅ No console errors

### 10. Clean Up Lovable (After Everything Works!)

- [ ] Confirm new setup works for 24-48 hours
- [ ] Export any remaining data from Lovable
- [ ] Cancel Lovable subscription
- [ ] Delete Lovable project

---

## 🐛 Troubleshooting

### "Invalid API key" error
- Double-check `.env` file has correct values
- Restart dev server after changing `.env`
- Verify no extra spaces in keys

### Payment fails
- Check Edge Function logs in Supabase Dashboard
- Verify `STRIPE_SECRET_KEY` is set in Edge Function secrets
- Test webhook in Stripe Dashboard

### Database connection error
- Verify Supabase project is active (not paused)
- Check URL format: `https://xxxxx.supabase.co` (no trailing slash)
- Verify anon key is correct

### Edge Function deployment fails
- Check for syntax errors in code
- Verify all imports are correct
- Check function logs in Supabase Dashboard

---

## 📊 Cost Comparison

| Service | Lovable | Your Setup |
|---------|---------|------------|
| Supabase | Included | $0 (Free tier) |
| Hosting | Included | $0 (Vercel/Netlify free) |
| Stripe | Included | 2.9% + 30¢ per transaction |
| **Total** | **$20-50/month** | **$0/month** + transaction fees |

---

## 🎉 Success!

Once all checkboxes are complete, you've successfully migrated from Lovable to your own infrastructure!

You now have:
- ✅ Full control over your database
- ✅ Direct Stripe integration
- ✅ No monthly platform fees
- ✅ Ability to scale as needed
- ✅ Complete code ownership

---

## 📚 Helpful Links

- Supabase Dashboard: https://supabase.com/dashboard
- Supabase Docs: https://supabase.com/docs
- Stripe Dashboard: https://dashboard.stripe.com
- Stripe Test Cards: https://stripe.com/docs/testing
- Your Project: http://localhost:8080

---

## Need Help?

1. Check Supabase logs: Dashboard → Logs & Analytics
2. Check Stripe logs: Dashboard → Developers → Webhooks
3. Check browser console: F12 → Console tab
4. Check Edge Function logs: Supabase → Edge Functions → Select function → Logs
