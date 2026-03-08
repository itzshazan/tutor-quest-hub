

## Plan: Fix Critical Security and Data Integrity Gaps

### Issues to Address

1. **No Route-Level Auth Guards** - Pages render briefly before redirect
2. **No Session Time Conflict Checking** - Double-booking possible
3. **No Password Reset Flow** - Users can't recover accounts
4. **Missing Payment Flow Connection** - Payment UI exists but needs clearer integration

---

### 1. Route-Level Auth Guards

**Current state:** Each page does its own auth check in `useEffect`, causing a brief render before redirect.

**Solution:** Create wrapper components that block rendering until auth is verified.

**Files to create/modify:**
- Create `src/components/guards/ProtectedRoute.tsx` - General auth guard
- Create `src/components/guards/RoleGuard.tsx` - Role-specific guard (student/tutor/admin)
- Update `src/App.tsx` - Wrap protected routes

```text
Route Protection Architecture:
┌─────────────────────────────────────────────────────┐
│  <ProtectedRoute>                                   │
│    - Shows spinner while loading                    │
│    - Redirects to /login if not authenticated       │
│    - Renders children only when auth confirmed      │
└─────────────────────────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
   <RoleGuard       <RoleGuard      <RoleGuard
    role="student">  role="tutor">   role="admin">
```

**Protected routes:**
- `/dashboard/student` → requires auth + student role
- `/dashboard/tutor` → requires auth + tutor role  
- `/admin/*` → requires auth + admin role (via `has_role` RPC)
- `/sessions`, `/messages`, `/payments`, `/tutor/setup` → requires auth (any role)

---

### 2. Session Time Conflict Checking

**Current state:** `handleBook()` inserts directly without checking for overlaps.

**Solution:** Add validation before booking.

**Approach:**
- Before insert, query `sessions` table for the same tutor on the same date with overlapping times
- Check for `status IN ('pending', 'confirmed')` to exclude cancelled/completed
- Show error toast if conflict found

**Time overlap logic:**
```
Conflict exists when:
  existing.start_time < new.end_time AND existing.end_time > new.start_time
```

**Files to modify:**
- `src/pages/Sessions.tsx` - Add conflict check in `handleBook()`

---

### 3. Password Reset Flow

**Current state:** No forgot password link or reset page exists.

**Solution:** Create two components per Supabase auth pattern.

**Files to create:**
- `src/pages/ForgotPassword.tsx` - Email input form
  - Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`
  - Shows success message after submission

- `src/pages/ResetPassword.tsx` - New password form
  - Checks URL for `type=recovery` hash parameter
  - Calls `supabase.auth.updateUser({ password })`
  - Redirects to login on success

**Files to modify:**
- `src/App.tsx` - Add `/forgot-password` and `/reset-password` routes
- `src/pages/Login.tsx` - Add "Forgot password?" link

---

### 4. Payment Flow Verification

**Current state:** The payment trigger (`handlePay`) already exists in `SessionCard` (line 412-426). The `needsPayment` flag (line 444) correctly shows the Pay button for confirmed sessions without payment.

**Verification needed:** The code appears complete. The "Pay Now" button calls `create-session-payment` edge function which returns a Stripe Checkout URL.

**Minor improvement:**
- Add visual feedback that payment is required after tutor confirms session
- Consider auto-prompting payment after session confirmation

---

### Technical Details

**ProtectedRoute implementation:**
```typescript
// Renders children only after auth check completes
// Shows loading spinner during auth check
// Redirects to /login if unauthenticated
```

**RoleGuard implementation:**
```typescript  
// For admin: uses has_role RPC (server-side check)
// For student/tutor: checks user_metadata.role
// Redirects to appropriate page if wrong role
```

**Conflict check SQL concept:**
```sql
SELECT 1 FROM sessions
WHERE tutor_id = $tutor
  AND session_date = $date
  AND status IN ('pending', 'confirmed')
  AND start_time < $end_time
  AND end_time > $start_time
```

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/guards/ProtectedRoute.tsx` | New - Auth wrapper |
| `src/components/guards/RoleGuard.tsx` | New - Role-based wrapper |
| `src/pages/ForgotPassword.tsx` | New - Password reset request |
| `src/pages/ResetPassword.tsx` | New - Set new password |
| `src/App.tsx` | Add route guards + new routes |
| `src/pages/Login.tsx` | Add forgot password link |
| `src/pages/Sessions.tsx` | Add conflict validation |

