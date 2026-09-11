# FORMly FULL SYSTEM AUDIT

## 1. Executive Summary

- **Overall Health:** HIGH RISK / CRITICAL
- **Overall Confidence:** HIGH ([CERTAIN] backed by direct code inspection, live HTTP probing, and TypeScript compiler logs)
- **Primary Finding:** While the conceptual design and PostgreSQL V2 schema (`supabase/migrations/002_formly_v2_unified_schema.sql`) exhibit high technical sophistication (42 relational tables, strict state machine transition matrices, domain event logging, and fine-grained RLS policies), the application runtime is critically broken. The runtime layer cannot connect to Supabase, 28 TypeScript compiler errors block building, citizen application submissions crash with 401 Unauthorized, citizen tracking is permanently locked behind a 403 Forbidden property mismatch bug, and unauthenticated visitors can bypass authentication guards to enter the government operations portal.

### Top 10 Issues

| # | Severity | Confidence | Issue | File & Line Reference | Impact |
|---|---|---|---|---|---|
| 1 | **CRITICAL** | [CERTAIN] | **Anonymous Access Bypass to Government Operations**: `src/middleware.ts` only redirects if a user has a citizen cookie and lacks a government cookie (`citizenSession && !govSession`). Completely unauthenticated visitors bypass the check and receive HTTP 200 on `/gov`, `/gov/queue`, and `/gov/workspace/*`. | `src/middleware.ts:24-32` | Anyone on the public internet can inspect government queues, officer assignments, and citizen applications without credentials. |
| 2 | **CRITICAL** | [CERTAIN] | **Citizen Application Submission Fails (HTTP 401)**: The citizen-facing PAN submission modal issues a `POST` to `/api/gov/applications`. That endpoint enforces government officer authentication (`validateGovSession`). Citizens possessing only `seva_saarthi_session` are immediately rejected with 401 Unauthorized. | `src/components/dashboard/ApplyPanModal.tsx:55`, `src/app/api/gov/applications/route.ts:7,31` | No citizen can ever submit an application from the citizen portal. |
| 3 | **CRITICAL** | [CERTAIN] | **Citizen Tracker Authorization Bug (Permanent HTTP 403)**: The tracking API checks `if (app.citizen_user_id !== user.id)`. The `PanApplicationRecord` interface defines the applicant field as `userId`. Therefore, `app.citizen_user_id` evaluates to `undefined`, triggering an automatic 403 Forbidden rejection for all tracking queries. | `src/app/api/track/[id]/route.ts:31`, `src/app/api/track/[id]/resubmit/route.ts:31`, `src/types/government.ts:91` | Citizens cannot view the status of their applications or resubmit requested corrections. |
| 4 | **CRITICAL** | [CERTAIN] | **Unreachable Supabase Database Layer**: `.env.local` specifies placeholder URL `https://your-project-ref.supabase.co`. Server data operations in `src/lib/server/db.ts` invoke `supabaseAdmin` directly without local JSON fallback or error recovery, resulting in hanging network requests, DNS timeouts, or unhandled exceptions. | `src/lib/server/db.ts:408-415`, `src/lib/server/supabase.ts:10-13`, `.env.local:10-12` | Server-side persistence is non-functional; client-side relies on volatile `localStorage` cache. |
| 5 | **CRITICAL** | [CERTAIN] | **28 TypeScript Compilation Errors (`tsc --noEmit` fails)**: `tsc` fails with 28 compiler errors, including missing exported functions in `db.ts` (`markRequirementResolvedForUser`, `unmarkRequirementResolvedForUser`, `rejectExtractedFieldForUser`), unawaited Promises in route handlers, and an undefined state variable `setIsLoggingIn` in `gov/login/page.tsx`. | `src/app/gov/login/page.tsx:18,35`, `src/app/api/requirements/[id]/resolve/route.ts:2`, `src/lib/server/db.ts:377` | The project cannot be built for production (`next build` fails). |
| 6 | **CRITICAL** | [CERTAIN] | **Live Government Portal Scraping & Compliance Violation**: The background script `scripts/run-live-agent.mjs` launches a real Chromium instance navigating to the live Protean PAN registration portal (`onlineservices.proteantech.in`) and inputs fabricated Aadhaar numbers (`5492 8173 9012`) and bank credentials. This is exposed via a detached child process in `src/app/api/agent/launch-headed/route.ts`. | `scripts/run-live-agent.mjs:40`, `src/app/api/agent/launch-headed/route.ts:57`, `extension/manifest.json:12` | Severe legal and regulatory compliance risk under IT Act / DPDP Act 2023; exposes the host to immediate IP blacklisting. |
| 7 | **HIGH** | [CERTAIN] | **Deceptive / Misleading UI Claims**: The tracking interface displays badges asserting "Direct Government State Machine Integration" and live "UIDAI Aadhaar 2.5 API" verification. Furthermore, `/api/agent/autofill/route.ts` returns fabricated strings claiming "Application successfully submitted to Government of India portal!" with randomized IDs. | `src/app/track/[id]/page.tsx:260, 374`, `src/app/api/agent/autofill/route.ts:31` | Disqualifying in competitive evaluation (SIH); misrepresents mock/simulated code as live sovereign infrastructure. |
| 8 | **HIGH** | [CERTAIN] | **Zero Real OCR / Synthetic Hardcoding**: `src/lib/ocr/ocr-engine.ts` does not process uploaded file bytes. It inspects only the file name, executes an arbitrary 1800ms delay, and returns hardcoded text for "Sai Sankeerth", even though `.env.local` claims `OCR_PROVIDER=tesseract`. | `src/lib/ocr/ocr-engine.ts:14-39` | Any file uploaded (including blank text files) produces the exact same mock Aadhaar/income certificate fields. |
| 9 | **HIGH** | [CERTAIN] | **Duplicate Government Routing Trees**: The repository maintains two parallel routing directories: `src/app/gov` (10 pages) and `src/app/government` (11 pages), which re-exports `/gov` pages while duplicating layouts and middleware rules. | `src/app/gov`, `src/app/government` | Induces routing ambiguity, complicates authorization rules, and inflates maintenance surface. |
| 10 | **HIGH** | [CERTAIN] | **Complete Failure of Test Automation**: Running `npm test` fails immediately with an assertion error (`Initial applications loaded (found undefined)`) because `getPanApplications()` was made async while the test script invokes it synchronously. There are zero unit or integration tests for security or API routes. | `scripts/test-gov-pipeline.mjs:40`, `package.json:11` | Zero automated regression protection. |

---

## 2. Project Architecture Found

### Actual Architecture Overview
The FORMly / Seva Saarthi codebase is constructed as a Next.js 16 (App Router) hybrid application with React 18 and Tailwind CSS. While architectural documents claim a unified PostgreSQL backend, the application runtime is partitioned into two disconnected subsystems: a citizen client operating predominantly against browser `localStorage`, and a government operations portal backed by server-side routes that fail when contacting a placeholder Supabase URL.

- **Frontend:** Next.js 16.3.4 (App Router) with React 18.3.1. Styling is provided via Tailwind CSS 3.4.13 with Lucide React icons. Client state is split across `src/lib/store/formly-store.tsx` (Citizen) and `src/lib/store/gov-store.tsx` (Government).
- **Backend:** Next.js Route Handlers (`src/app/api/**/route.ts`). Edge and Node.js runtimes. Authentication helper logic resides in `src/lib/server/auth.ts` and data access in `src/lib/server/db.ts`.
- **Database:** Supabase (PostgreSQL 15+). Two migration files exist:
  - `supabase/migrations/001_formly_schema.sql` (6 core V1 tables).
  - `supabase/migrations/002_formly_v2_unified_schema.sql` (42 V2 unified tables with RLS and domain functions).
  - Runtime connection is configured via `src/lib/server/supabase.ts` using `@supabase/supabase-js`.
- **Authentication:** Dual-session cookie model:
  - Citizen session: `seva_saarthi_session` (30-day hex token stored in cookies).
  - Government session: `formly_gov_session` (cookie storing employee token).
  - Verification functions: `authenticateSession()` in `db.ts` and `validateGovSession()` in `auth.ts`.
- **Government Side:** Accessible under `/gov/*` and `/government/*`. Powered by `gov-store.tsx` and `GovernmentShell.tsx`. Provides Queue, Assignments, Exception Center, Interoperability Hub, Data Mapper, and Monitoring.
- **Citizen Side:** Accessible under `/dashboard`, `/vault`, `/checklist`, `/track/[id]`, and `/documents`. Powered by `formly-store.tsx` and `AppLayoutShell.tsx`.
- **AI Integration:** Simulated. No live API integrations with OpenAI, Anthropic, or Google Gemini. All AI summaries, risk assessments, and recommendations are static text pre-populated in `src/lib/mock-data/pan-initial-data.ts` or hardcoded in templates.
- **Connectors & Interoperability:** Simulated in-memory layer in `src/lib/server/connectors.ts` and `src/lib/server/data-mapper.ts`. Simulated endpoints emulate UIDAI, Income Tax Department, Digilocker, NSP, and NSDL.
- **Workflow & State Machine:** Dual implementation:
  1. Authoritative PostgreSQL function `transition_application_status` in `002_formly_v2_unified_schema.sql` with strict state transitions.
  2. Runtime TypeScript functions in `src/lib/server/db.ts` (`officerAcceptApplication`, `officerReturnApplication`, `officerRejectApplication`) that directly mutate status columns without invoking the SQL state machine function.
- **Realtime:** Implemented via client-side polling (`setInterval` polling `/api/track/[id]` every 3.5 seconds in `src/app/track/[id]/page.tsx:67`). No WebSocket, Server-Sent Events (SSE), or Supabase Realtime channels are utilized.
- **Browser Extension & Automation:** Chrome Manifest V3 extension in `extension/` with content scripts requesting `<all_urls>` host permissions, and a Playwright headed automation script in `scripts/run-live-agent.mjs` spawned from `src/app/api/agent/launch-headed/route.ts`.

---

## 3. Route Inventory

All 38 routes detected across the `src/app` directory were mapped, probed, and evaluated for role restrictions and security defects.

| Route | Type | Role Intended | Status | Issues & Evidence |
|---|---|---|---|---|
| `/` | Page (SSR) | Public / Landing | ✅ PASS | Marketing landing page. Redirects authenticated users. |
| `/(auth)/login` | Page (Client) | Public / Unauth | ⚠️ PARTIAL | Form submits to `/api/auth/login`. Pre-filled demo credentials. |
| `/(auth)/signup` | Page (Client) | Public / Unauth | ⚠️ PARTIAL | Submits to `/api/auth/register`. Database writes fail if Supabase is down. |
| `/dashboard` | Page (Client) | Citizen | ⚠️ PARTIAL | Protected by `AppLayoutShell`. However, `src/middleware.ts` does not redirect anonymous visitors. |
| `/vault` | Page (Client) | Citizen | ✅ PASS | Document locker UI. Loads data from store / `localStorage`. |
| `/checklist` | Page (Client) | Citizen | ✅ PASS | Interactive service readiness checklist. Evaluates requirements. |
| `/documents` | Page (Client) | Citizen | ⚠️ PARTIAL | Document upload interface. OCR backend is simulated. |
| `/profile` | Page (Client) | Citizen | ⚠️ PARTIAL | Profile management. Batch save relies on failing `/api/profile`. |
| `/tasks` | Page (Client) | Citizen | ✅ PASS | Displays pending resolution tasks from store state. |
| `/notifications` | Page (Client) | Citizen | ✅ PASS | In-app notification center. |
| `/discover` | Page (Client) | Citizen | ✅ PASS | Service and scheme discovery catalog. |
| `/help` | Page (Client) | Citizen | ✅ PASS | Knowledge base, FAQs, and scheme procurement guides. |
| `/settings` | Page (Client) | Citizen | ✅ PASS | User preferences and account settings. |
| `/applications` | Page (Client) | Citizen | ⚠️ PARTIAL | Lists citizen applications; data pulled from store/mock. |
| `/track` | Page (Client) | Citizen | ⚠️ PARTIAL | Redirects to latest active application tracking page. |
| `/track/[id]` | Page (Client) | Citizen | ❌ FAIL | Hardcoded as "PAN APPLICATION TRACKER". Calling `/api/track/[id]` returns 403 Forbidden (`src/app/api/track/[id]/route.ts:31`). |
| `/portal/scholarships` | Page (Client) | Citizen | ⚠️ PARTIAL | Portal simulation page for NSP scholarship workflow. |
| `/gov` | Page (Client) | Gov Employee | ❌ FAIL | **Security Defect**: Anonymous visitors receive HTTP 200 without logging in (`src/middleware.ts:24-32`). |
| `/gov/login` | Page (Client) | Public / Gov | ❌ FAIL | **Compiler Error**: `setIsLoggingIn` is not defined in `src/app/gov/login/page.tsx:18,35`. |
| `/gov/queue` | Page (Client) | Gov Officer / Admin | ❌ FAIL | Accessible without authentication via anonymous middleware bypass. |
| `/gov/workspace/[id]` | Page (Client) | Gov Officer | ❌ FAIL | Accessible anonymously. Hardcoded to PAN processing workspace. |
| `/gov/exceptions` | Page (Client) | Gov Officer / Admin | ❌ FAIL | Accessible anonymously. Exception review center. |
| `/gov/interoperability` | Page (Client) | Gov Admin / Officer | ❌ FAIL | Accessible anonymously. Shows simulated connector health. |
| `/gov/data-mapper` | Page (Client) | Gov Admin / Officer | ❌ FAIL | Accessible anonymously. Displays schema mapping transformations. |
| `/gov/workflows` | Page (Client) | Gov Admin / Officer | ❌ FAIL | Accessible anonymously. Visualizes step engine definitions. |
| `/gov/audit` | Page (Client) | Gov Admin / Officer | ❌ FAIL | Accessible anonymously. Displays system audit trail. |
| `/gov/monitoring` | Page (Client) | Sys Admin | ❌ FAIL | Accessible anonymously. System performance and SLA metrics. |
| `/government` | Page (Client) | Gov Employee | ⚠️ PARTIAL | Duplicate route re-exporting `/gov/page.tsx`. Anonymous bypass active. |
| `/government/login` | Page (Client) | Public / Gov | ⚠️ PARTIAL | Duplicate route re-exporting `/gov/login/page.tsx`. |
| `/government/applications` | Page (Client) | Gov Employee | ⚠️ PARTIAL | Duplicate route re-exporting `/gov/queue/page.tsx`. |
| `/government/applications/[id]` | Page (Client) | Gov Officer | ⚠️ PARTIAL | Duplicate route re-exporting `/gov/workspace/[id]/page.tsx`. |
| `/government/queue` | Page (Client) | Gov Employee | ⚠️ PARTIAL | Duplicate route re-exporting `/gov/queue/page.tsx`. |
| `/government/exceptions` | Page (Client) | Gov Employee | ⚠️ PARTIAL | Duplicate route re-exporting `/gov/exceptions/page.tsx`. |
| `/government/interoperability`| Page (Client) | Gov Employee | ⚠️ PARTIAL | Duplicate route re-exporting `/gov/interoperability/page.tsx`. |
| `/government/data-mapper` | Page (Client) | Gov Employee | ⚠️ PARTIAL | Duplicate route re-exporting `/gov/data-mapper/page.tsx`. |
| `/government/workflows` | Page (Client) | Gov Employee | ⚠️ PARTIAL | Duplicate route re-exporting `/gov/workflows/page.tsx`. |
| `/government/audit` | Page (Client) | Gov Employee | ⚠️ PARTIAL | Duplicate route re-exporting `/gov/audit/page.tsx`. |
| `/government/monitoring` | Page (Client) | Sys Admin | ⚠️ PARTIAL | Duplicate route re-exporting `/gov/monitoring/page.tsx`. |

---

## 4. API Inventory

All 26 Next.js Route Handlers were audited across HTTP method, authentication mechanism, RBAC check, database access, and security issues.

| Method | Endpoint | Auth Required | Role Required | Purpose | Issues & Evidence |
|---|---|---|---|---|---|
| `POST` | `/api/agent/autofill` | None | None | Simulates external autofill | Returns fake success and randomized application ID (`route.ts:31`). |
| `POST` | `/api/agent/launch-headed` | Citizen | None | Launches Playwright | **CRITICAL**: Spawns detached browser against live government portal (`route.ts:57`). Type errors in `route.ts:31`. |
| `POST` | `/api/auth/login` | Public | None | Citizen login | Sets `seva_saarthi_session` cookie. Fails when Supabase unreachable. |
| `POST` | `/api/auth/logout` | None | None | Citizen logout | Clears session cookie and deletes from database. |
| `POST` | `/api/auth/register` | Public | None | Citizen signup | Hashes password with PBKDF2. Inserts user into Supabase. |
| `GET` | `/api/auth/session` | Citizen | None | Validate citizen session | Returns active user profile from DB. Fails if Supabase offline. |
| `GET` | `/api/documents` | Citizen | None | Fetch citizen documents | Queries `documents` table for authenticated user. |
| `POST` | `/api/documents` | Citizen | None | Upload document | Simulates upload & OCR. Does not persist binary to Supabase storage. |
| `GET` | `/api/documents/[id]` | Citizen | None | Fetch single document | **Type Error**: Calls `getUserDocuments` without `await` (`route.ts:28`). |
| `DELETE` | `/api/documents/[id]` | Citizen | None | Delete document | **Type Error**: Condition checks unawaited Promise (`route.ts:57`). |
| `POST` | `/api/documents/[id]/extracted-fields/[fieldId]/accept` | Citizen | None | Accept extracted OCR field | Confirms value into `profile_fields` table. |
| `POST` | `/api/documents/[id]/extracted-fields/[fieldId]/reject` | Citizen | None | Reject extracted OCR field | **Compiler Error**: `rejectExtractedFieldForUser` missing in `db.ts` (`route.ts:2`). |
| `GET` | `/api/gov/applications` | Officer/Admin | Gov Employee | List government queue | Enforces `validateGovSession`. Queries Supabase `applications`. |
| `POST` | `/api/gov/applications` | Officer/Admin | Gov Employee | Create application | **CRITICAL DEFECT**: Used by citizen `ApplyPanModal.tsx:55`; rejects citizens with 401. |
| `GET` | `/api/gov/applications/[id]` | Officer/Admin | Gov Employee | Fetch case workspace | Returns application, documents, and audit logs. No assignment scoping. |
| `PATCH` | `/api/gov/applications/[id]` | Officer/Admin | Gov Employee | Officer actions (ACCEPT, RETURN, REJECT) | **Security Defect**: Any officer can approve any case (no department or assignment check). Also exposes `RESUBMIT_CORRECTION` to officers. |
| `GET` | `/api/gov/audit` | Officer/Admin | Gov Employee | Fetch audit trail | **Type Error**: Calls `getAuditLogs()` without `await` (`route.ts:17`). |
| `POST` | `/api/gov/audit` | Officer/Admin | Gov Employee | Record audit log | Inserts audit event into database. |
| `POST` | `/api/gov/auth/login` | Public | Gov Role | Government login | Verifies credentials and sets `formly_gov_session` cookie. |
| `POST` | `/api/gov/auth/logout` | None | None | Government logout | Clears government session cookie. |
| `GET` | `/api/gov/connectors` | Officer/Admin | Gov Employee | Check connector status | Returns simulated connector health records. |
| `POST` | `/api/gov/connectors` | Officer/Admin | Gov Employee | Execute connector test | Simulates connector payload roundtrip. |
| `GET` | `/api/gov/data-mapper` | Officer/Admin | Gov Employee | Get canonical mappings | Returns system-to-canonical data mappings. |
| `POST` | `/api/gov/data-mapper` | Officer/Admin | Gov Employee | Test field mapping | Transforms arbitrary JSON against mapping rules. |
| `GET` | `/api/gov/exceptions` | Officer/Admin | Gov Employee | List exception queue | **Type Error**: Calls `getExceptions()` without `await` (`route.ts:15`). |
| `POST` | `/api/gov/exceptions` | Officer/Admin | Gov Employee | Resolve exception | Updates exception record status. |
| `POST` | `/api/gov/reset` | Officer/Admin | Gov Employee | Reset demo pipeline | Resets applications to pre-seeded demonstration state. |
| `GET` | `/api/profile` | Citizen | None | Get user profile fields | Returns profile fields for authenticated citizen. |
| `PATCH` | `/api/profile` | Citizen | None | Update profile fields | Upserts single or batch profile fields into database. |
| `POST` | `/api/requirements/[id]/resolve` | Citizen | None | Mark requirement resolved | **Compiler Error**: `markRequirementResolvedForUser` missing in `db.ts` (`route.ts:2`). |
| `POST` | `/api/requirements/[id]/unresolve` | Citizen | None | Unmark requirement | **Compiler Error**: `unmarkRequirementResolvedForUser` missing in `db.ts` (`route.ts:2`). |
| `GET` | `/api/services/[id]/checklist` | Citizen | None | Compute service checklist | **Type Error**: `getUserRequirementStatuses` not awaited (`route.ts:35`). |
| `GET` | `/api/track/latest` | Citizen | None | Get active application ID | **Type Error**: Checks `app.application_number` which does not exist (`route.ts:33`). |
| `GET` | `/api/track/[id]` | Citizen | None | Citizen tracker detail | **CRITICAL DEFECT**: Checks `app.citizen_user_id !== user.id` (`route.ts:31`); always 403. |
| `POST` | `/api/track/[id]/resubmit` | Citizen | None | Resubmit correction | **CRITICAL DEFECT**: Checks `app.citizen_user_id !== user.id` (`route.ts:31`); always 403. |

---

## 5. Database Audit

The repository contains two PostgreSQL migration scripts: `001_formly_schema.sql` (316 lines) and `002_formly_v2_unified_schema.sql` (2,107 lines).

### Schema Architecture & Verification
Running `npm run test:schema` verifies the V2 unified schema using in-memory PGlite. The migration successfully compiles 42 tables, check constraints, foreign keys, triggers, and RLS policies.

| Table Name | Purpose | Security / RLS Policy | Relationships | Audit Finding / Issues |
|---|---|---|---|---|
| `profiles` | Base user profile entity | `auth.uid() = user_id` | 1:1 with `users` | Compliant. Scoped to citizen owner. |
| `profile_fields` | Normalized EAV profile attributes | Scoped to owner (`user_id`) | FK to `profiles` | Compliant. |
| `documents` | Uploaded citizen document records | Scoped to owner (`user_id`) | FK to `profiles` | Metadata only; binary files not stored in Supabase storage buckets. |
| `extracted_fields` | OCR-derived key-value pairs | Scoped to owner via document | FK to `documents` | Stores raw text and normalization confidence. |
| `departments` | Government ministerial departments | Public SELECT, Admin mutate | 1:N with `offices` | Seated with CBDT and MeitY. |
| `offices` | Regional government processing branches | Public SELECT, Admin mutate | FK to `departments` | Seated with regional processing centers. |
| `employees` | Government officer accounts & roles | Gov users only (`current_employee_id()`) | FK to `departments` | Enforces `OFFICER`, `DEPT_ADMIN`, `SYS_ADMIN`. |
| `permission_overrides` | Granular RBAC bypass & grants | Admin only | FK to `employees` | Fine-grained permission rules. |
| `services` | Public government scheme catalog | Public SELECT, Admin mutate | 1:N with `service_requirements` | Generic for PAN, NSP, Housing, etc. |
| `service_requirements` | Eligibility document/field rules | Public SELECT, Admin mutate | FK to `services` | 17 pre-configured requirements. |
| `applications` | Core application entity | Scoped: Citizen sees own; Officer sees dept | FK to `services`, `profiles` | Primary lifecycle tracking table. |
| `application_profile_snapshots` | Immutable point-in-time profile copy | Scoped to application access | FK to `applications` | Freezes citizen data at time of submission. |
| `application_documents` | Documents bound to specific application | Scoped to application access | FK to `applications`, `documents` | Links verified docs to submission. |
| `application_requirement_status` | Per-application checklist results | Scoped to application access | FK to `applications`, `requirements` | Records satisfy/missing flags. |
| `consent_requests` | Citizen consent authorization records | Scoped to owner (`user_id`) | FK to `applications` | DPDP Act compliant consent tracking. |
| `consent_scopes` | Permitted data extraction scopes | Scoped to owner | FK to `consent_requests` | Granular field-level consent scopes. |
| `canonical_fields` | Master canonical dictionary | Public SELECT | 1:N with `data_mappings` | Standardizes names across ministries. |
| `canonical_values` | Standardized normalized values | Public SELECT | FK to `canonical_fields` | Normalized representations. |
| `connectors` | External government system registry | Gov users only | 1:N with `connector_requests` | Modeled as DEMO environment. |
| `data_mappings` | Schema transform translation rules | Gov users only | FK to `connectors` | JSONPath transformation rules. |
| `connector_requests` | Logs of outbound API calls | Gov users only | FK to `connectors` | Stores status, latency, request/response headers. Sensitive payloads excluded by default. |
| `verification_requests` | Automated pre-flight check requests | Gov users only | FK to `applications` | Verification task tracker. |
| `verification_results` | Output of automated verification checks | Scoped to application access | FK to `verification_requests` | Match/mismatch scores and flags. |
| `routing_rules` | Automated department routing policies | Gov Admin only | FK to `departments` | Evaluates rules to route cases. |
| `application_assignments` | Officer application allocations | Scoped: Assigned officer / Admin | FK to `applications`, `employees` | Tracks active assigned reviewer. |
| `workflow_definitions` | Multi-step DAG orchestration models | Gov users only | 1:N with `workflow_steps` | Reusable workflow templates. |
| `workflow_steps` | Individual automated/human tasks | Gov users only | FK to `workflow_definitions` | Defines step order and SLA. |
| `workflow_transitions` | Legal transitions between steps | Gov users only | FK to `workflow_steps` | State transition graph. |
| `workflow_executions` | Live run of a workflow for an app | Scoped to application access | FK to `applications` | Active workflow execution state. |
| `workflow_step_executions` | Live execution status of single step | Scoped to application access | FK to `workflow_executions` | Per-step status, retries, timestamps. |
| `service_decision_policies` | Rules governing approval/rejection | Gov Admin only | FK to `services` | Defines required officer seniority. |
| `application_decisions` | Authoritative human officer rulings | Scoped to application access | FK to `applications`, `employees` | Stores official ACCEPT/RETURN/REJECT with required reason text. |
| `correction_requests` | Action items created upon RETURN | Scoped to application access | FK to `application_decisions` | Structured issue codes and citizen instructions. |
| `ai_case_assistance` | AI summaries and risk assessments | Gov users only | FK to `applications` | **Product Rule 1 Enforced**: Separate from official decisions table. AI cannot write to `application_decisions`. |
| `application_state_history` | Immutable state transition audit log | Scoped to application access | FK to `applications` | Enforced append-only via trigger. Prohibits AI actor from setting APPROVED/REJECTED. |
| `domain_events` | Enterprise asynchronous event stream | System / Gov Admin only | FK to `applications` | Event-driven integration log. |
| `exceptions` | Operational errors, timeouts, conflicts | Gov users only | FK to `applications` | Central exception queue. |
| `audit_events` | Forensic security and activity audit log | Read-only for Gov Admin | System-wide | **Append-Only Trigger Verified**: Prohibits UPDATE and DELETE operations. |
| `notifications` | Realtime notification records | Scoped to recipient | FK to `profiles` / `employees` | In-app notification queue. |
| `physical_card_requests` | Downstream logistics (printing/dispatch) | Scoped to application access | FK to `applications` | Independent from e-PAN generation. |
| `idempotency_keys` | Mutation deduplication records | System only | Scoped to key | Enforces 24-hour expiration. |
| `service_sla_policies` | Target processing times and escalation | Gov Admin only | FK to `services` | SLA warning and breach tracking. |

### Schema Audit Defects & Gaps
1. **[CERTAIN] Hardcoded Service Statuses in SQL Function**: While the schema design claims to be generic for all public services, PostgreSQL function `transition_application_status` (`002_formly_v2_unified_schema.sql:1506-1511`) hardcodes status jumps `PAN_GENERATION` and `PAN_GENERATED`. This couples the generic state machine to the PAN card service.
2. **[CERTAIN] Runtime Database Disconnect**: Despite the V2 schema passing tests in PGlite, the Next.js runtime application does not connect to a live Supabase instance. `src/lib/server/db.ts` queries non-existent Supabase tables with dummy credentials, rendering the database layer completely inoperative at runtime.

---

## 6. Citizen-Side Audit

Detailed evaluation of all citizen capabilities against runtime behavior and code implementation.

| Capability | Verdict | Evidence & Code Reference | Detailed Finding |
|---|---|---|---|
| **Authentication** | ⚠️ **PARTIAL** | `src/app/(auth)/login/page.tsx:30`, `src/lib/server/db.ts:144` | Form submits credentials to `/api/auth/login`. Uses PBKDF2 with SHA-512 and random salt. However, runtime hangs when attempting to query Supabase `users` table due to placeholder credentials. |
| **Dashboard** | ⚠️ **PARTIAL** | `src/app/dashboard/page.tsx`, `src/lib/store/formly-store.tsx:60` | Modern, responsive dashboard layout. Computes profile completeness and readiness summary. However, application counts are partially derived from static constants or local storage. |
| **Profile** | ⚠️ **PARTIAL** | `src/app/profile/page.tsx`, `src/app/api/profile/route.ts:27` | Supports viewing and editing personal, academic, and financial fields. However, API PATCH updates fail because `authenticateSession` cannot verify the cookie against unreachable Supabase. Changes fallback to `localStorage`. |
| **Documents** | ⚠️ **PARTIAL** | `src/app/documents/page.tsx`, `src/app/api/documents/route.ts` | Upload UI provides drag-and-drop and document preview. However, binary files are never stored in blob/object storage; only metadata is retained in client state. |
| **OCR** | ❌ **FAIL** | `src/lib/ocr/ocr-engine.ts:14-52` | **Completely Fake**: Does not parse uploaded file bytes. Determines document type solely by matching filename substrings (`filename.includes("aadhaar")`), pauses for 1800ms, and returns hardcoded profile fields for "Sai Sankeerth". |
| **Requirements** | ✅ **PASS** | `src/lib/store/formly-store.tsx:480-550`, `src/app/checklist/page.tsx` | Robust client-side engine evaluates required documents and profile attributes against service definitions, computing readiness percentage and actionable missing items. |
| **Application Submission** | ❌ **FAIL** | `src/components/dashboard/ApplyPanModal.tsx:55`, `src/app/api/gov/applications/route.ts:7` | **Critical Blocker**: Citizen modal submits to `/api/gov/applications`. That endpoint enforces `validateGovSession`, rejecting citizens with HTTP 401 Unauthorized. Citizens cannot submit applications. |
| **Consent** | ⚠️ **PARTIAL** | `src/components/dashboard/ApplyPanModal.tsx:63`, `supabase/migrations/002_formly_v2_unified_schema.sql:410` | UI contains consent checkboxes outlining purpose and data sharing. SQL schema defines `consent_requests` and `consent_scopes`. However, runtime submission fails before consent is persisted to DB. |
| **Live Status** | ❌ **FAIL** | `src/app/track/[id]/page.tsx:48`, `src/app/api/track/[id]/route.ts:31` | **Critical Blocker**: Tracker calls `/api/track/[id]`, which checks `app.citizen_user_id !== user.id`. Because `PanApplicationRecord` uses `userId`, the check evaluates to `undefined !== user.id` and permanently returns HTTP 403 Forbidden. |
| **Notifications** | ✅ **PASS** | `src/app/notifications/page.tsx`, `src/lib/store/formly-store.tsx:70` | Clean in-app notification center displaying document expiration notices, readiness alerts, and security events with read/unread toggle and category filtering. |
| **Correction** | ❌ **FAIL** | `src/app/api/track/[id]/resubmit/route.ts:31`, `src/app/track/[id]/page.tsx:82` | **Critical Blocker**: Resubmitting corrections calls `/api/track/[id]/resubmit`, which suffers from the exact same `citizen_user_id` property mismatch bug, rejecting citizen fixes with HTTP 403 Forbidden. |
| **AI Assistant** | ⚠️ **PARTIAL** | `src/components/assistant/AutofillAssistant.tsx`, `src/lib/knowledge/government-schemes-knowledge.ts` | Comprehensive procurement guides and FAQ intelligence for NSP scholarships and certificates. However, operates purely as a static rule-based knowledge widget without generative reasoning. |
| **UX & Usability** | ⚠️ **PARTIAL** | `src/app/dashboard/page.tsx`, `src/components/layout/Sidebar.tsx` | Visually exceptional SaaS-grade aesthetic. However, broken links, submission 401 errors, and permanent 403 tracker screens degrade the actual end-to-end user experience. |
| **Security** | ❌ **FAIL** | `src/middleware.ts:24-32` | Sensitive citizen routes (/dashboard, /vault, /documents) can be accessed anonymously without middleware redirection. |

---

## 7. Government-Side Audit

Evaluation of all government operational functions across role-based views, queue management, case workspaces, and administrative tooling.

| Capability | Verdict | Evidence & Code Reference | Detailed Finding |
|---|---|---|---|
| **Authentication** | ❌ **FAIL** | `src/app/gov/login/page.tsx:18,35` | **Syntax Error**: The login page fails to compile due to `Cannot find name 'setIsLoggingIn'`. State variable is named `isLoggingIn` while setter is `setIsLoading`. |
| **RBAC Enforcement** | ⚠️ **PARTIAL** | `src/lib/server/auth.ts:26`, `src/lib/store/gov-store.tsx:13-44` | Pre-configured profiles for OFFICER, DEPT_ADMIN, and SYS_ADMIN exist. `validateGovSession` verifies presence of "Officer" or "Admin" string in role. However, there is no enforcement of departmental boundary or case assignment. |
| **Dashboard** | ✅ **PASS** | `src/app/gov/page.tsx`, `src/components/gov/GovernmentShell.tsx` | Executive overview showing total applications, pending verifications, review count, exceptions, and live status distribution with priority indicators. |
| **Queue Management** | ✅ **PASS** | `src/app/gov/queue/page.tsx` | Multi-tabbed queue with filtering by status, priority, stage, and full-text search. Displays SLA deadlines and warning indicators. |
| **Officer Assignments** | ⚠️ **PARTIAL** | `src/app/gov/queue/page.tsx`, `src/app/api/gov/applications/[id]/route.ts` | "My Assignments" tab filters applications by assigned officer ID. However, any officer can execute decisions on applications assigned to other officers without restriction. |
| **Application Workspace** | ⚠️ **PARTIAL** | `src/app/gov/workspace/[id]/page.tsx` | Comprehensive case console displaying applicant details, verified documents, cross-system validation diffs, audit history, and decision action bar. However, the interface is hardcoded exclusively for PAN applications. |
| **Verification Center** | ✅ **PASS** | `src/app/gov/workspace/[id]/page.tsx:280-350`, `src/lib/server/data-mapper.ts` | Displays field-by-field verification checks comparing citizen input against simulated registry data with match/conflict badges. |
| **Decision Flow** | ⚠️ **PARTIAL** | `src/app/gov/workspace/[id]/page.tsx:140-220`, `src/app/api/gov/applications/[id]/route.ts:60` | Modal dialogs enforce mandatory reason text for RETURN and REJECT decisions. However, PATCH endpoint directly executes updates without checking assigned reviewer. |
| **Return for Correction** | ⚠️ **PARTIAL** | `src/lib/server/db.ts:564-605`, `src/app/api/gov/applications/[id]/route.ts:70` | Backend stores official decision and inserts `correction_requests`. However, the downstream citizen resubmission flow is blocked by the 403 authorization bug. |
| **Rejection Handling** | ✅ **PASS** | `src/lib/server/db.ts:635-660`, `src/app/gov/workspace/[id]/page.tsx:180` | Enforces mandatory rejection reason, logs audit record, and updates application status to `REJECTED`. |
| **Acceptance / Approval** | ⚠️ **PARTIAL** | `src/lib/server/db.ts:528-562`, `src/app/gov/workspace/[id]/page.tsx:145` | Transitions application to `APPROVED`. However, bypasses the PostgreSQL state machine function `transition_application_status` and updates column directly. |
| **Exception Center** | ✅ **PASS** | `src/app/gov/exceptions/page.tsx`, `src/types/government.ts:162` | Dedicated management console for API timeouts, schema mismatches, and data conflicts with retry buttons and resolution workflows. |
| **Interoperability Hub** | ✅ **PASS** | `src/app/gov/interoperability/page.tsx`, `src/lib/server/connectors.ts` | Realtime health and latency monitor for 5 simulated government connectors (UIDAI, ITD, Digilocker, NSP, NSDL). |
| **Data Mapper** | ✅ **PASS** | `src/app/gov/data-mapper/page.tsx`, `src/lib/server/data-mapper.ts` | Live transformation testing workbench showing system schemas, canonical fields, and transformation results with side-by-side JSON diffs. |
| **Workflow Engine** | ⚠️ **PARTIAL** | `src/app/gov/workflows/page.tsx` | Visualizes multi-stage DAG workflows with step SLA, automated vs human execution flags, and retry counters. However, actual runtime execution is driven by hardcoded mock steps. |
| **Audit Center** | ⚠️ **PARTIAL** | `src/app/gov/audit/page.tsx`, `src/app/api/gov/audit/route.ts:17` | High-density audit trail table with actor, action, source, target, timestamp, and request ID. Route handler contains TypeScript type error due to unawaited Promise. |
| **System Monitoring** | ✅ **PASS** | `src/app/gov/monitoring/page.tsx` | Administrator console with infrastructure uptime, memory usage, request volume, error rates, and department throughput metrics. |
| **SLA Tracking** | ✅ **PASS** | `src/app/gov/monitoring/page.tsx`, `src/app/gov/queue/page.tsx` | Color-coded SLA indicators (NORMAL, NEARING_BREACH, BREACHED) dynamically calculated based on target resolution deadlines. |

---

## 8. Role Isolation Audit

Rigorous verification of cross-role boundaries and URL tampering protection.

| Scenario | Tested Path | Expected Behavior | Actual Behavior | Verdict & Evidence |
|---|---|---|---|---|
| **Citizen → Government** | Citizen session navigating to `/gov` | Immediate redirect to `/dashboard` with 403 / access denied flag | Middleware redirects to `/dashboard?access_denied=government_interface_restricted` | ✅ **PASS** (`src/middleware.ts:25-31`) |
| **Government → Citizen** | Government session navigating to `/dashboard` | Immediate redirect to `/gov` with access denied flag | Middleware redirects to `/gov?access_denied=citizen_portal_restricted_for_employees` | ✅ **PASS** (`src/middleware.ts:35-41`) |
| **Officer → Wrong Department** | CBDT Officer navigating to MeitY application | Access denied (403 Forbidden) | **No Check**: API returns application data; officer can mutate case | ❌ **FAIL** (`src/app/api/gov/applications/[id]/route.ts:20`) |
| **Admin → Unauthorized Resource** | Dept Admin accessing Sys Admin monitoring | Denied unless user has `SYS_ADMIN` role | UI hides tabs based on role, but API endpoint does not verify specific admin tier | ⚠️ **PARTIAL** (`src/lib/store/gov-store.tsx:68`) |
| **Anonymous → Government Route** | Unauthenticated user visiting `/gov` | Immediate redirect to `/gov/login` | **Critical Bypass**: Middleware returns HTTP 200; page renders with default mock state | ❌ **FAIL** (`src/middleware.ts:24-32`) |
| **Anonymous → Citizen Route** | Unauthenticated user visiting `/dashboard` | Immediate redirect to `/login` | Middleware passes request; `AppLayoutShell` renders loading spinner or null | ⚠️ **PARTIAL** (`src/middleware.ts:14-22`, `AppLayoutShell.tsx:50`) |

---

## 9. State Machine Audit

### Discovered State Machine Architecture
The application possesses two state machine representations:
1. **Database Level (`supabase/migrations/002_formly_v2_unified_schema.sql:1450-1528`):** Implements `transition_application_status(p_application_id, p_to_status, p_actor_id, p_actor_type, p_reason)`.
2. **TypeScript / API Level (`src/lib/server/db.ts:528-765`):** Ad-hoc async functions updating status strings directly via Supabase client.

### Valid Transitions (Defined in PostgreSQL Schema)
```text
DRAFT
  └──► SUBMITTED, CANCELLED

SUBMITTED
  └──► VALIDATING, CANCELLED

VALIDATING
  └──► CONSENT_REQUIRED, CONSENT_VERIFIED, VERIFICATION_IN_PROGRESS, MANUAL_REVIEW, SYSTEM_ERROR, CANCELLED

CONSENT_REQUIRED
  └──► CONSENT_VERIFIED, CANCELLED

CONSENT_VERIFIED
  └──► VERIFICATION_IN_PROGRESS, CANCELLED

VERIFICATION_IN_PROGRESS
  └──► VERIFIED, VERIFICATION_FAILED, CONFLICT_DETECTED, MANUAL_REVIEW, API_UNAVAILABLE, RETRY_PENDING

API_UNAVAILABLE
  └──► RETRY_PENDING, VERIFICATION_IN_PROGRESS, MANUAL_REVIEW

RETRY_PENDING
  └──► VERIFICATION_IN_PROGRESS, MANUAL_REVIEW, SYSTEM_ERROR

VERIFIED
  └──► GOVERNMENT_PROCESSING, DEPARTMENT_ASSIGNED, CONFLICT_DETECTED, MANUAL_REVIEW

GOVERNMENT_PROCESSING
  └──► DEPARTMENT_ASSIGNED, OFFICE_ASSIGNED, OFFICER_ASSIGNED, OFFICER_REVIEW, APPROVED, MANUAL_REVIEW

OFFICER_ASSIGNED
  └──► OFFICER_REVIEW

OFFICER_REVIEW
  └──► APPROVED, REJECTED, RETURNED_FOR_CORRECTION, OFFICER_ASSIGNED

RETURNED_FOR_CORRECTION
  └──► REVALIDATION, SUBMITTED, CANCELLED

REVALIDATION
  └──► VERIFICATION_IN_PROGRESS, OFFICER_REVIEW, GOVERNMENT_PROCESSING

APPROVED
  └──► PAN_GENERATION, COMPLETED

PAN_GENERATION
  └──► PAN_GENERATED, SYSTEM_ERROR

PAN_GENERATED
  └──► COMPLETED
```

### Invalid Transitions Possible in Runtime
1. **Direct Status Jump in TypeScript API**: `officerAcceptApplication` in `src/lib/server/db.ts:538` directly executes `.update({ status: 'APPROVED' })`. If invoked on an application currently in `DRAFT` or `VERIFICATION_FAILED`, the update succeeds because it does not execute the SQL transition function.
2. **Citizen Resubmission Jump**: `citizenResubmitCorrection` (`src/lib/server/db.ts:741`) directly sets `status = 'REVALIDATION'` without verifying that the current status is `RETURNED_FOR_CORRECTION`.

### Missing Transitions
- **Generic Service Completion**: The state machine has no legal path from `APPROVED` to `COMPLETED` for non-PAN services without going through `PAN_GENERATION` (`002_formly_v2_unified_schema.sql:1507`).

---

## 10. Return / Correction Audit

End-to-end trace of the return-for-correction workflow.

```text
Officer Review ──► RETURN Decision ──► Correction Request ──► Citizen Notification
      │                   │                    │                      │
   [PASS]              [PASS]               [PASS]                 [PASS]
                          │                    │                      │
                          ▼                    ▼                      ▼
Officer Queue ◄── Revalidation ◄── Citizen Resubmit ◄── Citizen Views Reason
      │                │               │                      │
   [FAIL]           [FAIL]          [FAIL]                 [FAIL]
```

1. **Officer Invokes Return:** ✅ **PASS**. In `src/app/gov/workspace/[id]/page.tsx:160`, the officer enters mandatory return remarks and submits.
2. **Official Reason Persisted:** ✅ **PASS**. `src/lib/server/db.ts:573` inserts record into `application_decisions` with `reason_text` and `correction_possible = true`.
3. **Correction Request Created:** ✅ **PASS**. `src/lib/server/db.ts:591` creates an entry in `correction_requests` with `status = 'OPEN'`.
4. **Citizen Notification Dispatched:** ✅ **PASS**. Database trigger creates in-app notification for the applicant.
5. **Citizen Views Return Reason:** ❌ **FAIL**. The citizen navigates to `/track/[id]`, but `src/app/api/track/[id]/route.ts:31` returns HTTP 403 Forbidden due to the `citizen_user_id` bug. The citizen cannot read the return remarks.
6. **Citizen Submits Correction:** ❌ **FAIL**. The resubmit form calls `/api/track/[id]/resubmit`, which also fails with HTTP 403 Forbidden (`src/app/api/track/[id]/resubmit/route.ts:31`).
7. **Application Revalidation:** ❌ **FAIL**. Because resubmission is rejected at the API layer, the application never enters `REVALIDATION` status.
8. **Officer Re-review:** ❌ **FAIL**. Officer queue never receives updated data.

---

## 11. Rejection Audit

End-to-end trace of the official rejection lifecycle.

```text
Officer Review ──► REJECT Decision ──► Mandatory Reason ──► Audit Event ──► Citizen Notification ──► Workflow Closed
      │                   │                    │                  │                   │                    │
   [PASS]              [PASS]               [PASS]             [PASS]              [FAIL]               [PASS]
```

1. **Officer Rejection Action:** ✅ **PASS**. `src/app/gov/workspace/[id]/page.tsx:180` presents a prominent modal requiring confirmation and reason.
2. **Mandatory Reason Enforced:** ✅ **PASS**. Form cannot be submitted without text; API rejects empty reasons with HTTP 400 (`src/app/api/gov/applications/[id]/route.ts:86`).
3. **Audit Event Recorded:** ✅ **PASS**. `src/lib/server/db.ts:646` writes an append-only audit event with `action = 'REJECT'`, recording officer ID and timestamp.
4. **State Transition to REJECTED:** ✅ **PASS**. Status is updated to `REJECTED`; subsequent state transitions are blocked by the transition matrix.
5. **Citizen Notification:** ❌ **FAIL**. Citizen tracking page returns HTTP 403 Forbidden, preventing the citizen from viewing official rejection reasons or explanation.
6. **Workflow Termination:** ✅ **PASS**. The application is archived and cannot be reopened or advanced by external events.

---

## 12. AI Safety Audit

Inventory of all AI components and risk classifications.

| Feature / Location | Input Data | Provider / Model | Classification | Failure / Risk Analysis |
|---|---|---|---|---|
| **AI Case Assistance** (`src/app/gov/workspace/[id]/page.tsx:505`) | Applicant data, document match scores | Static Mock (`pan-initial-data.ts`) | 🟢 **SAFE** | Hardcoded summary. Explanations do not mutate data. Prohibited from setting `APPROVED`/`REJECTED` via DB trigger (`002_schema.sql:1164`). |
| **Readiness Assistant** (`src/components/assistant/AutofillAssistant.tsx`) | Static scheme rules, FAQs | Rule-based (`government-schemes-knowledge.ts`) | 🟢 **SAFE** | Curated guidance; no hallucinations or unauthorized decisions. |
| **Synthetic OCR Engine** (`src/lib/ocr/ocr-engine.ts`) | Uploaded filename string | None (Simulated regex) | 🟡 **RISKY** | Hallucinates realistic citizen PII (Aadhaar, income figures) from empty files. Misleads users into believing real OCR took place. |
| **Autonomous Portal Autofill** (`src/app/api/agent/launch-headed/route.ts`, `scripts/run-live-agent.mjs`) | Live DOM on Protean portal, mock Aadhaar (`5492 8173 9012`) | Playwright headed agent | 🔴 **CRITICAL** | Automated submission against real sovereign PAN registration portal. Severe compliance and legal risk. |

---

## 13. Security Audit

Comprehensive security analysis categorized by severity.

### CRITICAL Severity Findings
1. **Anonymous Authentication Bypass in Middleware**
   - **Location:** `src/middleware.ts:24-32`
   - **Evidence:** `if (citizenSession && !govSession)` allows anonymous visitors (`!citizenSession && !govSession`) through to `/gov`. Confirmed by live HTTP test returning HTTP 200 without cookies.
   - **Impact:** Complete exposure of internal government queues, citizen PII, and case workspaces to unauthenticated web crawlers and attackers.
   - **Recommended Fix:** Change condition to require valid `govSession` on all `/gov/*` routes: `if (isGovRoute && !isGovLogin && !govSession) { return NextResponse.redirect('/gov/login'); }`.

2. **Automated Live Portal Scraping with Fabricated Identity**
   - **Location:** `scripts/run-live-agent.mjs:40`, `src/app/api/agent/launch-headed/route.ts:57`
   - **Evidence:** Code launches visible Chromium against `https://onlineservices.proteantech.in/paam/endUserRegisterContact.html` and populates real form fields with made-up Aadhaar `5492 8173 9012`.
   - **Impact:** Potential violation of Section 66D of Information Technology Act and UIDAI Aadhaar Regulations; risks IP blacklisting of host system.
   - **Recommended Fix:** Delete `scripts/run-live-agent.mjs` and `src/app/api/agent/launch-headed` entirely.

3. **Citizen Lockout from Tracking & Resubmission (403 IDOR Bug)**
   - **Location:** `src/app/api/track/[id]/route.ts:31`, `src/app/api/track/[id]/resubmit/route.ts:31`
   - **Evidence:** Code compares `app.citizen_user_id !== user.id`. In `PanApplicationRecord` (`src/types/government.ts:91`), property is named `userId`. Therefore, `app.citizen_user_id` is `undefined`.
   - **Impact:** Citizens are permanently blocked from viewing their application status or resubmitting corrections.
   - **Recommended Fix:** Change property access to `app.userId !== user.id`.

### HIGH Severity Findings
1. **Broken Authorization in Government Mutation API**
   - **Location:** `src/app/api/gov/applications/[id]/route.ts:47-117`
   - **Evidence:** Any authenticated employee with a government session can approve, reject, or return applications across any department or office, regardless of assignment.
   - **Impact:** CBDT officers can approve MeitY applications; unassigned officers can override assigned reviewers.
   - **Recommended Fix:** Verify that `auth.user.id === app.assignedOfficerId` or user possesses `DEPT_ADMIN` / `SYS_ADMIN` role for that specific department.

2. **Overprivileged Browser Extension Manifest**
   - **Location:** `extension/manifest.json:12`
   - **Evidence:** Requests `<all_urls>` host permission and runs content scripts on every web domain visited by the user.
   - **Impact:** Malicious script injection or credential harvesting vulnerability across arbitrary websites.
   - **Recommended Fix:** Restrict host permissions to explicit trusted staging domains or remove extension.

### MEDIUM Severity Findings
1. **Simulated State Updates Bypass Database Constraints**
   - **Location:** `src/lib/server/db.ts:538`
   - **Evidence:** TypeScript API performs raw `applications.update({ status })` rather than calling stored procedure `transition_application_status`.
   - **Impact:** State machine rules defined in PostgreSQL are completely bypassed when invoked from Node.js runtime.
   - **Recommended Fix:** Invoke `supabaseAdmin.rpc('transition_application_status', ...)`.

2. **Client-Side Secret Exposure Risk via Environment Files**
   - **Location:** `src/lib/server/supabase.ts:4`, `.env.local:12`
   - **Evidence:** `SUPABASE_SERVICE_ROLE_KEY` is loaded on server, but placeholder values in `.env.local` cause silent runtime failures without loud startup validation.
   - **Impact:** Silent degradation of server security into failing mock calls.
   - **Recommended Fix:** Add environment variable validation in Next.js initialization.

### LOW Severity Findings
1. **Unawaited Promises in Route Handlers**
   - **Location:** `src/app/api/documents/[id]/route.ts:28`, `src/app/api/gov/audit/route.ts:17`, `src/app/api/gov/exceptions/route.ts:15`
   - **Evidence:** Route handlers call async database functions without `await`, returning empty responses or compiler warnings.
   - **Impact:** API endpoints return incomplete data structures.
   - **Recommended Fix:** Prefix database calls with `await`.

---

## 14. Privacy Audit

Assessment of sensitive data handling, storage, and PII protection against the Digital Personal Data Protection (DPDP) Act 2023.

- **Aadhaar Data Handling:**
  - In `src/lib/ocr/ocr-engine.ts:48` and `scripts/run-live-agent.mjs:15`, unmasked 12-digit Aadhaar numbers (`5492 8173 9012`) are hardcoded in source files.
  - While PostgreSQL V2 schema implements masked storage rules, client-side `localStorage` caches raw personal details (`fullName`, `phone`, `email`, `address`) in plaintext under `seva_saarthi_data_<userId>`.
- **Bank Account & Financial Records:**
  - Bank account numbers (`38491029481`) and IFSC codes (`SBIN0012948`) are stored unencrypted in browser local storage.
- **Raw API Payloads:**
  - `002_formly_v2_unified_schema.sql` complies with Product Rule 7 by excluding sensitive payloads from `connector_requests` by default.
  - However, in `src/app/api/gov/data-mapper/route.ts`, raw unmasked test payloads are logged to console.

---

## 15. Interoperability Audit

Review of external government connectors and canonical schema translation.

- **Connector Architecture:**
  - Located in `src/lib/server/connectors.ts` and `src/app/gov/interoperability/page.tsx`.
  - 5 connectors are defined:
    1. **UIDAI Identity Registry** (e-KYC biometric and demographic verification).
    2. **Income Tax Department (CBDT)** (PAN verification & issuance).
    3. **DigiLocker Ecosystem** (Document authenticity check).
    4. **National Scholarship Portal (NSP)** (Academic eligibility verification).
    5. **NSDL / Protean Processing Hub** (e-Sign and physical card dispatch).
- **Simulation Reality:**
  - All 5 connectors operate in simulated mode with synthetic latency (120ms to 450ms) and configurable error rates. No live sovereign APIs are invoked.
- **Data Mapper Engine:**
  - Located in `src/lib/server/data-mapper.ts`.
  - Implements bi-directional mapping from disparate department schemas (`UIDAI_KYC`, `INCOME_TAX_PAN`, `DIGILOCKER_DOC`) into a canonical schema (`dateOfBirth`, `fullName`, `mobileNumber`, `permanentAddress`).
  - Cross-system validation engine successfully detects discrepancies (such as DOB mismatch between Aadhaar and PAN application) and flags them for manual review without automated override.

---

## 16. Workflow Audit

Review of workflow orchestration, execution, and state persistence.

- **DAG Engine:**
  - `002_formly_v2_unified_schema.sql` defines `workflow_definitions`, `workflow_steps`, `workflow_transitions`, and `workflow_executions`.
  - PAN workflow defines 8 sequential steps:
    1. `STEP_SUBMIT` (Automated)
    2. `STEP_PREFLIGHT_VAL` (Automated, 10m SLA)
    3. `STEP_CONSENT_CHK` (Automated, 5m SLA)
    4. `STEP_INTEROP_VERIF` (Automated, 30m SLA)
    5. `STEP_CROSS_VAL` (Automated, 15m SLA)
    6. `STEP_OFFICER_REV` (Human Review, 4h SLA)
    7. `STEP_PAN_GEN` (Automated, 15m SLA)
    8. `STEP_PHYSICAL_DISPATCH` (Automated Logistics, 24h SLA)
- **Runtime Execution:**
  - In the current Next.js runtime, workflow advancement is simulated via `advancePhysicalPipelineStage()` in `db.ts`. Background workers and cron jobs for automatic advancement are absent.

---

## 17. Failure / Retry Audit

Behavior of the system under operational failure conditions.

| Failure Mode | Expected Architectural Handling | Observed Runtime Behavior | Verdict |
|---|---|---|---|
| **API Timeout / Connector Offline** | Application transitions to `API_UNAVAILABLE`, marks check pending, queues retry | `PAN-2026-0002` correctly renders in `API_UNAVAILABLE` status. Officer workspace displays "Retry Verification" button | ✅ **PASS** |
| **500 Server Error** | Application transitions to `SYSTEM_ERROR`, logs exception | Unhandled exceptions cause Next.js error boundary; status is not automatically persisted to DB | ⚠️ **PARTIAL** |
| **Malformed Response Payload** | Data Mapper rejects schema, flags `DATA_CONFLICT` | Data mapper validates against schema and creates an entry in `exceptions` table | ✅ **PASS** |
| **Duplicate Submission / Double Click** | Idempotency key blocks duplicate record creation | `idempotency_keys` table exists in V2 schema. However, API route does not enforce `Idempotency-Key` HTTP header | ⚠️ **PARTIAL** |
| **Connector Exhaustion / Permanent Fail** | Escalates to `MANUAL_REVIEW` with notification to Admin | Exception queue logs failure; manual resolve button allows officer override | ✅ **PASS** |

---

## 18. Performance Audit

Analysis of client and server performance characteristics.

- **Aggressive Client Polling:**
  - In `src/app/track/[id]/page.tsx:67`, the citizen tracker polls `/api/track/[id]` every 3.5 seconds unconditionally. This generates 1,028 HTTP requests per hour per open browser tab.
- **Uncached Database Client:**
  - `src/lib/server/db.ts` re-executes full queries on each request without Redis or in-memory caching.
- **Large Frontend Bundles:**
  - Heavy icon library imports (`lucide-react` with dozens of dynamic imports) and embedded base64 SVG assets in `government-schemes-knowledge.ts` inflate the initial client JavaScript bundle size.

---

## 19. UX Audit

Comprehensive usability evaluation across interfaces.

- **Citizen Experience Score: 5.5 / 10**
  - *Positives:* Clear readiness progress bars, elegant visual design, helpful FAQ tooltips.
  - *Negatives:* Application submission silently crashes or displays error toasts; live tracker page shows permanent 403 error; tracking UI is hardcoded for PAN rather than generic services.
- **Government Experience Score: 7.5 / 10**
  - *Positives:* Superb command center layout, clear queue filters, structured comparison of citizen data against government registries, strict mandatory reason modals for returns and rejections.
  - *Negatives:* Hardcoded to PAN processing; duplicate routes (`/gov` vs `/government`) cause confusion.
- **Accessibility Score: 6.0 / 10**
  - *Positives:* Good color contrast across dark and light themes; responsive viewport support.
  - *Negatives:* Missing ARIA labels on icon buttons; modal traps lack focus locking; screen readers cannot navigate multi-step canvas workflows.

---

## 20. SIH Evaluation

Comprehensive evaluation against the 10 official Smart India Hackathon criteria (Scored out of 100).

| Criterion | Max Score | Awarded Score | Justification & Detailed Evidence |
|---|---|---|---|
| **1. Novelty** | 10 | **7** | Integrating citizen pre-flight readiness checks with a synchronized government officer operations console, data mapper, and consent manager is highly novel for SIH. However, reliance on browser scraping anti-patterns reduces novelty score. |
| **2. Complexity** | 10 | **6** | The V2 PostgreSQL schema demonstrates high complexity (42 tables, RLS, triggers, DAG workflows). However, actual runtime complexity is broken due to disconnected APIs and 28 compiler errors. |
| **3. Clarity and Details** | 10 | **7** | UI details are rich (SLA deadlines, document audit diffs, stage timelines). Penalized due to dual branding (Formly vs Seva Saarthi) and duplicate routing trees. |
| **4. Feasibility** | 10 | **5** | Digital locker and pre-flight validation are highly feasible. However, live scraping of government portals is legally and technically infeasible for production deployment. |
| **5. Practicability** | 10 | **5** | Pre-flight verification solves a real administrative problem (80% rejection rate). However, the prototype cannot be demonstrated live without crashing due to 401 submission errors and 403 tracking locks. |
| **6. Sustainability** | 10 | **6** | PostgreSQL schema is well normalized and extensible. Code sustainability is compromised by lack of CI/CD, broken test suites (`npm test` fails), and absence of automated unit tests. |
| **7. Scale of Impact** | 10 | **7** | Eliminating paperwork errors across welfare schemes could benefit tens of millions of citizens. However, hardcoding the tracker to PAN limits multi-scheme scalability. |
| **8. User Experience** | 10 | **6** | Visually attractive Tailwind design, but severely degraded by non-functional submission buttons and broken tracker views. |
| **9. Future Progression** | 10 | **7** | Clear roadmap toward India Stack (DigiLocker, API Setu, Account Aggregator). Architecture can transition cleanly once runtime bugs are addressed. |
| **10. Presentation** | 10 | **8** | Outstanding visual polish, executive dashboards, and case workspace screens that look convincing during a slide/demo pitch. |
| **TOTAL** | **100** | **64 / 100** | **Solid Architectural Foundation Severely Undermined by Runtime Execution Failures.** |

---

## 21. End-to-End Scenario Results

Trace of all 7 mandatory test workflows.

| Scenario | Expected Workflow | Actual Runtime Outcome | Status | Blocking Issue & Location |
|---|---|---|---|---|
| **1. Citizen Success** | Login → Discover → Requirements → Submit → Verification → Officer Accept → Outcome | Submission fails immediately with HTTP 401 Unauthorized | ❌ **FAIL** | `ApplyPanModal.tsx:55` calls `/api/gov/applications`, which enforces `validateGovSession`. |
| **2. Missing Information** | Starts application → Missing doc highlighted → Citizen uploads → Revalidated | Handled in client memory; however, server resolve endpoint fails to compile | ⚠️ **PARTIAL** | Missing export `markRequirementResolvedForUser` in `src/lib/server/db.ts:377`. |
| **3. Officer Return** | Officer reviews → Returns with reason → Citizen notified → Citizen fixes → Revalidation | Officer return succeeds in DB; Citizen tracker fails with HTTP 403 Forbidden | ❌ **FAIL** | Property mismatch `citizen_user_id` in `src/app/api/track/[id]/route.ts:31`. |
| **4. Officer Reject** | Officer reviews → Rejects with reason → Citizen notified → Workflow closed | Rejection updates DB; Citizen tracker blocked by HTTP 403 | ⚠️ **PARTIAL** | Property mismatch `citizen_user_id` in `src/app/api/track/[id]/route.ts:31`. |
| **5. Verification Conflict** | Cross-system data mismatch detected → Manual review queued → No AI override | Mismatch flagged; application held in manual review queue; AI prevented from override | ✅ **PASS** | Correctly implemented in `src/lib/server/data-mapper.ts` and `pan-initial-data.ts`. |
| **6. API Failure** | Connector timeout → Application marked API_UNAVAILABLE → Retry queued | Application marked unavailable; retry button available; auto-retry worker missing | ⚠️ **PARTIAL** | No background scheduler/worker for automatic retries. |
| **7. Unauthorized Access** | Citizen accessing `/gov` blocked; Officer accessing other dept blocked; Anon blocked | Citizen blocked from gov; Officer can mutate any dept; Anonymous bypasses middleware | ❌ **FAIL** | `src/middleware.ts:24-32` allows anonymous visitors; API lacks department check. |

---

## 22. Misleading Claims

Audit of deceptive, inaccurate, or unsubstantiated claims across code, documentation, and user interfaces.

| Claimed Text | File Location | Why Misleading | Severity | Recommended Correction |
|---|---|---|---|---|
| "Direct Government State Machine Integration" | `src/app/track/[id]/page.tsx:260` | The state machine is an internal PostgreSQL function or local mock; there is no direct connection to sovereign government servers. | HIGH | Change to "Demonstration State Machine Engine (SIH Simulation)". |
| "Live UIDAI Aadhaar 2.5 API" | `src/app/track/[id]/page.tsx:374` | No live connection to UIDAI exists. Demographics are compared against simulated in-memory records. | HIGH | Change to "Simulated UIDAI Verification Connector". |
| "Application successfully submitted to Government of India portal!" | `src/app/api/agent/autofill/route.ts:31` | No external submission occurred. The API fabricated a fake application number. | CRITICAL | Remove deceptive success text; state clearly that submission is simulated. |
| "National e-Governance Division (NeGD) Infrastructure" | `src/lib/server/connectors.ts:32`, `gov-store.tsx:40` | Presents the application as official MeitY/NeGD infrastructure without authorization. | HIGH | Relabel as "Academic Prototype Environment". |
| `OCR_PROVIDER=tesseract` | `.env.local:17` | Tesseract is never executed. OCR engine matches file names against regex strings. | MEDIUM | Update `.env.local` to reflect actual mock engine or wire real Tesseract worker. |

---

## 23. Hardcoded / Fake Functionality

Comprehensive catalog of synthetic, simulated, or mocked behaviors.

1. **Fake Statuses:** Application statuses in `src/app/track/[id]/page.tsx` are driven by static seed data (`PAN-2026-0001`) and simulated timers rather than live backend webhooks.
2. **Fake Statistics:** Dashboard statistics (`completedApplications: 7`, `activeApplications: 3`) in `formly-store.tsx:60` are hardcoded constants.
3. **Fake OCR Engine:** `src/lib/ocr/ocr-engine.ts` does not read file bytes; returns pre-canned text for "Sai Sankeerth".
4. **Fake AI Assistant:** All AI case summaries in `src/app/gov/workspace/[id]/page.tsx` are static strings from `pan-initial-data.ts`.
5. **Fake External Connectors:** All 5 connectors in `src/lib/server/connectors.ts` simulate latency using `setTimeout` and return synthetic responses.
6. **Fake Realtime Updates:** Implemented via 3.5s `setInterval` HTTP polling instead of true WebSocket / Supabase Realtime streams.
7. **Hardcoded PAN Service Flows:** The tracking interface (`/track/[id]`) and officer workspace (`/gov/workspace/[id]`) are hardcoded exclusively to PAN Card (Form 49A).
8. **Demo Reset Route:** `/api/gov/reset` restores hardcoded mock objects in memory.

---

## 24. Critical Findings (Blockers)

1. **[CERTAIN] Anonymous Middleware Access to Government Operations:** Unauthenticated users can access `/gov`, `/gov/queue`, and `/gov/workspace/*` due to flawed boolean check in `src/middleware.ts:24-32`.
2. **[CERTAIN] Citizen Application Submission Blocked (401 Unauthorized):** `ApplyPanModal.tsx:55` posts to officer-only endpoint `/api/gov/applications`.
3. **[CERTAIN] Citizen Application Tracker Broken (403 Forbidden):** Property mismatch `app.citizen_user_id` vs `app.userId` in `src/app/api/track/[id]/route.ts:31` and `/resubmit/route.ts:31`.
4. **[CERTAIN] Supabase Database Runtime Disconnect:** `src/lib/server/db.ts` queries non-existent Supabase endpoint `https://your-project-ref.supabase.co`, causing network timeouts.
5. **[CERTAIN] 28 TypeScript Build Compilation Errors:** Syntax and type errors in `src/app/gov/login/page.tsx`, `src/lib/server/db.ts`, and route handlers prevent production build.
6. **[CERTAIN] Unsafe Live Portal Browser Scraping:** `scripts/run-live-agent.mjs` automates real Protean registration portal with fake Aadhaar credentials.

---

## 25. High Priority Findings (Major Issues)

1. **[CERTAIN] Broken Test Suite (`npm test` fails):** Assertion failure in `scripts/test-gov-pipeline.mjs` due to unawaited async call.
2. **[CERTAIN] Duplicate Government Routing Hierarchy:** Redundant route trees under `/gov` and `/government` create maintenance debt.
3. **[CERTAIN] Deceptive Sovereign Claims in UI:** Badges claiming live UIDAI 2.5 API and Direct State Machine Integration violate SIH evaluation integrity.
4. **[CERTAIN] Zero OCR Byte Processing:** Filename-based mock parser creates false illusion of functional document intake.
5. **[CERTAIN] Lack of Cross-Department RBAC Scoping:** Any government officer can approve cases belonging to any department.

---

## 26. Medium Priority Findings (Non-Blocking)

1. **Hardcoded PAN Architecture in State Machine:** SQL transition function hardcodes `PAN_GENERATION` status.
2. **Polling Overhead:** Tracker executes HTTP GET requests every 3.5 seconds.
3. **Client-Side Secret Exposure:** `.env.local` contains dummy JWT keys without startup validation.
4. **Missing Idempotency Enforcement:** Backend lacks verification of `Idempotency-Key` headers on mutating endpoints.
5. **Unawaited Promises in Route Handlers:** Several API routes miss `await` keywords when calling DB functions.

---

## 27. Low Priority Findings (Polish)

1. Inconsistent branding (`Formly` vs `Seva Saarthi`).
2. Missing ARIA labels on queue pagination and icon buttons.
3. Heavy client bundle size due to monolithic icon imports.
4. Static dashboard statistics constants.

---

## 28. Missing Features

1. **Dedicated Citizen Application Submission Endpoint:** `/api/applications` for authenticated citizens.
2. **True OCR Byte Extraction:** OCR pipeline processing PDF/image binary buffers.
3. **Realtime WebSocket / SSE Stream:** Replacement for aggressive 3.5s client HTTP polling.
4. **Automated Retry Background Worker:** Cron/queue worker for recovering `API_UNAVAILABLE` connector requests.
5. **DigiLocker OAuth Integration:** Real OAuth2 flow for verified document fetching.

---

## 29. Recommended Fix Order

### P0 — MUST FIX BEFORE DEMO (Critical Blockers)
1. **Fix Middleware Anonymous Bypass:** Update `src/middleware.ts` to redirect unauthenticated visitors requesting `/gov/*` to `/gov/login`.
2. **Fix Citizen Tracker 403 Bug:** In `src/app/api/track/[id]/route.ts:31` and `/resubmit/route.ts:31`, replace `app.citizen_user_id` with `app.userId`.
3. **Fix Citizen Submission 401 Bug:** Create citizen submission handler or permit citizen tokens on `POST /api/gov/applications`.
4. **Fix `gov/login` Syntax Error:** In `src/app/gov/login/page.tsx:15`, change `const [isLoggingIn, setIsLoading]` to `const [isLoggingIn, setIsLoggingIn]`.
5. **Provide Resilient DB Adapter:** In `src/lib/server/db.ts`, add local in-memory/JSON fallback when Supabase credentials are placeholders.
6. **Remove Live Automation Scripts:** Delete or disable `scripts/run-live-agent.mjs` and `src/app/api/agent/launch-headed`.

### P1 — SHOULD FIX (Major Polish)
1. Fix 28 TypeScript compilation errors across API routes and `db.ts`.
2. Fix `npm test` in `scripts/test-gov-pipeline.mjs` by awaiting `getPanApplications()`.
3. Remove deceptive claims ("Live UIDAI 2.5 API") from tracker UI.
4. Consolidate duplicate `/government` routes into canonical `/gov` hierarchy.

### P2 — IMPROVEMENT
1. Connect Tesseract.js worker to parse uploaded document bytes.
2. Add department boundary checks in `PATCH /api/gov/applications/[id]`.
3. Replace 3.5s tracker polling with Server-Sent Events (SSE).

### P3 — FUTURE
1. Integrate live DigiLocker Sandbox API.
2. Implement distributed Redis queue for automated connector retries.

---

## 30. Final Verdict

- **What Works:**
  - PostgreSQL V2 unified schema (`002_formly_v2_unified_schema.sql`) passes 100% of PGlite engine validation tests.
  - Government operations command center UI, queue filtering, exception center, and data mapper console.
  - Citizen readiness checklist computation and document locker UI in client memory.
  - Cross-system validation diff engine in `data-mapper.ts`.
  - Role isolation between authenticated citizens and authenticated government officers.
- **What Partially Works:**
  - Citizen authentication and profile saving (degrades to localStorage due to unreachable Supabase).
  - Officer decision recording (functions in memory/SQL, but bypasses stored procedure in TypeScript).
  - SLA monitoring and exception tracking.
- **What Does Not Work:**
  - Citizen application submission (returns 401 Unauthorized).
  - Citizen application tracking (returns 403 Forbidden).
  - Citizen correction resubmission (returns 403 Forbidden).
  - `npm test` (fails with assertion error).
  - `npm run build` / `npm run typecheck` (fails with 28 compiler errors).
- **What Is Simulated:**
  - All 5 external government connectors (UIDAI, ITD, DigiLocker, NSP, NSDL).
  - OCR document field extraction (filename substring matching).
  - AI case summaries and risk flags (static mock records).
- **What Is Unverified:**
  - Live Supabase multi-tenant performance under high concurrent database load.
- **What Could Break During the SIH Demo:**
  1. A judge clicks "Submit Application" in the citizen portal and receives a red "401 Unauthorized" error toast.
  2. A judge clicks on the tracking link `/track/PAN-2026-0001` and sees a blank page or "403 Forbidden" toast.
  3. An anonymous user enters `http://localhost:3000/gov` directly in an incognito window and bypasses login completely.
  4. The presenter attempts to run `npm test` or `npm run build` and is confronted with 28 TypeScript errors.
- **What Must Be Fixed First:**
  The three single-line runtime bugs: (1) `src/middleware.ts:24` (anonymous bypass), (2) `src/app/api/track/[id]/route.ts:31` (citizen tracking 403), and (3) `src/components/dashboard/ApplyPanModal.tsx:55` / `src/app/api/gov/applications/route.ts:31` (citizen submission 401).

