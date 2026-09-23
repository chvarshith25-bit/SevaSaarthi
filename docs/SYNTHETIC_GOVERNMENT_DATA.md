# Seva Saarthi: Synthetic Government Data Layer & Connector Architecture (Phase 4)

**Document Status:** Complete & Frozen  
**Prototype Scope:** Smart India Hackathon (SIH) Prototype & Verification Harness  
**Applicability:** Training, Evaluation, and Benchmark Ground Truth for AI Model 2 (Record Matching & Entity Resolution)  
**Safety Classification:** Synthetic Demo Data (Zero PII, Zero Real Aadhaar/PAN Identifiers)  

---

## 1. Executive Summary

Phase 4 of the Seva Saarthi architecture creates a realistic, mathematically controlled, multi-departmental synthetic government data layer. This data layer simulates Indian state and central government departmental databases to serve as the ground-truth benchmark for **AI Model 2 (Cross-Department Citizen Record Retrieval & Entity Resolution)**.

In accordance with strict safety rules:
- **No real Aadhaar numbers, PAN numbers, bank accounts, or citizen PII are present.** All identifiers follow synthetic patterns (`AADHAAR-DEMO-XXXXXX`, `PAN-DEMO-XXXXXX`, `CIT-XXXXX`).
- **AI Model 1 (Intelligent Workflow Router) remains 100% frozen** with all test suites executing cleanly with zero regressions.
- **AI Model 2 algorithms** operate against synthetic data schemas, synthetic populations, realistic departmental registries, ground-truth match pairs, and DPDP-aligned connector querying interfaces.

---

## 2. Master Citizen Dataset Specification

The master citizen dataset comprises **150 synthetic citizens** modeled on realistic demographic distributions across Indian states, districts, and linguistic backgrounds.

### 2.1 Master Schema (`synthetic_master_citizens`)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `citizen_id` | text | PRIMARY KEY | Monotonic synthetic identifier (`CIT-00001` to `CIT-00150`) |
| `full_name` | text | NOT NULL | Benchmark canonical full name |
| `date_of_birth` | date | NOT NULL | YYYY-MM-DD format (ages 18 to 75) |
| `gender` | text | CHECK (MALE, FEMALE, TRANSGENDER, OTHER) | Demographic gender |
| `father_name` | text | NULLABLE | Paternal benchmark name (null when guardian present) |
| `guardian_name` | text | NULLABLE | Guardian name (for edge cases) |
| `mobile_number` | text | NULLABLE | Synthetic demo mobile (`+91 91234 XXXXX`) |
| `email` | text | NULLABLE | Synthetic demo email (`citXXXXX@demo.gov.in`) |
| `address` | text | NOT NULL | Benchmark residential address string |
| `district` | text | NOT NULL | District (e.g., Hyderabad, Rangareddy, Warangal, Medchal) |
| `state` | text | NOT NULL | State (Telangana, Andhra Pradesh, Karnataka, Maharashtra) |
| `pincode` | text | NOT NULL | 6-digit postal index number |
| `aadhaar_reference` | text | UNIQUE, NOT NULL | Synthetic token: `AADHAAR-DEMO-000001` |
| `pan_reference` | text | UNIQUE, NOT NULL | Synthetic token: `PAN-DEMO-000001` |
| `created_at` | timestamptz | DEFAULT now() | Audit timestamp |

---

## 3. Departmental Registries & Field Structures

Seven distinct departmental registries are modeled in PostgreSQL migration `005_synthetic_government_registries.sql`:

### 3.1 Revenue Department Registry (`registry_revenue`)
- **Purpose:** Family Income & Caste/Residence Certificate verification by Tehsildar offices.
- **Record Count:** 135 records.
- **Fields:** `id`, `citizen_id` (FK), `name`, `father_name`, `dob`, `address`, `district`, `income_certificate_number`, `annual_income`, `certificate_status`, `issue_date`.
- **Status values:** `ACTIVE`, `EXPIRED`, `PENDING`, `CANCELLED`.

### 3.2 Education / Scholarship Registry (`registry_education`)
- **Purpose:** National Scholarship Portal (NSP) and AISHE college student verification.
- **Record Count:** 75 records.
- **Fields:** `id`, `citizen_id` (FK), `student_name`, `dob`, `college_name`, `course`, `scholarship_id`, `scholarship_status`, `academic_year`, `income_reference`.
- **Status values:** `DISBURSED`, `SANCTIONED`, `APPLIED`, `REJECTED`.

### 3.3 Agriculture Registry (`registry_agriculture`)
- **Purpose:** PM-Kisan Samman Nidhi Direct Income Support eligibility.
- **Record Count:** 75 records.
- **Fields:** `id`, `citizen_id` (FK), `farmer_name`, `village`, `district`, `land_reference`, `pm_kisan_status`, `bank_reference`, `eligibility_status`.
- **Status values:** `ACTIVE`, `INELIGIBLE`, `PENDING_VERIFICATION`.

### 3.4 Health Registry (`registry_health`)
- **Purpose:** Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY) Golden Card records.
- **Record Count:** 100 records.
- **Fields:** `id`, `citizen_id` (FK), `beneficiary_name`, `dob`, `health_scheme_id`, `ayushman_status`, `family_reference`, `eligibility_status`.
- **Status values:** `ACTIVE`, `SUSPENDED`, `VERIFICATION_REQUIRED`.

### 3.5 Housing Registry (`registry_housing`)
- **Purpose:** Pradhan Mantri Awas Yojana (PMAY Urban/Gramin) beneficiary registry.
- **Record Count:** 60 records.
- **Fields:** `id`, `citizen_id` (FK), `applicant_name`, `address`, `district`, `household_income`, `housing_scheme_id`, `housing_status`.
- **Status values:** `SANCTIONED`, `UNDER_CONSTRUCTION`, `COMPLETED`, `APPLIED`.

### 3.6 Land Records Registry (`registry_land`)
- **Purpose:** Bhoomi / RoR 1B Record of Rights and cadastral land survey registry.
- **Record Count:** 76 records.
- **Fields:** `id`, `citizen_id` (FK), `owner_name`, `survey_number`, `village`, `district`, `land_area`, `ownership_status`.
- **Status values:** `SOLE_OWNER`, `JOINT_OWNER`, `DISPUTED`.

### 3.7 PAN / Tax Registry (`registry_pan`)
- **Purpose:** Central Board of Direct Taxes (CBDT) PAN card database.
- **Record Count:** 140 records.
- **Fields:** `id`, `citizen_id` (FK), `name`, `dob`, `pan_reference`, `pan_status`, `category`.
- **Status values:** `ACTIVE`, `INACTIVE`, `BLOCKED`.

---

## 4. Ground-Truth Linkage & Controlled Noise Injection

To rigorously evaluate AI Model 2, the synthetic data layer injects realistic real-world variations observed in Indian administrative data:

### 4.1 Ground-Truth Pair Inventory (`synthetic_entity_ground_truth`)
- **Total Ground-Truth Assertions:** 686 links
- **Ground-Truth Matches (TRUE):** 661 links across 7 categories
- **Ground-Truth Non-Matches (FALSE):** 25 negative control links (Homonym/Collision cases)

### 4.2 Realistic Noise Categories
1. **EXACT (50%):** Identical string representations.
2. **INITIALS (15%):** e.g., Ravi Kumar Sharma represented as Ravi K. Sharma or R. K. Sharma.
3. **ALL_CAPS (10%):** Legacy departmental mainframes (e.g. RAVI KUMAR).
4. **FUZZY_NAME (10%):** Common phonetic transliteration variations (Suresh -> Sures, Chandra -> Chandar, Venkata -> Venkat).
5. **EXTRA_SPACES (5%):** Data entry whitespace irregularities (e.g. Ravi  Kumar ).
6. **ADDRESS_ABBREVIATED (10%):** Road/nagar/cross variations (Cross Road -> X Rd, Nagar -> Ngr).
7. **NON_MATCH_NAME_COLLISION:** True non-match pairs where citizens share identical names and districts (e.g., Ravi Kumar CIT-00010 vs Ravi Kumar CIT-00011) but have different dates of birth and parents.

---

## 5. DPDP-Aligned Privacy, Consent & Data Minimization Safeguards

In accordance with **DPDP-aligned privacy and consent safeguards**:
1. **Consent Gate:** `querySyntheticRegistry` checks `consentVerified: true` before issuing any SQL query. If missing, it immediately throws a statutory `CONSENT_VERIFICATION_REQUIRED` error and returns 0 records.
2. **Field-Level Data Minimization:** Cross-departmental queries must supply an explicit `authorizedFields: string[]` whitelist. Unlisted fields (e.g. detailed residential address, annual income, family references) are purged before the response object is constructed.
3. **Purpose Specification:** All cross-registry queries require a valid purpose and `requestingApplicationId` for immutable audit trail recording.

---

## 6. Verification and Regression Summary

| Test Suite | Total Checks | Status |
|---|---|---|
| Phase 4 Synthetic Data Test Suite (`scripts/test-synthetic-government-data.ts`) | 29 | **PASSED (100%)** |
| TypeScript Compiler Check (`npm run typecheck`) | Whole Repository | **PASSED (0 Errors)** |
| Government Pipeline Core (`npm test`) | All Cases | **PASSED (100%)** |
| Database Schema Constraints (`npm run test:schema`) | 42 Tables + RLS | **PASSED (100%)** |
| Platform Separation (`npm run test:separation`) | 7 Boundaries | **PASSED (100%)** |
| Phase 3 AI Model 1 Router Validation (`scripts/test-phase3-ai-router.mjs`) | 15 Scenarios | **PASSED (100% Frozen)** |