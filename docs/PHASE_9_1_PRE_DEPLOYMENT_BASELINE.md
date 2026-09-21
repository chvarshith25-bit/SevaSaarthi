# PHASE 9.1 — PRE-DEPLOYMENT FORENSIC BASELINE

**Project**: Seva Saarthi (Citizen Platform) & Sarkar Seva (Government Platform)  
**Audit Date**: September 21, 2026  
**Status**: VERIFIED BASELINE  
**Audit Lead**: DeepInvestigator / Antigravity Forensic Engine  

---

## 1. Environment & Runtime Baseline

| Attribute | Recorded Value | Status |
|---|---|---|
| **Git Branch** | `main` | Clean Baseline Recorded |
| **Latest Git Baseline Commit** | `945fbd2` | Verified |
| **Node.js Runtime** | `v24.15.0` | Compatible (LTS) |
| **Package Manager** | `npm v11.12.1` | Lockfile in sync |
| **Next.js Version** | `15.1.0` (App Router) | Verified |
| **TypeScript Version** | `^5.7.2` (Strict Mode Enabled) | 0 compilation errors |
| **Tailwind CSS** | `^3.4.1` (Design Tokens Configured) | Active |
| **Lucide Icons** | `^0.468.0` | Active |

---

## 2. Port Architecture & Security Boundaries

```
[ Citizen Browser ] ────────> http://localhost:3000 (Citizen Next.js App)
                                  │
                                  ├─ Session Cookie: FORMLY_CITIZEN_SESSION
                                  ├─ Allowed Prefixes: /, /dashboard, /services, /track, /documents, /vault, /checklist, /profile
                                  └─ Strict 403 on /government, /gov routes

[ Officer Browser ] ────────> http://localhost:3001 (Government Portal Proxy)
                                  │
                                  ├─ Reverse Proxy: scripts/gov-proxy.mjs
                                  ├─ Session Cookie: FORMLY_GOV_SESSION
                                  ├─ Allowed Prefixes: /government, /gov, /api/gov
                                  └─ Strict 403 on Citizen Routes
```

---

## 3. Database Schema & Data Store Baseline

The database layer utilizes Supabase PostgreSQL with fully synchronized in-memory fallback caches on `globalThis` to preserve state consistency across Next.js dev route bundles:

1. **Migrations**:
   - `001_initial_schema.sql` — Applications, Citizen Profiles, Documents, Audit Logs
   - `002_fix_audit_logs.sql` — SHA-256 Hash Chaining & Tamper Verification
   - `003_add_feedback_tracking.sql` — Officer Corrections & Feedback Logs
   - `004_fix_feedback_events_constraint.sql` — Schema Constraints
   - `005_synthetic_government_registries.sql` — Master Citizens, Revenue, Education, Agriculture, Health, Housing, Land, PAN Registries & Ground Truth Links

2. **Core Invariants & Product Rules Enforced**:
   - **Rule 1 (Zero Statutory Authority for AI)**: AI Models 1 & 2 act exclusively in advisory capacity. Every state transition and legal determination requires an explicit, authenticated Human Officer action.
   - **Rule 19 (Tamper-Evident SHA-256 Audit Chain)**: Every pipeline action, AI scoring event, officer approval/rejection/override, document verification, and status mutation logs a cryptographically signed SHA-256 record.
   - **DPDP Act 2023 Compliance**: Explicit consent captured before any external synthetic registry lookup or entity resolution pipeline is invoked.

---

## 4. Test Suite Baseline Results

- `npm run typecheck`: **0 errors** (100% type safety)
- `npm test` (`scripts/test-gov-pipeline.mjs`): **100% PASS**
- `npm run test:schema`: **100% PASS**
- `npm run test:separation`: **100% PASS**
- `scripts/test-full-a-to-z-audit.ts`: **54/54 Checks Passed (100%)**
