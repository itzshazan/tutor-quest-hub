

## Student & Tutor Dashboards

### Overview
Create two role-based dashboard pages that serve as the central hub for each user type after login, consolidating access to sessions, messages, profile management, and key stats.

### What We'll Build

**1. Student Dashboard (`/dashboard/student`)**
- **Stats cards**: Total sessions booked, upcoming sessions count, tutors connected with, reviews given
- **Upcoming Sessions**: Next 3-5 sessions with tutor name, subject, date/time, status, and quick action links
- **Recent Messages**: Last 3 conversations with preview text and link to full messaging
- **Saved/Connected Tutors**: List of tutors the student has interacted with (via sessions or messages), with links to profiles
- **Quick Actions**: Find Tutors, View All Sessions, Messages buttons

**2. Tutor Dashboard (`/dashboard/tutor`)**
- **Stats cards**: Total students, sessions completed, average rating, total reviews
- **Pending Requests**: Session requests needing accept/decline with inline actions
- **Upcoming Sessions**: Next confirmed sessions
- **Recent Reviews**: Latest reviews with ratings
- **Profile Completeness**: Visual indicator if profile fields are missing
- **Quick Actions**: Edit Profile, View All Sessions, Messages buttons

**3. Sidebar Layout**
- Use the existing Shadcn Sidebar component for dashboard pages
- Create an `AppSidebar` with role-aware navigation links
- Create a `DashboardLayout` wrapper that provides the sidebar context
- Sidebar items: Dashboard (home), Sessions, Messages, Find Tutors (student) / My Profile (tutor), Settings

**4. Routing & Auth**
- Add `/dashboard/student` and `/dashboard/tutor` routes
- After login, redirect users to their role-specific dashboard instead of `/`
- Protect dashboard routes: redirect unauthenticated users to `/login`
- Update Navbar to include "Dashboard" link for logged-in users

### Technical Details

**Database**: No new tables needed. All data comes from existing `sessions`, `conversations`, `messages`, `reviews`, `profiles`, and `tutor_profiles` tables.

**Queries for Student Dashboard**:
- Sessions: `sessions` where `student_id = user.id`, ordered by `session_date`
- Connected tutors: Distinct `tutor_id` from `sessions` + `conversations`, join `profiles`
- Reviews given: `reviews` where `student_id = user.id`

**Queries for Tutor Dashboard**:
- Pending: `sessions` where `tutor_id = user.id` and `status = 'pending'`
- Stats: Count from `sessions`, rating/reviews from `tutor_profiles`
- Recent reviews: `reviews` where `tutor_id = user.id`, ordered by `created_at desc`

**Files to create**:
- `src/components/dashboard/AppSidebar.tsx` - Role-aware sidebar
- `src/components/dashboard/DashboardLayout.tsx` - Layout wrapper with SidebarProvider
- `src/pages/dashboard/StudentDashboard.tsx` - Student dashboard page
- `src/pages/dashboard/TutorDashboard.tsx` - Tutor dashboard page

**Files to modify**:
- `src/App.tsx` - Add dashboard routes
- `src/pages/Login.tsx` - Redirect to dashboard after login
- `src/components/landing/Navbar.tsx` - Add Dashboard link for authenticated users

