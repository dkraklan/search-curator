---
slug: chores-batch-review
created: 2026-05-25
summary: Retroactive review of 14 initial chores — full curator React SPA scaffold
reviewers:
  - correctness (default model)
  - tests (default model)
  - simplicity (default model)
findings_count: 16
severity_breakdown:
  critical: 3
  important: 9
  minor: 4
missing_reviewers: []
---

# Review of Initial Curator Scaffold (14 chores)

## Critical

### 1. NavLink uses native `<a>` causing full page reloads and auth state loss
- **File:** `src/components/Layout.tsx`
- **Line:** 37–52
- **Flagged by:** 3/3 reviewers
- **Issue:** `NavLink` renders a native `<a href={href}>` element. Clicking it triggers a full browser navigation, destroying React state and re-mounting the entire app. This wipes in-memory Basic Auth credentials on every nav click since `AuthGate` state is lost.
- ✅ **Fixed:** Replaced `<a>` with `react-router-dom`'s `<Link>`; renamed component to `TopNavLink`.

### 2. AuthGate accepts any non-empty credentials without server validation
- **File:** `src/components/AuthGate.tsx`
- **Line:** 18–26
- **Flagged by:** 2/3 reviewers
- **Issue:** The form immediately sets `authed = true` after both fields are non-empty, without verifying credentials against the backend. A reviewer with a typo will see the full UI, and every subsequent API call will 401. There is no automatic logout or retry path.
- ✅ **Fixed:** Made `handle` async; pings `GET /internal/queue?limit=0` before setting `authed = true`; calls `clearAuth()` on 401.

### 3. Zero test coverage — no test framework, no test files
- **File:** `package.json` (scripts, devDependencies)
- **Line:** 7–27
- **Flagged by:** 1/3 reviewers
- **Issue:** There are no `.test.` or `.spec.` files, no `__tests__` directories, and no test runner (Vitest, Jest, or Playwright) in `devDependencies`. A reviewer UI that submits labels affecting production HVS calibration should have at minimum unit tests for API client edge cases and component interaction tests for the label-submission flow.
- **Recommendation:** Add Vitest (aligned with Vite) and `@testing-library/react`. Write tests for `apiFetch` error paths, `ReviewQueue` keyboard shortcuts, and `DomainReview` sorting logic.

## Important

### 4. `pageIndex` not reset when queue filters change
- **File:** `src/views/ReviewQueue.tsx`
- **Line:** 28, 42–48
- **Flagged by:** 3/3 reviewers
- **Issue:** `pageIndex` is retained when `minHvs`, `maxHvs`, or `unlabeledOnly` change. If the user is on index 10 and the new filter returns only 5 pages, `pages?.[pageIndex]` becomes `undefined`, causing the view to incorrectly display "No pages in queue."
- ✅ **Fixed:** Added `useEffect` resetting `pageIndex` to 0 on filter changes.

### 5. Domain sort comparator is type-unsafe and produces incorrect ordering
- **File:** `src/views/DomainReview.tsx`
- **Line:** 28–36
- **Flagged by:** 3/3 reviewers
- **Issue:** The sort comparator uses `a[sort.key] ?? ''`, coalescing `null` `hvs_avg` values to the empty string. JavaScript's `<` and `>` operators then perform lexicographic comparison when mixing strings and numbers. For example, `10.1` sorts before `5.2`.
- ✅ **Fixed:** Added `compareValues()` helper with type-aware sorting (`null` last, numeric for numbers, `localeCompare` for strings).

### 6. Keyboard shortcuts trigger on modifier-key combinations
- **File:** `src/views/ReviewQueue.tsx`
- **Line:** 71–82
- **Flagged by:** 3/3 reviewers
- **Issue:** The `keydown` handler does not check `e.ctrlKey`, `e.metaKey`, `e.altKey`, or `e.shiftKey`. Browser shortcuts like `Ctrl+1` (tab switching) or `Cmd+2` will incorrectly select a label.
- ✅ **Fixed:** Added early-return guard for `ctrlKey||metaKey||altKey||shiftKey`.

### 7. No React error boundary
- **File:** `src/main.tsx`
- **Line:** 12–18
- **Flagged by:** 3/3 reviewers
- **Issue:** Any unhandled runtime error in a child component unmounts the entire application and shows a blank white screen. Reviewers would lose in-progress label notes.
- ✅ **Fixed:** Added `src/components/ErrorBoundary.tsx` and wrapped `<App />` in `main.tsx`.

### 8. `apiFetch` non-JSON fallback returns `undefined` cast to `T`
- **File:** `src/api/client.ts`
- **Line:** 42–44
- **Flagged by:** 3/3 reviewers
- **Issue:** If the response has a non-JSON `Content-Type` and a non-zero body, `apiFetch` returns `undefined as T`. Callers expecting a concrete type will receive `undefined` at runtime, violating type safety.
- **Recommendation:** Throw an error for unexpected content types, or narrow the generic constraint so callers must handle `undefined` explicitly.

### 9. Inline styles throughout all components
- **File:** `src/views/*.tsx`, `src/components/*.tsx`
- **Line:** pervasive
- **Flagged by:** 1/3 reviewers
- **Issue:** Every component uses inline `style={{...}}` objects. This makes the codebase harder to maintain, prevents media queries, and bloats the JSX. As the UI grows, this will become unmanageable.
- **Recommendation:** Extract styles to CSS modules or a utility-class system (e.g., Tailwind) in a follow-up chore.

### 10. Histogram silently drops out-of-range HVS values
- **File:** `src/views/DomainReview.tsx`
- **Line:** 189–200
- **Flagged by:** 2/3 reviewers
- **Issue:** `buildHistogram` initializes bins for `0–100` in steps of 10. If `hvs_total` is negative or ≥ 100, the count is silently skipped. The chart will under-report page counts without any visual indication.
- **Recommendation:** Clamp `hvs_total` to `[0, 99.99]` before bucketing, or add an overflow bucket and render a warning if out-of-range values exist.

### 11. `labelsToday` counter resets on every navigation or refresh
- **File:** `src/views/ReviewQueue.tsx`
- **Line:** 29
- **Flagged by:** 2/3 reviewers
- **Issue:** `labelsToday` is local component state. Navigating to `/domains` and back, or refreshing the page, resets the counter to 0. This makes the "progress" metric unreliable for reviewers tracking daily throughput.
- **Recommendation:** Persist the counter to `sessionStorage` so it survives navigation within the same tab session, or fetch a server-side daily count from core.

### 12. No empty state for empty domain list
- **File:** `src/views/DomainReview.tsx`
- **Line:** 56–57
- **Flagged by:** 2/3 reviewers
- **Issue:** If `fetchDomains` returns an empty array, the component renders an empty `<table>` with headers but no rows. There is no message indicating "No domains found."
- ✅ **Fixed:** Added "No domains found." empty-state below the table.

## Minor

### 13. `contentLength === '0'` check is unreliable for chunked responses
- **File:** `src/api/client.ts`
- **Line:** 33
- **Flagged by:** 2/3 reviewers
- **Issue:** HTTP/2 and many proxies omit the `Content-Length` header. The check fails even when the body is truly empty. The `res.status === 204` check is correct, but the `contentLength` branch is fragile.
- **Recommendation:** Remove the `contentLength` check and rely solely on `res.status === 204`, or read the body and check its length after `res.text()`.

### 14. iframe sandbox allows same-origin access to external sites
- **File:** `src/views/ReviewQueue.tsx`
- **Line:** 118
- **Flagged by:** 2/3 reviewers
- **Issue:** `sandbox="allow-same-origin allow-scripts allow-popups"` on an iframe loading arbitrary third-party URLs grants the framed page access to its own origin's cookies and localStorage.
- **Recommendation:** Remove `allow-same-origin` if possible. If reviewed sites require it (e.g., for CSS rendering), document the security tradeoff.

### 15. `NavLink` component name collides with react-router-dom
- **File:** `src/components/Layout.tsx`
- **Line:** 33
- **Flagged by:** 1/3 reviewers
- **Issue:** The local `NavLink` helper has the same name as `react-router-dom`'s `NavLink`, which is confusing and may cause import mistakes later.
- ✅ **Fixed:** Renamed to `TopNavLink` (also done as part of #1 fix).

### 16. `useQuery` retry is set to 1 globally without 401 exclusion
- **File:** `src/main.tsx`
- **Line:** 10
- **Flagged by:** 1/3 reviewers
- **Issue:** `retry: 1` means a transient network failure will retry once, but a 401 should not be retried — it wastes a request and delays showing the auth error.
- **Recommendation:** Configure `retry` per-query or add a `retry` function that skips retries on 401.
