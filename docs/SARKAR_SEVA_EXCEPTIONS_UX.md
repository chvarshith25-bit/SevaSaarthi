# SARKAR SEVA — EXCEPTIONS WORK QUEUE UX & REDESIGN REPORT
**Phase 9.0.6 Exceptions Page Simplification & Officer-Focused Architecture**
*Date: 2026-09-20 | Portal: SARKAR SEVA (Port 3001) | Officer Desk: CBDT PAN Division*

---

## 1. Executive Summary

Phase 9.0.6 redesigned the **SARKAR SEVA** Government Officer Exceptions page into a simplified, task-oriented exception work queue.

The redesign eliminated confusing engineering/admin telemetry, replaced awkward primary filter categories with three intuitive officer buckets (**Identity & Verification**, **Documents & Corrections**, **System & Registry**), embedded SLA urgency inline on every card with visual priority, humanized descriptions into structured *"What Happened"*, *"Why It Matters"*, and *"Officer Action Required"* sections, and implemented contextual empty states with recovery navigation.

---

## 2. Information Architecture & Filter Evolution

### 2.1 Filter Categorization Matrix

| Old Filter Bar | New Primary Filter | Category Key | Intended Scope & Scenarios |
| :--- | :--- | :--- | :--- |
| **All** | **All** | `ALL` | Full department exception queue. Defaults upon navigation. |
| **Identity Conflicts** | **Identity & Verification** | `IDENTITY` | Date of birth discrepancies, name collisions, cross-source demographic mismatches, ambiguous candidate matches. |
| **Document Issues** | **Documents & Corrections** | `DOCUMENTS` | Low-resolution/blurred proofs, invalid document certificates, citizen correction notices, resubmissions. |
| **Registry/API Issues** | **System & Registry** | `SYSTEM` | Downstream gateway timeouts, registry connection failures, sync stalls, printing/dispatch queue congestion. |
| *SLA Risks (Separate Tab)* | *Eliminated as primary tab* | *Inline on Cards* | Converted to inline visual badges on all cards (`✓ Within SLA`, `⚠ Due in 2h`, `🔴 Overdue by 1h`). |

---

## 3. Humanized Terminology & Header Design

### 3.1 Officer-First Language Translations

| Previous Engineering String | Redesigned Officer String |
| :--- | :--- |
| `Operational Exceptions & Conflict Resolution` | `Exceptions Requiring Attention` |
| `Cases requiring officer attention.` | `Applications that need investigation, correction, or follow-up.` |
| `Registry/API Issues` | `System & Registry` |
| `Downstream external PAN deduplication service returned HTTP 504.` | `Government PAN verification service did not respond in time.` |
| `Consignment batch packaging delayed by 18 minutes past typical 60-minute dispatch threshold.` | `Physical card printing batch experienced dispatch queue delay.` |
| `All gateway connectors and cross-registry pipelines are operating normally.` | `Applications in this category are currently clear and operating normally.` |

---

## 4. Structured Exception Card Anatomy

Every exception card in the redesigned work queue follows a consistent, actionable 4-part structure:

1. **Card Top Header**:
   - Category Badge (e.g., *Identity & Verification*, *Documents & Corrections*, *System & Registry*)
   - Severity Level (*CRITICAL*, *HIGH*, *MEDIUM*, *LOW*)
   - Inline SLA Indicator (*✓ Within SLA (6h left)*, *⚠ Due in 2h*, *🔴 Overdue by 1h*)
   - Canonical Exception ID (*EXC-101*, *EXC-102*, *EXC-103*)
   - Resolution Status (*ACTION REQUIRED* vs *RESOLVED*)

2. **Impacted Case Context**:
   - Applicant Full Name (e.g., *Rahul Verma*, *Anjali Sharma*)
   - Application Monotonic ID with Direct Link (e.g., `PAN-2026-0003`)
   - Service Title (e.g., *Instant e-PAN & Physical Card Issuance*)

3. **Three-Column Operational Breakdown**:
   - **WHAT HAPPENED**: Human-readable explanation of the discrepancy or delay.
   - **WHY IT MATTERS**: Operational rationale explaining why automation halted.
   - **OFFICER ACTION REQUIRED**: Clear, statutory task guidance for the adjudicating officer.

4. **Expandable Technical Details (Accordion)**:
   - Hidden by default to keep the officer UI uncluttered.
   - Expandable to reveal raw system endpoints, lifecycle state, retry counts, and timestamp logs.

5. **Action Bar**:
   - `[Open Application →]`: Directly navigates to `/government/applications/[id]/review`.
   - `[Retry Connector]`: Available on system exceptions to trigger gateway retries.
   - `[Mark Resolved]`: Prompts for statutory audit remarks to resolve case exceptions.

---

## 5. Single Source of Truth Counter Reconciliation

| Metric Location | Live Value | Source Expression |
| :--- | :--- | :--- |
| **Sidebar Exceptions Badge** | **3** | `exceptions.filter(!resolved).length` |
| **Dashboard Exceptions KPI** | **3** | Reconciled directly with active exception queue |
| **Summary Strip: Needs Attention** | **3** | `exceptions.filter(!resolved).length` |
| **Summary Strip: Identity Conflicts** | **1** | `exceptions.filter(category === IDENTITY).length` (`PAN-2026-0003`) |
| **Summary Strip: Documents / Corrections** | **0** | `exceptions.filter(category === DOCUMENTS).length` |
| **Summary Strip: System & Registry** | **2** | `exceptions.filter(category === SYSTEM).length` (`PAN-2026-0002`, `PAN-2026-0086`) |
| **Summary Strip: SLA Pressure** | **1** | `exceptions.filter(!resolved && (sla === OVERDUE \|\| sla === DUE_SOON)).length` |
| **Filter Button: All** | **3** | `counts.all` |
| **Filter Button: Identity & Verification** | **1** | `counts.identityCount` |
| **Filter Button: Documents & Corrections** | **0** | `counts.documentsCount` |
| **Filter Button: System & Registry** | **2** | `counts.systemCount` |

---

## 6. Verification Test Results

| Verification Area | Script / Suite | Assertions | Result |
| :--- | :--- | :--- | :--- |
| **TypeScript Type Safety** | `npm run typecheck` | Whole project | **PASS (0 errors)** |
| **Exceptions Work Queue Suite** | `scripts/test-sarkar-seva-exceptions.ts` | 27 checks | **PASS (100%)** |
| **Live Browser Workflow Flow** | `scripts/test-phase9-0-6-browser-flow.ts` | 9 steps | **PASS (100%)** |
| **Government Portal Count Reconciliation** | `scripts/test-government-portal-count-consistency.ts` | 14 checks | **PASS (100%)** |
| **Government Route & Resolution Audit** | `scripts/test-government-portal-routes.ts` | 42 checks | **PASS (100%)** |
| **Cross-System 10-Domain Consistency** | `scripts/test-government-data-consistency.ts` | 51 checks | **PASS (100%)** |
| **Core Government Pipeline & State Machine** | `npm test` | 22 checks | **PASS (100%)** |
| **Unified V2 Schema & Invariants** | `npm run test:schema` | 45 checks | **PASS (100%)** |
| **Platform Separation & Port Isolation** | `npm run test:separation` | 28 checks | **PASS (100%)** |
| **Statutory Repair & Tamper Verification** | `npm run test:verification` | 32 checks | **PASS (100%)** |

---

## 7. Artifact Screenshots
Captured during automated browser validation in `docs/demo/sarkar-seva/phase9_0_6/`:
- `01_dashboard.png`: Dashboard showing reconciled Exceptions KPI count (3).
- `02_exceptions_all.png`: Redesigned Exceptions work queue with summary strip and inline SLA badges.
- `03_identity_filter.png`: Filtered by Identity & Verification showing `PAN-2026-0003` (*Rahul Verma*).
- `04_documents_filter.png`: Filtered by Documents & Corrections showing compact contextual clear state.
- `05_system_filter.png`: Filtered by System & Registry showing `PAN-2026-0002` (*Anjali Sharma*).
- `06_expanded_technical_details.png`: Expandable technical telemetry panel on Anjali Sharma card.
- `07_application_review_pan_0002.png`: Direct navigation to Case Review via `[Open Application →]`.
- `08_exceptions_returned_all.png`: Clean reset to `All` filter upon sidebar re-entry.
- `09_mobile_exceptions_view.png`: Single-column mobile responsive view on 375px viewport.
