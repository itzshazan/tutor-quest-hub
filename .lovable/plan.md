

## Plan: Fix Location-Based Tutor Search

### Problem
1. Location search uses `ilike` text matching — "Delhi" won't match "Lajpat Nagar, Delhi" when searching "South Delhi"
2. Tutor coordinates only captured via browser GPS (unreliable), stored on `profiles` not `tutor_profiles`
3. No radius filtering or distance display

### Implementation Steps

#### 1. Database Migration
Add columns to `tutor_profiles`:
- `latitude NUMERIC` — geocoded lat
- `longitude NUMERIC` — geocoded lng  
- `city TEXT` — normalized city name for fallback text matching

#### 2. Store Google Maps API Key
Use the secrets tool to request `GOOGLE_MAPS_API_KEY` from the user.

#### 3. Edge Function: `geocode-location`
- Accepts `{ address: string }`, calls Google Maps Geocoding API
- Returns `{ lat, lng, city, formatted_address }`
- Used by both tutor setup and student search

#### 4. Update TutorSetup.tsx
- After saving the profile, call `geocode-location` with the tutor's typed location
- Store returned `latitude`, `longitude`, `city` on `tutor_profiles`
- Remove reliance on browser geolocation for tutor teaching coordinates

#### 5. Update FindTutors.tsx
- **Add radius filter**: 5 km / 10 km / 20 km / 50 km / Any
- When location is typed, geocode it via edge function to get search coordinates
- **Primary filter**: Haversine distance within selected radius (client-side, on fetched results)
- **Fallback**: `ilike` on `city` or `location` for tutors without coordinates
- **Ranking**: Distance → rating → experience
- Show "2.3 km away" on each tutor card
- Add list/map view toggle

#### 6. Map View Component
- New `src/components/TutorMapView.tsx`
- Simple embedded Google Map showing tutor pins with name/subject popover
- Toggle between list and map on FindTutors page

#### 7. Backfill Existing Tutors
- Edge function `backfill-tutor-locations` that admins can trigger
- Loops through tutors with a `location` but no `latitude`, geocodes each, updates the row

### File Changes Summary
| File | Change |
|------|--------|
| Migration SQL | Add `latitude`, `longitude`, `city` to `tutor_profiles` |
| `supabase/functions/geocode-location/index.ts` | New edge function |
| `supabase/functions/backfill-tutor-locations/index.ts` | New edge function |
| `supabase/config.toml` | Add `verify_jwt = false` for new functions |
| `src/pages/TutorSetup.tsx` | Call geocode on save, store coords on `tutor_profiles` |
| `src/pages/FindTutors.tsx` | Geocode search input, radius filter, distance display, map toggle, ranking |
| `src/components/TutorMapView.tsx` | New map view component |

