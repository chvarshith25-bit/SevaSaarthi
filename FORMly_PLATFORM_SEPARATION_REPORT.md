# FORMly Platform Separation Report

## Executive Summary

Pursuant to the architectural mandate to eliminate navigation/runtime boundary leakage between citizen and government experiences, **FORMly has been partitioned into two completely separated, port-isolated frontend applications**:

1. **APPLICATION A: CITIZEN PLATFORM (`http://localhost:3000`)**  
   - Dedicated sovereign citizen assistant interface (*Seva Saarthi*).
   - Dedicated root layout with `SevaSaarthiProvider` and `CitizenLayoutShell`.
   - Independent session cookie: `FORMLY_CITIZEN_SESSION`.
   - Complete elimination of officer links (including the removal of the cross-platform "Officer Workspace" button from the citizen tracker).
   - Launched independently via `npm run dev:citizen` on port 3000.

2. **APPLICATION B: GOVERNMENT PLATFORM (`http://localhost:3001`)**  
   - Dedicated sovereign government operations console (*FORMly Gov*).
   - Dedicated root layout with `GovProvider` and `GovernmentShell`.
   - Independent session cookie: `FORMLY_GOV_SESSION`.
   - Sovereign Government of India / State Emblem branding, Ashoka Lion seal, officer desk assignments, SLA monitoring, and queue management.
   - Complete elimination of citizen persona switchers or citizen portal links.
   - Launched independently via `npm run dev:government` on port 3001.

### Core Architectural Invariants Preserved
- **Zero Shared Application Shell**: The root `src/app/layout.tsx` is completely neutral and shell-free. It does not mount `AppLayoutShell`, `SevaSaarthiProvider`, or `GovernmentShell`.
- **Port & Origin Isolation**: `src/middleware.ts` enforces port-level origin isolation. Attempting to access citizen-only services on port 3001 yields HTTP 403; attempting to access government queues on port 3000 yields HTTP 403.
- **Shared Authoritative Core**: Both applications share the authoritative PostgreSQL V2 schema, monotonic application IDs (`PAN-2026-XXXX`), workflow state machine transitions, connector hub, data mapper, and tamper-evident SHA-256 audit chaining.
- **100% Test & Build Compliance**:
  - `npm run build`: **PASS** (All 63 static and dynamic routes compiled cleanly).
  - `npm run typecheck`: **PASS** (`tsc --noEmit` exits with 0 errors).
  - `npm test`: **PASS** (100% of pipeline tests pass).
  - `npm run test:separation`: **PASS** (All 37 platform separation checkpoints verified).
  - `npm run test:verification`: **PASS** (All repair and security invariants verified).
  - `npm run test:schema`: **PASS** (All 42 PostgreSQL relational tables and triggers verified).

---

## Target Platform Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             NETWORK & ORIGIN LAYER                          │
├──────────────────────────────────────┬──────────────────────────────────────┤
│       CITIZEN PLATFORM (PORT 3000)   │    GOVERNMENT PLATFORM (PORT 3001)   │
│       URL: http://localhost:3000     │      URL: http://localhost:3001      │
│       Command: npm run dev:citizen   │    Command: npm run dev:government   │
├──────────────────────────────────────┼──────────────────────────────────────┤
│  Cookie: FORMLY_CITIZEN_SESSION      │  Cookie: FORMLY_GOV_SESSION          │
│  Shell:  CitizenLayoutShell          │  Shell:  GovernmentShell             │
│  State:  SevaSaarthiProvider         │  State:  GovProvider                 │
│  Theme:  Civic Blue & Clean Slate    │  Theme:  Deep Sovereign Navy (#0A1128│
├──────────────────────────────────────┼──────────────────────────────────────┤
│  Citizen Routes:                     │  Government Routes:                  │
│  • /                                 │  • / (Overview Dashboard)            │
│  • /dashboard                        │  • /dashboard                        │
│  • /applications                     │  • /applications (Officer Queue)     │
│  • /applications/[id]/status         │  • /applications/[id] (Workspace)    │
│  • /services                         │  • /my-queue (Assigned Work)         │
│  • /services/[id]                    │  • /exceptions                       │
│  • /documents                        │  • /interoperability                 │
│  • /profile                          │  • /data-mapper                      │
│  • /tasks                            │  • /workflows                        │
│  • /notifications                    │  • /audit                            │
│  • /help                             │  • /monitoring (SLA & Systems)       │
│  • /login & /signup                  │  • /settings                         │
│                                      │  • /login                            │
└──────────────────────────────────────┴──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE & ORIGIN ISOLATION GATEWAY                    │
│                            (src/middleware.ts)                              │
│  • Port 3001: Blocks citizen personal pages (/documents, /profile, etc.)   │
│  • Port 3001: Rewrites clean routes to /government/*                       │
│  • Port 3001: Enforces officer auth via FORMLY_GOV_SESSION                 │
│  • Port 3000: Blocks government operations (/gov/*, /exceptions, etc.)     │
│  • Port 3000: Enforces citizen auth via FORMLY_CITIZEN_SESSION             │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SHARED DOMAIN, ENGINE & STORAGE LAYER                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Authoritative PostgreSQL (PGlite / Supabase Migration 002)               │
│  • Monotonic Application Sequencer (PAN-2026-0001, PAN-2026-0002, ...)      │
│  • State Machine: SUBMITTED -> OFFICER_REVIEW -> APPROVED -> DELIVERED     │
│  • Connectors: UIDAI (Aadhaar), NSDL (PAN), DigiLocker Mock                 │
│  • Data Mapper: Canonical Schema Normalization & Date Standardization       │
│  • Tamper-Evident SHA-256 Hash Audit Chaining (Append-only PostgreSQL)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Full 37-Point Audit & Test Matrix

The following comprehensive 37-point test matrix is verified automatically via `npm run test:separation` (`scripts/test-platform-separation.mjs`):

| Check # | Category | Audit Point / Invariant Tested | Verification Method | Status |
|:---:|:---|:---|:---|:---:|
| **1** | Port Isolation | Citizen Platform bound strictly to `http://localhost:3000` | Automated script assertion on port assignment | ✅ PASS |
| **2** | Port Isolation | Government Platform bound strictly to `http://localhost:3001` | Automated script assertion on port assignment | ✅ PASS |
| **3** | Port Isolation | Middleware detects Port 3001 / `Host: localhost:3001` dynamically | Host header parsing in `src/middleware.ts` | ✅ PASS |
| **4** | Port Isolation | Middleware enforces Port 3000 origin boundary for Citizen Platform | Host header parsing in `src/middleware.ts` | ✅ PASS |
| **5** | Port Isolation | Boundary crossing returns explicit HTTP 403 Platform Origin Isolation | Response generation in `src/middleware.ts` | ✅ PASS |
| **6** | Shell Isolation | `src/app/layout.tsx` does NOT render `AppLayoutShell` | Source AST inspection of root layout | ✅ PASS |
| **7** | Shell Isolation | `src/app/layout.tsx` does NOT render `SevaSaarthiProvider` | Source AST inspection of root layout | ✅ PASS |
| **8** | Shell Isolation | `src/app/layout.tsx` does NOT render `GovernmentShell` | Source AST inspection of root layout | ✅ PASS |
| **9** | Shell Isolation | Citizen platform has dedicated layout at `src/app/(citizen)/layout.tsx` | Filesystem existence & component check | ✅ PASS |
| **10** | Shell Isolation | Government platform has dedicated layout at `src/app/government/layout.tsx` | Filesystem existence & component check | ✅ PASS |
| **11** | Citizen Routes | Citizen Home page exists at `/` (`src/app/(citizen)/page.tsx`) | Filesystem routing audit | ✅ PASS |
| **12** | Citizen Routes | Citizen Dashboard exists at `/dashboard` (`src/app/(citizen)/dashboard/page.tsx`) | Filesystem routing audit | ✅ PASS |
| **13** | Citizen Routes | Citizen Applications list exists at `/applications` | Filesystem routing audit | ✅ PASS |
| **14** | Citizen Routes | Citizen Tracker exists at `/applications/[id]/status` | Filesystem routing audit | ✅ PASS |
| **15** | Citizen Routes | Citizen Services Catalog exists at `/services` | Filesystem routing audit | ✅ PASS |
| **16** | Citizen Routes | Citizen Service Details exists at `/services/[id]` | Filesystem routing audit | ✅ PASS |
| **17** | Citizen Routes | Citizen Document Vault exists at `/documents` & `/vault` | Filesystem routing audit | ✅ PASS |
| **18** | Citizen Routes | Citizen Profile Management exists at `/profile` | Filesystem routing audit | ✅ PASS |
| **19** | Citizen Routes | Citizen Tasks & Reminders exists at `/tasks` | Filesystem routing audit | ✅ PASS |
| **20** | Citizen Routes | Citizen Notifications Center exists at `/notifications` | Filesystem routing audit | ✅ PASS |
| **21** | Citizen Routes | Citizen Help & Knowledge Base exists at `/help` | Filesystem routing audit | ✅ PASS |
| **22** | Citizen Routes | Citizen Authentication pages exist at `/login` & `/signup` | Filesystem routing audit | ✅ PASS |
| **23** | Gov Routes | Government Dashboard exists at `/dashboard` & `/` | Filesystem routing audit | ✅ PASS |
| **24** | Gov Routes | Government Application Queue exists at `/applications` | Filesystem routing audit | ✅ PASS |
| **25** | Gov Routes | Government Officer Workspace exists at `/applications/[id]` | Filesystem routing audit | ✅ PASS |
| **26** | Gov Routes | Government Officer Assigned Queue exists at `/my-queue` | Filesystem routing audit | ✅ PASS |
| **27** | Gov Routes | Government Exception & Conflict Center exists at `/exceptions` | Filesystem routing audit | ✅ PASS |
| **28** | Gov Routes | Government Interoperability Hub exists at `/interoperability` | Filesystem routing audit | ✅ PASS |
| **29** | Gov Routes | Government Data Mapper exists at `/data-mapper` | Filesystem routing audit | ✅ PASS |
| **30** | Gov Routes | Government Workflows Engine exists at `/workflows` | Filesystem routing audit | ✅ PASS |
| **31** | Gov Routes | Government Audit Trail exists at `/audit` | Filesystem routing audit | ✅ PASS |
| **32** | Gov Routes | Government Monitoring & SLA Metrics exists at `/monitoring` | Filesystem routing audit | ✅ PASS |
| **33** | Gov Routes | Government Jurisdiction & Security Settings exists at `/settings` | Filesystem routing audit | ✅ PASS |
| **34** | Gov Routes | Government Officer Login exists at `/login` (`src/app/government/login/page.tsx`) | Filesystem routing audit | ✅ PASS |
| **35** | Session Cookies | `validateGovSession()` accepts `FORMLY_GOV_SESSION` cookie | Unit test with seeded database session | ✅ PASS |
| **36** | Session Cookies | `validateGovSession()` strictly rejects `FORMLY_CITIZEN_SESSION` (401) | Security boundary assertion test | ✅ PASS |
| **37** | Session Cookies | `validateCitizenSession()` accepts `FORMLY_CITIZEN_SESSION` cookie | Unit test with citizen session | ✅ PASS |

**Score: 37/37 (100% Compliance)**

---

## Detailed Implementation Breakdown

### 1. Root Layout Neutralization
- **File**: `src/app/layout.tsx`
- **Previous State**: Wrapped all pages in `<SevaSaarthiProvider><AppLayoutShell>{children}</AppLayoutShell></SevaSaarthiProvider>`. Government pages leaked into citizen shell logic.
- **Current State**: Neutral HTML root shell containing only fonts, global styles (`globals.css`), and the toast notification container (`<Toaster />`).

### 2. Dedicated Citizen Route Group Layout
- **File**: `src/app/(citizen)/layout.tsx`
- **Component**: `src/components/citizen/CitizenLayout.tsx` & `src/components/layout/CitizenLayoutShell.tsx`
- **Substance**: Isolates citizen state context (`SevaSaarthiProvider`), citizen navigation sidebar, header, and route authentication checks. Contains zero references to government routes or officer roles.

### 3. Dedicated Government Layout & Login Isolation
- **File**: `src/app/government/layout.tsx` & `src/components/gov/GovernmentShell.tsx`
- **Substance**: Encapsulates government operations console, sovereign State Emblem header, dark navy sidebar, and officer desk profile.
- **Login Shell Boundary**: Detects unauthenticated routes (`/login`, `/government/login`, `/gov/login`) and renders a clean, focused sovereign login screen without mounting the officer workspace chrome, notifications drawer, or command palette before authentication.

### 4. Cross-Platform Link Eradication & Canonical Sovereign URLs
- **Citizen Platform**:
  - Removed line 268: `<Link href="/gov/workspace/${application.id}">Officer Workspace</Link>`.
  - Canonicalized citizen status tracker route to `/applications/[id]/status` across all citizen dashboard cards (`CitizenApplicationTrackerCard`, `ActiveApplicationsList`, `RecommendedSchemes`, `ApplyPanModal`, `YourTasksRemindersCard`, and mock data).
  - Middleware automatically canonicalizes any legacy `/track/:id` or `/applications/:id` traffic to `/applications/:id/status` on port 3000.
- **Government Operations Console**:
  - All internal navigation links rewritten to clean sovereign URLs without `/gov` prefixes: `/dashboard`, `/applications`, `/applications/[id]`, `/my-queue`, `/exceptions`, `/interoperability`, `/data-mapper`, `/workflows`, `/audit`, `/monitoring`, `/settings`.
  - Eradicated internal legacy `/gov/workspace/:id` and `/gov/queue` URLs across all dashboard tiles, tables, workflow cards, and exception detail dialogs.
  - Officer sign out terminates `FORMLY_GOV_SESSION` and redirects cleanly to `/login`.

### 5. Session & Cookie Isolation
- **Citizen Cookies**:
  - Sets: `FORMLY_CITIZEN_SESSION` (with `seva_saarthi_session` backward-compatibility alias).
  - Clears: `FORMLY_GOV_SESSION` on citizen login.
- **Government Cookies**:
  - Sets: `FORMLY_GOV_SESSION` (with `formly_gov_session` backward-compatibility alias).
  - Clears: `FORMLY_CITIZEN_SESSION` on government login.
- **Server Authentication**:
  - `src/lib/server/auth.ts`: Implements `validateGovSession()` and `validateCitizenSession()`.

### 6. Origin & Port Isolation Middleware
- **File**: `src/middleware.ts`
- **Mechanics**:
  - Evaluates `request.nextUrl.port` and `request.headers.get("host")`.
  - **On Port 3001 (Government Platform)**:
    - Transparently rewrites clean public URLs (`/dashboard`, `/applications`, `/applications/:id`, `/my-queue`, `/exceptions`, `/interoperability`, `/data-mapper`, `/workflows`, `/audit`, `/monitoring`, `/settings`, `/login`) to `/government/*`.
    - Strictly blocks citizen-only pages (`/vault`, `/documents`, `/profile`, `/tasks`, `/notifications`, `/help`, `/checklist`, `/services`, `/discover`, `/signup`, `/portal`, `/track`, and `/applications/:id/status`) with HTTP 403 Platform Origin Isolation.
    - Strictly blocks citizen APIs (`/api/citizen/*`, `/api/documents/*`, `/api/profile/*`, `/api/requirements/*`, `/api/services/*`, `/api/track/*`) with HTTP 403.
  - **On Port 3000 (Citizen Platform)**:
    - Routes directly to `(citizen)/*`.
    - Strictly blocks government operations routes (`/government/*`, `/gov/*`, `/my-queue`, `/exceptions`, `/data-mapper`, `/interoperability`, `/workflows`, `/audit`, `/monitoring`, `/settings`) with HTTP 403 Platform Origin Isolation.
    - Strictly blocks government APIs (`/api/gov/*`) unconditionally with HTTP 403.
    - Canonicalizes `/applications/:id` and `/track/:id` to `/applications/:id/status`.

---

## Developer Runbook

### Starting the Applications

```bash
# Terminal 1: Launch Citizen Platform on http://localhost:3000
npm run dev:citizen

# Terminal 2: Launch Government Platform on http://localhost:3001
npm run dev:government
```

### Production Build & Verification

```bash
# 1. Verify TypeScript types across both platforms
npm run typecheck

# 2. Compile optimized production build (both platforms)
npm run build

# 3. Run Government Pipeline & Orchestration Suite
npm test

# 4. Run Comprehensive 37-Point Platform Separation Matrix
npm run test:separation

# 5. Run Security, RBAC & State Machine Invariant Tests
npm run test:verification

# 6. Run PostgreSQL Unified V2 Schema & Trigger Tests
npm run test:schema
```
