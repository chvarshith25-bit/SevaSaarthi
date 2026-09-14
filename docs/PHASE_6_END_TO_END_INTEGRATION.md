# Seva Saarthi Phase 6: End-to-End AI Integration Architecture

## 1. Executive Summary

Phase 6 integrates **AI Model 1 (Intelligent Workflow Router)** and **AI Model 2 (Cross-Registry Entity Resolution with Semantic N-Gram Embeddings & Graph Corroboration)** into the real Seva Saarthi application lifecycle without creating isolated demo sandboxes.

The entire workflow enforces strict statutory compliance:
- **Product Rule 1 Advisory Invariance**: AI models operate strictly as recommendation and candidate-generation systems. Neither Model 1 nor Model 2 can autonomously approve/reject applications or declare legal identity.
- **DPDP Act Statutory Consent Gate**: Cross-department data retrieval is strictly gated behind verified citizen consent tokens (`consent_requests`).
- **Departmental Isolation**: Workflows strictly restrict cross-registry queries to authorized registries only.
- **Homonym Collision Protection**: Identical names with conflicting demographic data are flagged with collision warnings and demoted to `AMBIGUOUS`.
- **Tamper-Evident Audit Trail**: Every submission, consent verification, AI execution, and officer adjudication is cryptographically sealed in `audit_events` with SHA-256 hash chains.

---

## 2. End-to-End System Architecture

```
                                  [ Citizen Application Submission ]
                                                  │
                                                  ▼
                                    [ AI Model 1: Workflow Router ]
                                 (Service, Dept, Sub-Dept, Workflow)
                                                  │
                                                  ▼
                               [ Statutory DPDP Consent Verification Gate ]
                           (Verifies token & determines authorized registries)
                                                  │
                                                  ▼
                                 [ AI Model 2: Entity Resolution ]
                                (Hybrid N-Gram + Corroboration Engine)
                                                  │
                                                  ▼
                                   [ Semantic Data Mapper Engine ]
                             (Maps cross-registry fields to verifications)
                                                  │
                                                  ▼
                                 [ Government Officer Workspace ]
                            (Advisory card, field scores & adjudication)
                                                  │
                                                  ▼
                              [ Tamper-Evident Audit Trail (SHA-256) ]
```

---

## 3. Core Components & Implementation Inventory

### 3.1 Database Migration (`supabase/migrations/006_ai_entity_resolution.sql`)
- Creates table `application_entity_resolutions`:
  - `id`: UUID Primary Key
  - `application_id`: Foreign Key referencing `applications(id)`
  - `candidate_record_id`: Text ID in target registry (e.g., `EDU-20060`, `REV-10020`)
  - `candidate_registry`: Registry identifier (`revenue_registry`, `education_registry`, etc.)
  - `confidence_tier`: `HIGH` | `MEDIUM` | `LOW` | `AMBIGUOUS`
  - `total_score`: Float similarity score (0.0 to 1.0)
  - `field_scores`: JSONB containing individual similarity metrics (`name`, `dob`, `fatherName`, `address`, `district`, `pincode`)
  - `matched_fields`: Text array of validated identity fields
  - `is_collision_warning`: Boolean homonym collision flag
  - `explanation`: Human-readable summary of match evidence
  - `review_status`: `PENDING` | `ACCEPTED` | `REJECTED` | `VERIFICATION_REQUIRED`
  - `reviewed_by`: UUID of adjudicating officer
  - `reviewed_at`: Timestamp of adjudication
- Indexes created for fast retrieval by `application_id` and `review_status`.

### 3.2 AI Orchestrator (`src/lib/server/ai/orchestrator.ts`)
- `resolveApplicationIdentity(applicationIdOrNumber, options)`:
  1. Fetches application and DPDP consent record.
  2. Evaluates consent status (`GRANTED` vs `REVOKED`/`EXPIRED`).
  3. Computes authorized registries based on service workflow policy.
  4. Executes AI Model 2 entity resolution engine (`EntityResolutionEngine.resolve`).
  5. Maps retrieved candidate data to application canonical verification checks (`verification_results`).
  6. Persists candidate records into `application_entity_resolutions`.
  7. Logs append-only execution record to `audit_events`.

### 3.3 Backend Data Layer (`src/lib/server/db.ts`)
- Integrated `resolveApplicationIdentity` into `createPanApplication`.
- `getApplicationEntityResolutions(applicationIdOrNumber)`: Queries persisted AI Model 2 candidates.
- `officerReviewEntityResolution(applicationId, resolutionId, action, officerUserId, remarks)`:
  - Updates `review_status` in database.
  - Logs officer review action with SHA-256 tamper hash.
- `getAuditLogs(applicationId)`: Queries live PostgreSQL `audit_events` table and guarantees SHA-256 hash calculation.

### 3.4 REST APIs
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/ai/entity-resolution` | Triggers AI Model 2 resolution for an application |
| `POST` | `/api/gov/applications/[id]/entity-resolution/accept` | Officer accepts AI identity candidate |
| `POST` | `/api/gov/applications/[id]/entity-resolution/reject` | Officer rejects AI identity candidate |
| `GET` | `/api/gov/applications/[id]` | Returns application with Model 1 routing and Model 2 entity resolutions |

### 3.5 Government Officer Workspace UI (`src/app/gov/workspace/[id]/page.tsx`)
- Added **CROSS-REGISTRY IDENTITY RESOLUTION (AI MODEL 2)** Card:
  - Candidate match summary and confidence badge (`HIGH`, `MEDIUM`, `LOW`, `AMBIGUOUS`).
  - Collision warning banner if homonym risk detected.
  - Granular field-level score breakdown (Name, DOB, Father Name, Address, District).
  - Cross-Registry Corroboration graph indicators.
  - Officer Adjudication buttons: `[Accept Match]`, `[Reject Match]`, `[Request In-Person Verification]`.
  - Advisory disclaimer reminding officers that final legal determination rests solely with the authorized government official.

---

## 4. Verification & Test Matrix

All end-to-end integration and regression suites pass 100%:

| Test Suite | Command | Result |
|---|---|---|
| Phase 6 End-to-End Suite | `npx tsx scripts/test-phase6-end-to-end.mjs` | **100% (7/7 Passed)** |
| Platform Separation Suite | `npm run test:separation` | **100% (7/7 Passed)** |
| Schema & Rule Matrix | `npm run test:schema` | **100% (42 Tables, 7 Functions Verified)** |
| Unit & Pipeline Tests | `npm test` | **100% Passed** |
| TypeScript Validation | `npm run typecheck` | **0 Errors** |
| AI Model 1 Suite | `npx tsx scripts/test-phase3-ai-router.mjs` | **100% (15/15 Passed)** |
| AI Model 2 Phase 5A | `npx tsx scripts/test-ai-model2-phase5a.mjs` | **100% (686 Ground Truth Links)** |
| AI Model 2 Phase 5B | `npx tsx scripts/test-ai-model2-phase5b.mjs` | **100% (Semantic Embeddings)** |

---

## 5. Security & Compliance Safeguards

1. **Zero Data Leakage**: AI Model 2 strictly receives masked/normalized input fields during inference. Master citizen IDs and ground-truth notes are never exposed.
2. **DPDP Statutory Consent**: If consent is absent or revoked, queries throw an explicit `DPDP Statutory Consent Violation` error and log a failure audit entry.
3. **Immutability Trigger**: The PostgreSQL `prevent_audit_events_mutation` trigger strictly prevents updates or deletes on `audit_events`.
4. **English-Only UI**: All interface cards, labels, and explanations are presented in clean, standard English.
