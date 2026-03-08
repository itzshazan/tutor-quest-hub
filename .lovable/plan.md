

## Plan: Address Functional Gaps (All 4 Priorities)

This plan covers all four requested features in a phased approach.

---

### Phase 1: Tutor Availability Validation (Booking Cross-Check)

**Problem:** The booking form allows any time selection without checking if the tutor is available on that day/time per their `tutor_availability` schedule.

**Solution:**
1. In `src/pages/Sessions.tsx`, fetch the tutor's `tutor_availability` when booking
2. Filter `TIME_OPTIONS` to only show slots that match the tutor's schedule for the selected day
3. Validate on submit that the selected time falls within an availability window

**Changes:**
- `src/pages/Sessions.tsx` - Load `tutor_availability` for `tutorIdParam`, filter time dropdowns based on day of week

---

### Phase 2: In-App Notifications System

**Database:**
- Create `notifications` table with: `id`, `user_id`, `title`, `message`, `type`, `read_at`, `created_at`, `link`
- Enable realtime for notifications table
- RLS: users can read/update own notifications

**Frontend:**
- Create `src/components/NotificationBell.tsx` - bell icon with unread count badge
- Create `src/components/NotificationDropdown.tsx` - dropdown listing recent notifications
- Create `src/hooks/useNotifications.ts` - realtime subscription for user notifications
- Add notification bell to Navbar and dashboard headers

**Triggers:**
- Modify edge functions (`send-session-notification`) to also insert into `notifications` table
- Add notification creation for: session booked/confirmed/cancelled, new message, payment captured

---

### Phase 3: Admin Panel Enhancements

**3a. Analytics Dashboard with Charts**
- Install `recharts` (already in dependencies)
- Update `AdminDashboard.tsx`:
  - Add line chart for signups over time (last 30 days)
  - Add pie chart for user role distribution
  - Add bar chart for sessions by status
  - Add revenue stats card (total earnings, commissions)

**3b. User Actions (AdminUsers.tsx)**
- Add "Actions" dropdown per user row:
  - Suspend user (set a `suspended` flag on profiles)
  - Promote to admin (insert into `user_roles` with admin role)
  - Delete user (soft delete or remove from auth)
- Add confirmation dialogs for destructive actions

**Database:**
- Add `suspended_at` column to `profiles` table

**3c. Bulk Operations (AdminTutors.tsx)**
- Add checkbox selection for verification documents
- Add "Bulk Approve" / "Bulk Reject" buttons
- Implement batch update function

**3d. Revenue Dashboard**
- Create `src/pages/admin/AdminRevenue.tsx`
- Show: total revenue, platform commissions, tutor earnings
- Add date range filter
- Add revenue trend chart

**3e. Export Functionality**
- Add CSV export for users, sessions, payments tables
- Create utility function `exportToCSV(data, filename)`

---

### Phase 4: OAuth/Social Login (Google)

**Approach:** Use Lovable Cloud's managed Google OAuth (no external credentials needed).

**Steps:**
1. Call Configure Social Login tool to generate `src/integrations/lovable` module
2. Update `Login.tsx` - add "Sign in with Google" button using `lovable.auth.signInWithOAuth("google")`
3. Update `SignUp.tsx` - add "Sign up with Google" button
4. Handle OAuth callback in `App.tsx` (already handled by Lovable Cloud)

---

### Summary of File Changes

| File | Change |
|------|--------|
| `src/pages/Sessions.tsx` | Add availability validation |
| `src/components/NotificationBell.tsx` | New - bell icon component |
| `src/components/NotificationDropdown.tsx` | New - notification list |
| `src/hooks/useNotifications.ts` | New - realtime hook |
| `src/components/landing/Navbar.tsx` | Add notification bell |
| `src/pages/admin/AdminDashboard.tsx` | Add charts and revenue stats |
| `src/pages/admin/AdminUsers.tsx` | Add user actions dropdown |
| `src/pages/admin/AdminTutors.tsx` | Add bulk operations |
| `src/pages/admin/AdminRevenue.tsx` | New - revenue dashboard |
| `src/lib/exportUtils.ts` | New - CSV export utility |
| `src/pages/Login.tsx` | Add Google sign-in button |
| `src/pages/SignUp.tsx` | Add Google sign-up button |
| **Database migration** | Add `notifications` table, `suspended_at` column |

---

### Recommended Implementation Order

1. **Tutor Availability Validation** - Quick win, prevents invalid bookings
2. **Notifications Table + Bell UI** - Foundation for all alerts
3. **Admin Charts & Revenue** - Visual analytics
4. **Admin User Actions & Bulk Ops** - Administrative control
5. **Google OAuth** - Last (requires tool call for Lovable module)

