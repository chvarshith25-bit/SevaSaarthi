# SARKAR SEVA — GOVERNMENT PORTAL INTEGRITY PRE-FIX DIAGNOSTIC REPORT
**Phase 9.0.5 Initial State Freeze**
*Date: 2026-09-20 | Git Commit: `2b0706cda8e98fcc995dcb10a973fedc15f5d159` | Branch: `main`*

---

## 1. Environment & Architecture Baseline

| Property | Current Baseline |
| :--- | :--- |
| **Git Commit** | `2b0706cda8e98fcc995dcb10a973fedc15f5d159` |
| **Branch** | `main` |
| **Application Version** | `0.1.0` (Next.js 16.3.4 App Router / Turbopack) |
| **Database Schema** | `002_formly_v2_unified_schema.sql` (PostgreSQL / PGlite) |
| **AI Subsystems** | Model 1 (Frozen), Model 2 V4.2 (Frozen), V3.1 Fallback (Authoritative) |
| **Port Boundaries** | Citizen: `http://localhost:3000` \| Government: `http://localhost:3001` |

---

## 2. Identified Defect Catalog

### Issue 1: Hardcoded Mock Stats in Store
- In `src/lib/store/gov-store.tsx`, `total = 1250`, `newApps = 83`, `verificationPending = 40`, `officerReview = 17`, `returned = 8`, `approved = 1104`, `unresolvedExceptions = 10` were statically hardcoded constants instead of dynamic aggregations computed from backend data.

### Issue 2: Sidebar vs Page Count Discrepancy
- The sidebar badge for "Applications" displayed `83` (from hardcoded `stats.newApps`), while the active database returned 17 applications.
- When unauthenticated or before initial fetch completed, the page displayed `Showing 0 of 0 cases` while the sidebar continued showing `83`.

### Issue 3: Stale Tab Filter Persistence
- In `src/app/government/applications/page.tsx`, `useState(initialTab)` initialized `activeTab` only on first render. Subsequent sidebar clicks on `/government/applications` did not reset `activeTab` to `"all"` if the user had previously switched to another filter.

### Issue 4: Generic Empty State Handling
- When 0 applications matched a query, the table showed a single generic message (`No applications match your active filters`) without differentiating between empty dataset, search mismatch, or active filter exclusion.

### Issue 5: Navigation Item Link Target Alignment
- In `GovernmentShell.tsx`, "Review" pointed to `/government/applications?tab=assigned` instead of the canonical `/government/applications?tab=needs_action` queue.

---

## 3. Scope of Planned Phase 9.0.5 Repairs

1. **Dynamic Stats Single Source of Truth**: Dynamically calculate all counts in `src/lib/store/gov-store.tsx` from `applications` and `exceptions` state.
2. **Tab State Synchronization**: Add `useEffect` in `src/app/government/applications/page.tsx` listening to `searchParams` to ensure sidebar clicks reset to `"all"` applications.
3. **Structured Empty States**: Implement distinct UX for No Applications, Search Mismatch, Filter Mismatch, and Scope Exclusion with 1-click reset CTAs.
4. **Navigation Consistency**: Link sidebar Review to `tab=needs_action` with `stats.officerReview` badge, Applications to `tab=all` with `stats.total` badge, and Exceptions to `/government/exceptions` with `stats.exceptions` badge.
5. **Comprehensive Verification**: Create automated test suites `scripts/test-government-portal-count-consistency.ts`, run route audits, data consistency, and full Playwright browser validations.
