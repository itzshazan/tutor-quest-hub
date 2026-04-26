# 🚀 Deploy All Edge Functions

## The Problem

You need to deploy these Edge Functions to Supabase:
1. ✅ `create-session-payment` (already deployed)
2. ❌ `capture-payment` (needs deployment)
3. ❌ `refund-payment` (needs deployment)
4. ❌ `stripe-webhook` (needs deployment)
5. ✅ `send-session-notification` (probably already deployed)

---

## Quick Deploy (Supabase Dashboard)

### Step 1: Go to Edge Functions

Open: https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci/functions

### Step 2: Deploy `capture-payment`

1. Click **"Create a new function"** or find existing `capture-payment`
2. Name: `capture-payment`
3. Copy **ALL** code from: `supabase/functions/capture-payment/index.ts`
4. Paste in editor
5. Click **"Deploy"**
6. Wait 30 seconds

### Step 3: Deploy `refund-payment`

1. Click **"Create a new function"**
2. Name: `refund-payment`
3. Copy **ALL** code from: `supabase/functions/refund-payment/index.ts`
4. Paste in editor
5. Click **"Deploy"**
6. Wait 30 seconds

### Step 4: Deploy `stripe-webhook`

1. Click **"Create a new function"**
2. Name: `stripe-webhook`
3. Copy **ALL** code from: `supabase/functions/stripe-webhook/index.ts`
4. Paste in editor
5. Click **"Deploy"**
6. Wait 30 seconds

---

## Verify Deployment

After deploying, test each function:

### Test capture-payment:
```
https://aiuufmhfmjubvkedwhci.supabase.co/functions/v1/capture-payment
```
Should see: "User not authenticated" (good!)

### Test refund-payment:
```
https://aiuufmhfmjubvkedwhci.supabase.co/functions/v1/refund-payment
```
Should see: "User not authenticated" (good!)

### Test stripe-webhook:
```
https://aiuufmhfmjubvkedwhci.supabase.co/functions/v1/stripe-webhook
```
Should see: "Missing signature or webhook secret" (good!)

---

## After Deployment

1. **Refresh your app**
2. **Try capturing payment again**
3. Should work! ✅

---

## All Functions Summary

| Function | Purpose | Status |
|----------|---------|--------|
| `create-session-payment` | Create Stripe checkout | ✅ Deployed |
| `capture-payment` | Release payment from escrow | ❌ Need to deploy |
| `refund-payment` | Refund a payment | ❌ Need to deploy |
| `stripe-webhook` | Handle Stripe events | ❌ Need to deploy |
| `send-session-notification` | Send notifications | ✅ Probably deployed |

---

## Quick Copy-Paste Guide

### For capture-payment:

1. Open: `supabase/functions/capture-payment/index.ts`
2. Select all (Ctrl+A)
3. Copy (Ctrl+C)
4. Go to Supabase Dashboard → Edge Functions
5. Create function: `capture-payment`
6. Paste (Ctrl+V)
7. Deploy

### For refund-payment:

1. Open: `supabase/functions/refund-payment/index.ts`
2. Select all (Ctrl+A)
3. Copy (Ctrl+C)
4. Go to Supabase Dashboard → Edge Functions
5. Create function: `refund-payment`
6. Paste (Ctrl+V)
7. Deploy

### For stripe-webhook:

1. Open: `supabase/functions/stripe-webhook/index.ts`
2. Select all (Ctrl+A)
3. Copy (Ctrl+C)
4. Go to Supabase Dashboard → Edge Functions
5. Create function: `stripe-webhook`
6. Paste (Ctrl+V)
7. Deploy

---

## Why This is Needed

Your local code is correct, but Supabase Cloud doesn't have the updated functions. Each function needs to be manually deployed through the dashboard.

---

## After All Functions are Deployed

✅ Payment creation works
✅ Payment capture works
✅ Payment refund works
✅ Stripe webhooks work
✅ Complete payment flow! 🎉

---

## Estimated Time

- Deploy capture-payment: 2 minutes
- Deploy refund-payment: 2 minutes
- Deploy stripe-webhook: 2 minutes
- **Total: 6 minutes**

Then your payment system will be fully functional!
