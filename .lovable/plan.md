

# Full System Audit Plan

## Audit Summary

After reviewing all pages, components, backend functions, database schema, and auth flows, here are the issues found and the fixes planned.

---

## 1. Page Functionality Issues

### Missing Payment History in Sidebar/Navigation
- `AppSidebar` has no link to `/payments` for either role. Students and tutors can't navigate to their payment history without knowing the URL.
- **Fix**: Add "Payments" nav item to both student and tutor sidebar menus.

### FindTutors shows empty results (only verified tutors)
- The query filters `is_verified = true`, but no tutors are verified yet (network response is `[]`). This is by design but means new users see an empty page with no explanation.
- **Fix**: Add an empty state message explaining no verified tutors are available yet, rather than showing a blank page.

### Sessions/Messages/PaymentHistory lack back navigation consistency
- Sessions page has a back arrow, Messages page has a back arrow, but PaymentHistory back button navigates to `/` instead of the user's dashboard.
- **Fix**: Make PaymentHistory back button navigate to role-appropriate dashboard.

### Login redirect doesn't handle student role with no metadata
- If `user_metadata.role` is undefined, login defaults to `/dashboard/student`. This is acceptable but should be explicit.

---

## 2. Frontend Consistency Issues

### Design system mismatch between landing pages and app pages
- Landing pages use the new Navy/Gold design system with Inter font, proper spacing, and rounded corners.
- Auth pages (Login, SignUp), dashboard pages, Sessions, Messages, FindTutors, TutorProfile, PaymentHistory, and admin pages still use the old design tokens and styling.
- **Fix**: Update Login, SignUp pages to use the new design system colors and typography. Update dashboard, sessions, messages, and admin pages for consistency (card radius, button styles, color tokens).

### Inconsistent page headers
- Some pages use `<Link to="/">` with brand logo, others use `navigate(-1)`, others use `navigate("/")`.
- **Fix**: Standardize page headers: app pages inside `DashboardLayout` don't need separate headers. Standalone pages (Sessions, Messages, FindTutors, PaymentHistory) should have consistent back navigation.

---

## 3. Backend Integration Issues

### Edge function notification calls missing error handling
- In `Sessions.tsx`, the notification fetch calls use `.then()` without `.catch()`. If the edge function fails, there's no feedback.
- **Fix**: Add error handling for notification calls (silent failures are fine, but log them).

### Payment edge functions use hardcoded API version
- Using `apiVersion: "2025-08-27.basil"` — this is correct per documentation.

### SignUp saves profile data with a `setTimeout(2000)`
- The signup flow uses a 2-second timeout to update profile data, which is fragile — the profile row may not exist yet if the trigger hasn't fired.
- **Fix**: Replace `setTimeout` with a retry/polling mechanism or move this logic to the `handle_new_user` trigger.

---

## 4. Authentication & Authorization Issues

### No auth guard on FindTutors, TutorProfile pages
- These are public pages (correct — anyone can browse tutors). No issue.

### No auth guard on Sessions, Messages, PaymentHistory as standalone pages
- Sessions and Messages check auth and redirect. PaymentHistory should do the same.
- **Fix**: Verify PaymentHistory has an auth guard (it uses `useAuth` but may not redirect).

### Admin layout properly checks role via RPC
- This is correctly implemented with `has_role` security definer function. No issue.

---

## 5. Database Consistency Issues

### RLS policies use RESTRICTIVE (Permissive: No)
- All policies are `RESTRICTIVE`. This means ALL policies for a command must pass. With multiple SELECT policies on `conversations`, `messages`, `sessions`, `payments` (user + admin), a user query needs BOTH the user policy AND admin policy to pass — which means **regular users can't read their own data**.
- **Fix**: This is the most critical issue. Convert user-facing RLS policies to PERMISSIVE (the default) so that ANY matching policy grants access. Keep admin policies as permissive too (OR logic).

### This likely explains why the tutor list returns empty
- The `tutor_profiles` SELECT policy is also restrictive with `USING (true)` — this one should work since it always passes. But worth verifying.

---

## 6. Data Flow Issues

### Conversation creation race condition
- When initiating a message to a tutor, the code checks for existing conversations then creates one. No upsert or unique constraint visible — could create duplicates.
- **Fix**: Add a unique constraint on `(student_id, tutor_id)` for conversations table, or use upsert.

---

## 7. Error Handling Gaps

### Missing loading/error states on some pages
- TutorProfile shows a skeleton loader but no "not found" UI beyond `setNotFound`.
- **Fix**: Ensure all pages show proper empty states and error messages.

---

## 8. Performance Issues

### Multiple sequential queries instead of joins
- Dashboard pages make 5-6 sequential queries. Could be optimized with joins or parallel `Promise.all`.
- **Fix**: Where queries are independent, wrap in `Promise.all` (TutorDashboard already partially does this).

---

## Implementation Plan (Priority Order)

### Critical (breaks functionality)
1. **Fix RLS policies** — Convert all RESTRICTIVE policies to PERMISSIVE so users can actually read their own data. This is a database migration.

### High Priority
2. **Add Payments link to sidebar** — Both student and tutor menus.
3. **Fix SignUp setTimeout fragility** — Move profile updates to be more reliable.
4. **Add auth guard to PaymentHistory** — Redirect unauthenticated users.
5. **Add empty state for FindTutors** — When no verified tutors exist.

### Medium Priority  
6. **Update Login/SignUp pages** — Apply Navy/Gold design system.
7. **Standardize back navigation** — Consistent behavior across all standalone pages.
8. **Add conversations unique constraint** — Prevent duplicate conversations.

### Low Priority
9. **Optimize dashboard queries** — Use `Promise.all` for independent queries.
10. **Add error handling to notification calls** — Silent catch for edge function failures.

---

## Technical Details

### RLS Policy Fix (Migration SQL)
The restrictive policies need to be dropped and recreated as permissive. This affects tables: `conversations`, `messages`, `sessions`, `payments`, `saved_tutors`, `tutor_availability`, `tutor_profiles`, `profiles`, `reviews`, `subjects`, `tutor_verifications`, `tutor_reports`, `user_roles`.

### Files to Edit
- `supabase/migrations/` — New migration for RLS fixes
- `src/components/dashboard/AppSidebar.tsx` — Add payments link
- `src/pages/Login.tsx` — Design system update
- `src/pages/SignUp.tsx` — Design system update + fix setTimeout
- `src/pages/PaymentHistory.tsx` — Add auth guard
- `src/pages/FindTutors.tsx` — Add empty state
- `src/pages/Sessions.tsx` — Notification error handling
- `src/pages/Messages.tsx` — Navigation consistency

