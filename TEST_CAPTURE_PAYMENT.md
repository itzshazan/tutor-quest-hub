# 🧪 Test Capture Payment

## Current Status

✅ `capture-payment` function is deployed (26 minutes ago)
✅ CORS preflight (OPTIONS) requests are working (status 200)
❓ Need to test actual POST request

---

## Quick Test Steps

### Step 1: Clear Browser Cache

1. Open your app: http://localhost:8080
2. Press **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
3. This does a hard refresh and clears cached errors

### Step 2: Open Browser DevTools

1. Press **F12**
2. Go to **Console** tab
3. Clear console (click 🚫 icon)

### Step 3: Go to Network Tab

1. Click **Network** tab in DevTools
2. Make sure "Preserve log" is checked
3. Clear network log (click 🚫 icon)

### Step 4: Try Capture Payment

1. Log in as tutor
2. Go to Sessions page
3. Find session with "Payment held"
4. Click **"Complete & Release Payment"**
5. Watch the Network tab

### Step 5: Check Network Request

Look for request to `capture-payment`:
- **Status 200** = Success! ✅
- **Status 500** = Server error (check Logs tab in Supabase)
- **Status 401** = Not authenticated (log out and log back in)
- **Failed** or **CORS error** = Need to redeploy function

---

## Expected Behavior

### Success Flow:
1. Click "Complete & Release Payment"
2. Network shows POST to `capture-payment` with status 200
3. Toast notification: "Session completed!"
4. Badge changes from "Payment held" to "completed"
5. Tutor earnings show: "Earned: ₹X"

### If It Fails:

#### Error: "Failed to send request"
**Solution:** Hard refresh (Ctrl+Shift+R)

#### Error: "User not authenticated"
**Solution:** Log out and log back in

#### Error: "No pending payment found"
**Solution:** Payment might already be captured. Check Stripe Dashboard

#### Error: "Payment authorization not ready"
**Solution:** Wait a few seconds and try again

---

## Debug: Check Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/payments
2. Find your payment
3. Check status:
   - **Uncaptured** = Ready to capture ✅
   - **Succeeded** = Already captured ✅
   - **Requires payment method** = Payment failed ❌

---

## Debug: Check Supabase Logs

1. Go to: https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci/functions/capture-payment/logs
2. Look for recent POST requests
3. Check for errors

---

## Debug: Check Database

Run this in Supabase SQL Editor:

```sql
-- Check payment status
SELECT 
  p.id,
  p.payment_status,
  p.stripe_payment_intent_id,
  p.amount,
  p.tutor_earnings,
  s.status as session_status
FROM payments p
JOIN sessions s ON s.id = p.session_id
WHERE p.payment_status = 'pending'
ORDER BY p.created_at DESC
LIMIT 5;
```

Should show:
- `payment_status`: "pending"
- `stripe_payment_intent_id`: Should have a value (not null)
- `session_status`: "confirmed"

---

## Manual Test via Console

If button doesn't work, test directly in browser console:

```javascript
// Test capture payment
const { data, error } = await supabase.functions.invoke("capture-payment", {
  body: { session_id: "YOUR_SESSION_ID_HERE" }
});

console.log("Result:", data);
console.log("Error:", error);
```

Replace `YOUR_SESSION_ID_HERE` with actual session ID.

---

## Common Issues

### Issue 1: "Failed to send request"
**Cause:** Cached error from before deployment
**Solution:** Hard refresh (Ctrl+Shift+R)

### Issue 2: Function returns 401
**Cause:** Not logged in or session expired
**Solution:** Log out and log back in

### Issue 3: "No pending payment found"
**Cause:** Payment already captured or doesn't exist
**Solution:** Check database and Stripe Dashboard

### Issue 4: "Payment authorization not ready"
**Cause:** Stripe checkout not completed yet
**Solution:** Complete payment first, then try capture

---

## Success Checklist

After successful capture:

- [ ] Network request shows status 200
- [ ] Toast shows "Session completed!"
- [ ] Badge changes to "completed"
- [ ] Tutor earnings displayed
- [ ] Session status = "completed" in database
- [ ] Payment status = "completed" in database
- [ ] Stripe shows payment as "Succeeded"

---

## Next Steps After Success

1. ✅ Test refund functionality (optional)
2. ✅ Test webhook (complete payment in Stripe)
3. ✅ Test full flow end-to-end
4. ✅ Deploy to production

---

## If Still Not Working

1. **Check Supabase function logs** for actual error
2. **Check browser console** for JavaScript errors
3. **Check Network tab** for request details
4. **Try manual test** via console (see above)
5. **Check Stripe Dashboard** for payment status

The function is deployed and CORS is working, so it should work after a hard refresh!
