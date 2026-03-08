

## Plan: Production-Readiness Improvements

### 1. React Error Boundary

**Problem:** Component errors crash the entire app.

**Solution:** Create a reusable ErrorBoundary component and wrap route groups.

**Files:**
- Create `src/components/ErrorBoundary.tsx` - class component catching errors, displays friendly fallback UI with "Try Again" button
- Update `src/App.tsx` - wrap `<AnimatedRoutes />` with ErrorBoundary

---

### 2. Loading/Skeleton States

**Problem:** Some pages show blank content during data load.

**Solution:** Add skeleton UI to key pages that currently show spinners or blank states.

**Files to update:**
- `src/pages/dashboard/StudentDashboard.tsx` - skeleton cards while loading
- `src/pages/dashboard/TutorDashboard.tsx` - skeleton cards while loading  
- `src/pages/admin/AdminDashboard.tsx` - skeleton for charts/stats
- `src/pages/Messages.tsx` - skeleton for conversation list

---

### 3. Route-Based Code Splitting

**Problem:** 955KB single bundle loads all pages upfront.

**Solution:** Use `React.lazy()` + `Suspense` for route-level splitting.

**App.tsx changes:**
```tsx
const StudentDashboard = lazy(() => import("./pages/dashboard/StudentDashboard"));
const TutorDashboard = lazy(() => import("./pages/dashboard/TutorDashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
// ... other heavy pages
```

Wrap routes in `<Suspense fallback={<PageLoader />}>`.

**Files:**
- Update `src/App.tsx` - lazy imports for 10+ pages
- Create `src/components/PageLoader.tsx` - simple loading spinner for Suspense fallback

---

### 4. Basic Unit Tests

**Problem:** Only 1 trivial test exists.

**Solution:** Add meaningful tests for core utilities and components.

**New test files:**
- `src/lib/utils.test.ts` - test `cn()` utility
- `src/lib/exportUtils.test.ts` - test CSV export
- `src/components/ui/button.test.tsx` - basic button rendering
- `src/hooks/useNotifications.test.ts` - mock Supabase, test state management

---

### 5. Edge Function Rate Limiting

**Problem:** No abuse prevention on edge functions.

**Solution:** Add simple in-memory rate limiting using request IP or user ID.

**Files to update (add rate limit helper):**
- Create `supabase/functions/_shared/rateLimit.ts` - simple token bucket or fixed-window limiter
- Update `create-session-payment/index.ts` - import and apply limiter
- Update `capture-payment/index.ts` - apply limiter
- Update `refund-payment/index.ts` - apply limiter

**Rate limit approach:**
```ts
// Simple per-user limit: 10 requests/minute
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string, limit = 10, windowMs = 60000): boolean {
  // Return false if over limit
}
```

---

### 6. Offline Detection (Optional Enhancement)

**Problem:** No graceful degradation when network is lost.

**Solution:** Add a simple offline banner component.

**Files:**
- Create `src/components/OfflineBanner.tsx` - listens to `navigator.onLine` events, shows banner when offline
- Update `src/App.tsx` - add OfflineBanner at root level

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/ErrorBoundary.tsx` | New - catches component errors |
| `src/components/PageLoader.tsx` | New - Suspense fallback |
| `src/components/OfflineBanner.tsx` | New - offline detection |
| `src/App.tsx` | Add ErrorBoundary, lazy imports, Suspense, OfflineBanner |
| `src/pages/dashboard/StudentDashboard.tsx` | Add skeleton states |
| `src/pages/dashboard/TutorDashboard.tsx` | Add skeleton states |
| `src/pages/Messages.tsx` | Add skeleton states |
| `src/lib/utils.test.ts` | New - unit tests |
| `src/lib/exportUtils.test.ts` | New - unit tests |
| `src/components/ui/button.test.tsx` | New - component tests |
| `supabase/functions/_shared/rateLimit.ts` | New - rate limit helper |
| `supabase/functions/*/index.ts` | Add rate limiting |

---

### Implementation Priority

1. **Error Boundary** - Prevents crashes
2. **Code Splitting** - Reduces initial bundle
3. **Skeleton States** - Better UX
4. **Rate Limiting** - Security
5. **Unit Tests** - Quality
6. **Offline Banner** - Polish

