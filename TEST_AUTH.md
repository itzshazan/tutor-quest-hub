# Test Authentication

## Quick Test: Are you logged in?

1. Open your app: http://localhost:8080
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Paste this code and press Enter:

```javascript
// Check if you're logged in
const { data: { session } } = await supabase.auth.getSession();
console.log("Logged in:", !!session);
console.log("User:", session?.user?.email);
console.log("Access token:", session?.access_token?.substring(0, 30) + "...");
```

**Expected output:**
```
Logged in: true
User: your@email.com
Access token: eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

**If you see:**
```
Logged in: false
User: undefined
```

Then you're NOT logged in! You need to log in first before making a payment.

---

## How to Log In

1. Go to: http://localhost:8080/login
2. Enter your credentials
3. Click "Sign In"
4. Go back to Sessions page
5. Try payment again

---

## Test Edge Function with Auth

After confirming you're logged in, test the Edge Function:

```javascript
// Test payment function
const { data, error } = await supabase.functions.invoke("create-session-payment", {
  body: { session_id: "YOUR_SESSION_ID_HERE" }
});

console.log("Response:", data);
console.log("Error:", error);
```

Replace `YOUR_SESSION_ID_HERE` with an actual session ID from your Sessions page.

---

## Common Issues

### Issue 1: Not Logged In
**Symptom:** "UNAUTHORIZED_NO_AUTH_HEADER"
**Solution:** Log in at /login

### Issue 2: Session Expired
**Symptom:** "UNAUTHORIZED_NO_AUTH_HEADER" even when logged in
**Solution:** Log out and log back in

### Issue 3: Wrong Supabase URL
**Symptom:** Function not found or CORS error
**Solution:** Check `.env` has correct `VITE_SUPABASE_URL`

---

## Debug Steps

1. **Check localStorage:**
   - Open DevTools → Application tab → Local Storage
   - Look for keys starting with `sb-aiuufmhfmjubvkedwhci-auth-token`
   - Should have a value (your session)

2. **Check Network tab:**
   - Open DevTools → Network tab
   - Try payment
   - Look for request to `create-session-payment`
   - Click on it
   - Check **Headers** section
   - Should see `Authorization: Bearer eyJ...`

3. **If Authorization header is missing:**
   - You're not logged in
   - Or session expired
   - Log out and log back in

---

## Quick Fix

If you're getting "UNAUTHORIZED_NO_AUTH_HEADER":

1. **Log out:**
   - Click your profile → Sign Out

2. **Clear browser data:**
   - DevTools → Application → Local Storage
   - Right-click → Clear

3. **Log back in:**
   - Go to /login
   - Enter credentials
   - Sign in

4. **Try payment again**

This should fix the auth issue!
