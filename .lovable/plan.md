

## PRD Coverage Analysis

Almost everything in the PRD is already implemented. The one missing core feature is:

**Saved Tutors List** (PRD Section 11 - Core Platform Features)

Students should be able to save/bookmark tutors they're interested in for easy access later.

---

## Plan: Saved Tutors Feature

### 1. Database Migration

Create a `saved_tutors` table:
- `id` (uuid, PK)
- `student_id` (uuid, NOT NULL) -- references the student
- `tutor_id` (uuid, NOT NULL) -- references the tutor
- `created_at` (timestamptz)
- Unique constraint on `(student_id, tutor_id)`

RLS policies:
- Students can SELECT, INSERT, DELETE their own saved tutors
- No public access

### 2. UI Changes

**Find Tutors page (`FindTutors.tsx`)**
- Add a heart/bookmark icon on each tutor card
- Toggling saves/unsaves the tutor
- Only visible to authenticated students

**Tutor Profile page (`TutorProfile.tsx`)**
- Add a "Save Tutor" button next to the Contact button
- Toggle state based on whether already saved

**Student Dashboard (`StudentDashboard.tsx`)**
- Add a "Saved Tutors" section showing bookmarked tutors with quick links to their profiles

### 3. Data Fetching

- Query `saved_tutors` for the current user to determine which tutors are saved
- Use React state to toggle optimistically on click
- Insert/delete from `saved_tutors` table on toggle

### Technical Notes
- No new pages needed; integrates into existing pages
- Requires authentication check before showing save buttons

