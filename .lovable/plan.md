

## Tutor Profile Creation Flow

### What exists today
- Tutor signup creates a minimal `tutor_profiles` row with just `user_id` and `subject` (from the `handle_new_user` trigger)
- The `profiles` table has `full_name`, `bio`, `avatar_url`, `phone`
- The `tutor_profiles` table has `subject`, `subjects[]`, `experience_years`, `hourly_rate`, `location`, `education`, `is_verified`, `rating`, `total_reviews`
- No availability table exists yet
- No storage bucket for profile photos

### What we will build

**1. Database changes**
- Create `tutor_availability` table (`tutor_id`, `day_of_week`, `start_time`, `end_time`) with RLS (public read, owner write)
- Create a public `avatars` storage bucket for profile photo uploads with RLS policies

**2. New page: `/tutor/setup` -- Multi-step profile creation form**

A 4-step wizard that tutors see after signup (or access from nav). Steps:

- **Step 1 -- Basic Info**: Profile photo upload, bio, education, experience years
- **Step 2 -- Teaching Info**: Select subjects (multi-select from `subjects` table), primary subject, hourly rate, teaching method (text)
- **Step 3 -- Location & Availability**: City/location input, day-of-week + time slot availability picker
- **Step 4 -- Review & Submit**: Summary of all entered data with edit buttons, submit to save

Each step updates `profiles` and `tutor_profiles` tables. Avatar uploads go to the `avatars` storage bucket.

**3. Signup flow redirect**
- After tutor signup + login, redirect to `/tutor/setup` if their profile is incomplete (check if `bio` or `hourly_rate` is empty/default)

**4. Navigation updates**
- Add "Complete Profile" link in navbar for logged-in tutors with incomplete profiles
- Add `/tutor/setup` route in `App.tsx`

### File changes
- **New migration**: `tutor_availability` table + `avatars` storage bucket + RLS policies
- **New file**: `src/pages/TutorSetup.tsx` -- multi-step form component
- **Edit**: `src/App.tsx` -- add route
- **Edit**: `src/components/landing/Navbar.tsx` -- add "Complete Profile" link for tutors
- **Edit**: `src/pages/Login.tsx` -- redirect tutors with incomplete profiles to `/tutor/setup`

