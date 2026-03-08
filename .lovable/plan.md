

## Admin Panel Implementation

### Database Changes (1 migration)

1. **Add `'admin'` to `app_role` enum**
2. **Add admin RLS policies** on all tables so admins can SELECT everything, plus UPDATE on `tutor_profiles` (for verification) and DELETE on `reviews` (for moderation)
3. **Update `has_role` function** signature already supports admin since it checks `user_roles` table -- no change needed there

```sql
ALTER TYPE public.app_role ADD VALUE 'admin';

-- Admin SELECT policies on all tables
CREATE POLICY "Admins can view all sessions" ON public.sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all conversations" ON public.conversations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all user_roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update tutor verification
CREATE POLICY "Admins can update tutor_profiles" ON public.tutor_profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete reviews (moderation)
CREATE POLICY "Admins can delete reviews" ON public.reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
```

Note: `profiles`, `tutor_profiles`, `reviews`, and `subjects` already have public SELECT policies, so no additional admin SELECT policies needed for those.

### Files to Create

**`src/components/admin/AdminLayout.tsx`**
- Similar to `DashboardLayout` but checks `has_role(uid, 'admin')` via RPC
- Admin-specific sidebar: Dashboard, Users, Tutors, Sessions, Reviews
- Redirects non-admins to `/login`

**`src/pages/admin/AdminDashboard.tsx`**
- Stats cards: total users, tutors, students, sessions, reviews (counts from respective tables)
- Recent signups list (last 10 profiles)

**`src/pages/admin/AdminUsers.tsx`**
- Table of all profiles with name, role, created date
- Filter by role dropdown

**`src/pages/admin/AdminTutors.tsx`**
- Table of tutor profiles with name, subjects, rate, rating, `is_verified` status
- Toggle verify button per tutor (updates `tutor_profiles.is_verified`)

**`src/pages/admin/AdminSessions.tsx`**
- Table of all sessions with student/tutor names, subject, date, status
- Filter by status

**`src/pages/admin/AdminReviews.tsx`**
- Table of all reviews with rating, text, student/tutor names
- Delete button for moderation

### Files to Modify

**`src/App.tsx`**
- Add admin routes: `/admin`, `/admin/users`, `/admin/tutors`, `/admin/sessions`, `/admin/reviews`

### Admin Access
- Admin role assigned manually via database (insert into `user_roles`)
- No public signup for admin -- accessed directly at `/admin`

