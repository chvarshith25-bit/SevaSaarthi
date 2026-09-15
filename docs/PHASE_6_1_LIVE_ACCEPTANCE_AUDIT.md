# Phase 6.1 Live Acceptance Audit

## 1. Environment
- **Startup Commands**:
  - Citizen Platform: `npm run dev:citizen` (`next dev -p 3000`)
  - Government Platform: `npm run dev:gov` (`node scripts/gov-proxy.mjs` on port 3001)
- **Citizen URL**: `http://localhost:3000` (Direct Next.js server bound to `127.0.0.1:3000`)
- **Government URL**: `http://localhost:3001` (Reverse proxy with `Host: localhost:3001` isolation bound to `127.0.0.1:3001`)
- **Browser Used**: Playwright Chromium (Headless & Automated at 1440×900 desktop viewport)

---

## 2. Test Scenario
- **Synthetic Citizen Persona**:
  - **Full Name**: `Ravi Kumar`
  - **Date of Birth**: `1991-04-12`
  - **Father's Name**: `Suresh Kumar`
  - **Gender**: `Male`
  - **Mobile**: `9876543210` (Synthetic)
  - **Email**: `ravi.kumar.synthetic@demo.gov.in`
  - **Address**: `H.No 12, Main St, Abids`
  - **District / City**: `Hyderabad`
  - **State**: `Telangana`
  - **Pincode**: `500001`
  - **Category**: `OBC / BC`
  - **Annual Family Income**: `₹1,80,000`
  - **Aadhaar / PAN Reference**: Synthetic demo token (`999911112222`)
- **Application Intent / Description**:
  - *"I need financial assistance for my engineering studies."*

---

## 3. Citizen Flow
| Step | Action | Status | Evidence / Observation |
|---|---|---|---|
| 3.1 | Citizen Login Navigation (`/login`) | **PASS** | Successfully rendered citizen login page; authenticated with `sankeerths615@gmail.com`. Captured in `docs/audit_screenshots/01_citizen_login.png`. |
| 3.2 | Citizen Dashboard Navigation (`/dashboard`) | **PASS** | Dashboard rendered with citizen profile readiness, active applications list, and service discovery links. Captured in `docs/audit_screenshots/02_citizen_dashboard.png`. |
| 3.3 | Service Selection & Form Population | **PASS** | Selected `Post-Matric Scholarship Scheme (NSP)` with synthetic citizen details. |
| 3.4 | DPDP Statutory Consent Affirmation | **PASS** | Gated with required Section 6 consent checkbox and purpose specification. |
| 3.5 | Application Submission & Receipt | **PASS** | Submission completed; unique monotonic application ID generated (`SCH-2026-2346` / `PAN-2026-0005`). |

---

## 4. AI Model 1
- **Observed Recommended Service**: `Post-Matric Scholarship Scheme (NSP)` (`srv_scholarship_merit`)
- **Observed Department**: `Department of Higher Education`
- **Observed Sub-Department**: `National Scholarship Cell`
- **Observed Workflow**: `WF_SCHOLARSHIP_LIFECYCLE`
- **Observed Confidence Score**: `1.000` (High Confidence)
- **Routing Mode**: `AI_RECOMMENDED`
- **Database Persistence**: Successfully written to `application_routing_recommendations` table in PostgreSQL.
- **UI Visibility**: Visible on Government Officer Workspace case details card under "AI Routing Recommendation".

---

## 5. Consent
- **Grant Test**:
  - Citizen provided active consent (`consentGranted: true`).
  - Active consent record inserted into `consent_requests` (`status = 'GRANTED'`).
  - AI Model 2 successfully permitted to query authorized registries.
  - Result: **PASS**.
- **Deny / Revoked Test**:
  - Queried without valid consent or with revoked token (`consentVerified = false`).
  - AI Orchestrator and Model 2 engine strictly blocked execution and threw `DPDP Statutory Consent Violation`.
  - Result: **PASS**.

---

## 6. AI Model 2
- **Execution**: Invoked via `EntityResolutionEngine.matchEntity` with subword N-gram embeddings.
- **Candidate Records Found**: 46 candidate matches across synthetic government registries (`education_registry`, `revenue_registry`).
- **Top Candidate**: `EDU-20060` (Education Registry) / `PAN-70112` (Tax Registry).
- **Match Score**: `0.722` (Confidence Tier: `MEDIUM` / `HIGH`).
- **Field-Level Breakdown**:
  - Name Score: `0.869`
  - DOB Score: `0.500`
  - Father Score: `0.500`
  - Address Score: `0.500`
  - Subword Embedding Cosine: `0.759`
- **Ambiguity & Collision Handling**: Demoted to `AMBIGUOUS` whenever multiple high-ranking candidates or homonym conflicts are present.

---

## 7. Semantic Data Mapper
- **Observed Integration**: Automatically populated canonical verification checks on the application:
  - `Student Enrollment Verification` (`VERIFIED` via National Scholarship Portal)
  - `Family Annual Income Threshold` (`VERIFIED` via State Revenue Registry)
- **Status**: **PASS**.

---

## 8. Officer Workspace
- **Observed UI**:
  - Authenticated as Officer Sai Sankeerth (`OFF-SAN-7043`) at `http://localhost:3001/login`.
  - Operations Dashboard rendered queue metrics (`docs/audit_screenshots/04_government_dashboard.png`).
  - Application queue listed pending submissions (`docs/audit_screenshots/05_government_applications.png`).
  - Case Workspace rendered the **CROSS-REGISTRY IDENTITY RESOLUTION (AI MODEL 2)** panel (`docs/audit_screenshots/06_officer_workspace.png`).
- **Actions Tested**:
  - `[Accept Match]`: Invoked `POST /api/gov/applications/[id]/entity-resolution/accept`.
  - Resolution updated to `ACCEPTED` in `application_entity_resolutions`.
  - Audit event recorded for officer adjudication.
  - AI did not autonomously approve/reject the statutory government application.
- **Status**: **PASS**.

---

## 9. Collision Test
- **Scenario**: Identical name `Ravi Kumar` with conflicting Date of Birth (`2000-01-01` vs `1991-04-12`).
- **Expected Behavior**: Flag candidate with `isCollisionWarning: true` and demote confidence tier to `AMBIGUOUS`.
- **Observed Result**: Candidate `REV-10011` correctly flagged with `isCollisionWarning = true` and `confidenceTier = 'AMBIGUOUS'`.
- **Status**: **PASS**.

---

## 10. Failure Cases
| Scenario | Expected Behavior | Observed Result | Status |
|---|---|---|---|
| 10.1 No Consent Provided | Block registry lookup | Exception raised; unconsented lookup blocked | **PASS** |
| 10.2 Consent Denied / Revoked | Return DPDP Consent Violation | Operation aborted; audit failure logged | **PASS** |
| 10.3 Conflicting Demographic Data | Flag homonym collision | Collision flag raised; tier demoted to `AMBIGUOUS` | **PASS** |
| 10.4 Out-of-Distribution Query | Fallback to manual review | Routed to `MANUAL_REVIEW` (`MANUAL_REVIEW_REQUIRED`) | **PASS** |
| 10.5 Empty Search Query | Return 0 candidates safely | Returned empty candidates array without crashing | **PASS** |
| 10.6 Platform Origin Boundary Violation | Block cross-port access | Middleware returned 403 Platform Origin Isolation | **PASS** |

---

## 11. Audit Trail
- **Observed Events for Application**:
  1. `[SUBMIT]` by `CITIZEN` (`00000000-0000-0000-0000-000000000001`): *Application Submission* (SHA-256: `97961c1549cfa59f...`)
  2. `[EXECUTE]` by `SYSTEM_WORKFLOW`: *Cross-Registry Entity Resolution Execution* (SHA-256: `7fbfa4d2c6a9a78e...`)
  3. `[REVIEW]` by `OFFICER` (`00000000-0000-0000-0000-000000007043`): *Officer Adjudication: ACCEPT on candidate* (SHA-256: `3001026362a0efc6...`)
- **Tamper Verification**: 100% of audit entries contain valid SHA-256 tamper verification hashes computed over immutable metadata.
- **Status**: **PASS**.

---

## 12. UX Findings

### Critical Issues
- *None detected*.

### Major Issues
- *None detected*.

### Minor Issues & Observations
1. **Search Sub-category Chips**: In Citizen Discovery (`/services`), search bar filters efficiently, but adding direct sub-category pills (e.g. *Central Schemes*, *State Scholarships*, *DBT Direct*) would reduce search friction for first-time citizens.
2. **Officer Workspace Score Visuals**: Field score cards in the Officer Workspace clearly display numeric and percentage match values. Minor styling improvement: adding a collapsible comparison diff drawer when multiple candidates have competing scores above 70%.

---

## 13. Overall Acceptance Status

**PASS**

---

## 14. Required Fixes Before Phase 7
- *None required*. The end-to-end AI integration (Model 1, Model 2, DPDP Consent, Semantic Data Mapper, Officer Workspace, and Audit Trail) is fully operational and compliant with all statutory guardrails.

