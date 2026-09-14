# SEVA SAARTHI — CONTROLLED GOVERNMENT SERVICE & WORKFLOW REGISTRY
**Document Version**: 2.0  
**Phase**: Phase 2 — Controlled Service & Workflow Architecture  
**Status**: Authoritative Reference Specification  

---

## 1. Executive Summary & Architectural Scope

Phase 2 establishes the **controlled, deterministic structural backbone** of Seva Saarthi without introducing any AI routing or generative state mutation. 

Every government interaction in Seva Saarthi is anchored to:
1. An authoritative administrative **Department** (Central or State).
2. A specialized administrative **Sub-Department** / Wing / Processing Directorate.
3. An operational regional or nodal **Office**.
4. An authoritative catalog **Service** with an explicit schema and lifecycle.
5. A deterministic **Workflow Definition** with ordered automated, human, and wait steps.
6. A controlled catalog of **Verification Requirements**.
7. Monitored external **Government Connectors** operating under explicit retry policies and endpoint modes (SIMULATED, MOCK, LIVE).
8. Multi-entity **Routing Rules** that dispatch applications to the correct office and officer queue based on application attributes, strictly falling back to ROUTING_REQUIRES_MANUAL_REVIEW if any unmapped condition is encountered.

`mermaid
graph TD
    Dept["Department (e.g. Income Tax / CBDT)"]
    SubDept["Sub-Department (e.g. PAN Allotment Cell)"]
    Office["Regional / Central Office (e.g. CPC Bengaluru)"]
    Service["Authoritative Service (e.g. INSTANT_E_PAN)"]
    WfDef["Workflow Definition (WF_PAN_LIFECYCLE)"]
    WfStep["Workflow Steps (Automated & Human Steps)"]
    Reqs["Controlled Service Requirements (7 Verified Specs)"]
    Connectors["Monitored Connectors (e.g. UIDAI, Protean, IndiaPost)"]
    Routing["Routing Rules Engine (Priority & Attribute Matching)"]
    OfficerQueue["Officer Desk / Queue (Port 3001)"]
    ManualReview["Central Manual Review Queue (Fallback)"]

    Dept --> SubDept
    SubDept --> Office
    Dept --> Service
    SubDept --> Service
    Service --> WfDef
    WfDef --> WfStep
    Service --> Reqs
    WfStep -.-> Connectors
    Service --> Routing
    Routing -->|Rule Matched| OfficerQueue
    Routing -->|No Rule Matched| ManualReview
`

---

## 2. Relational Hierarchy & Data Model

The schema extensions are codified in supabase/migrations/003_controlled_registry.sql:

### 2.1 Sub-Departments Table
`sql
CREATE TABLE IF NOT EXISTS sub_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
`

### 2.2 Relational Extensions
- offices.sub_department_id references sub_departments(id)
- services.sub_department_id references sub_departments(id)
- services.category (e.g., 'Identity & Tax', 'Higher Education & Scholarships')
- services.priority ('CRITICAL', 'HIGH', 'NORMAL', 'LOW')
- outing_rules.sub_department_id references sub_departments(id)
- workflow_steps.sub_department_id references sub_departments(id)
- workflow_steps.can_run_async (oolean DEFAULT false)
- workflow_steps.timeout_seconds (integer DEFAULT 3600)
- connectors.endpoint_mode ('SIMULATED', 'MOCK', 'LIVE')
- connectors.retry_policy (jsonb DEFAULT '{"maxRetries": 3, "backoffMs": 1000}')
- connectors.supported_data (	ext[])

---

## 3. Authoritative Entity Catalog

### 3.1 Departments (6 Registered)
| Code | Department Name | Government Level | Status |
| :--- | :--- | :--- | :--- |
| DEPT_INCOME_TAX | Income Tax Department (CBDT) | Central | ACTIVE |
| DEPT_HIGHER_EDU | Department of Higher Education | Central | ACTIVE |
| DEPT_REVENUE | Department of Revenue & Disaster Management | State | ACTIVE |
| DEPT_AGRICULTURE | Department of Agriculture & Farmers Welfare | Central | ACTIVE |
| DEPT_HEALTH | Ministry of Health & Family Welfare | Central | ACTIVE |
| DEPT_HOUSING | Ministry of Housing & Urban Affairs | Central | ACTIVE |

### 3.2 Sub-Departments (7 Registered)
| Code | Sub-Department Name | Parent Department | Key Function |
| :--- | :--- | :--- | :--- |
| SUB_PAN_PROCESSING | PAN Allotment & Processing Cell | DEPT_INCOME_TAX | Form 49A, e-PAN, de-duplication |
| SUB_SCHOLARSHIP_CELL | National Scholarship Cell | DEPT_HIGHER_EDU | Higher education tuition & maintenance grants |
| SUB_INCOME_CERT | Income Certificate Section | DEPT_REVENUE | Annual family income verification & issuance |
| SUB_LAND_RECORDS | Land Records & Survey Section | DEPT_REVENUE | RoR 1B, patta passbooks, title verification |
| SUB_FARMER_SERVICES | Farmer Welfare & Direct Benefit Section | DEPT_AGRICULTURE | PM-Kisan Samman Nidhi DBT transfers |
| SUB_HEALTH_SCHEMES | National Health Protection Cell | DEPT_HEALTH | Ayushman Bharat PM-JAY ₹5L cover |
| SUB_HOUSING_CELL | Urban & Rural Housing Cell | DEPT_HOUSING | PM Awas Yojana subsidy & dwelling units |

### 3.3 Offices (7 Registered)
| Code | Office Name | Department | City, State | PIN |
| :--- | :--- | :--- | :--- | :--- |
| OFC_CPC_BLR | Central Processing Centre (CPC) | DEPT_INCOME_TAX | Bengaluru, Karnataka | 560500 |
| OFC_HYD_01 | Regional Processing Office Hyderabad | DEPT_INCOME_TAX | Hyderabad, Telangana | 500081 |
| OFC_NSP_DELHI | National Scholarship Processing Office | DEPT_HIGHER_EDU | New Delhi, Delhi | 110001 |
| OFC_REV_TEHSIL | Tehsil Revenue Processing Cell | DEPT_REVENUE | Hyderabad, Telangana | 500001 |
| OFC_AGRI_KRISHI | Krishi Bhawan Direct Benefit Cell | DEPT_AGRICULTURE | New Delhi, Delhi | 110001 |
| OFC_NHA_HQ | National Health Authority HQ | DEPT_HEALTH | New Delhi, Delhi | 110001 |
| OFC_PMAY_HQ | PMAY Mission Directorate | DEPT_HOUSING | New Delhi, Delhi | 110001 |

### 3.4 Services (7 Authoritative Services)
1. **INSTANT_E_PAN**: Instant e-PAN & Physical Card Issuance (Form 49A) — DEPT_INCOME_TAX / SUB_PAN_PROCESSING
2. **POST_MATRIC_SCHOLARSHIP**: Post-Matric Scholarship for Higher Education — DEPT_HIGHER_EDU / SUB_SCHOLARSHIP_CELL
3. **INCOME_CERTIFICATE**: Government Family Income Certificate Issuance — DEPT_REVENUE / SUB_INCOME_CERT
4. **LAND_RECORD**: Certified Land Record Extracts & Title Verification (RoR 1B) — DEPT_REVENUE / SUB_LAND_RECORDS
5. **PM_KISAN**: PM-Kisan Samman Nidhi Direct Income Support — DEPT_AGRICULTURE / SUB_FARMER_SERVICES
6. **AYUSHMAN_BHARAT**: Ayushman Bharat PM-JAY Health Coverage — DEPT_HEALTH / SUB_HEALTH_SCHEMES
7. **PM_AWAS**: Pradhan Mantri Awas Yojana Affordable Housing — DEPT_HOUSING / SUB_HOUSING_CELL

---

## 4. Controlled Verification Requirements

All requirements use standardized, controlled taxonomy types:
- IDENTITY_DOCUMENT
- ADDRESS_DOCUMENT
- INCOME_DOCUMENT
- EDUCATION_DOCUMENT
- BANK_DOCUMENT
- LAND_DOCUMENT
- PHOTO
- SIGNATURE
- PERSONAL_INFORMATION
- CONSENT
- DECLARATION
- VERIFICATION
- DOCUMENT

### Requirement Allocation Across Services
- **INSTANT_E_PAN** (7 requirements): Aadhaar card, DOB proof, Address proof, Full Name, Father Name, DOB, Aadhaar OTP DPDP Consent.
- **POST_MATRIC_SCHOLARSHIP** (10 requirements): Aadhaar, Income certificate, College ID, Previous marksheet, Bank passbook, Full name, DOB, Annual income, College name, Domicile certificate.
- **INCOME_CERTIFICATE** (3 requirements): Aadhaar, Salary slip / ITR, Ration card / Family BPL extract.
- **LAND_RECORD** (2 requirements): Aadhaar, Patta passbook / Survey document.
- **PM_KISAN** (3 requirements): Aadhaar, Aadhaar-linked Bank account, Land ownership title.
- **AYUSHMAN_BHARAT** (2 requirements): Aadhaar, Ration card / SECC family ID.
- **PM_AWAS** (3 requirements): Aadhaar, Annual family income certificate, Non-pucca house declaration affidavit.

---

## 5. Monitored Government Connectors

All connectors are registered in connectors with explicit simulated configurations, latency metrics, and exponential retry policies:

| Code | System Key | Agency | Endpoint Mode | Supported Data Fields |
| :--- | :--- | :--- | :--- | :--- |
| CONN_UIDAI_AADHAAR | identity | UIDAI | SIMULATED | ullName, dateOfBirth, gender, ddress, adhaarNumber |
| CONN_DIGILOCKER | document | NeGD | SIMULATED | marksheet, casteCertificate, onafideCertificate, domicileCertificate |
| CONN_PROTEAN_PAN | pan_core | Protean / NSDL | SIMULATED | panNumber, 	axStatus |
| CONN_SECURITY_PRINT| printing | India Security Press | SIMULATED | cardDispatchId |
| CONN_INDIAPOST | dispatch | India Post | SIMULATED | 	rackingNumber, deliveryStatus |
| CONN_REVENUE | evenue | State Revenue Dept | SIMULATED | nnualIncome, certificateNumber, issuingAuthority |
| CONN_EDUCATION | ducation | AISHE / Higher Edu | SIMULATED | nrollmentNumber, collegeCode, degree, cademicYear |
| CONN_BANK_NPCI | ank_npci | NPCI | SIMULATED | ccountNumber, ifsc, dbtSeededStatus |
| CONN_LAND_RECORDS | land_records| Bhoomi / Dharani | SIMULATED | khasraNumber, surveyNumber, landAreaAcres, ownershipStatus |

**Retry Policy Standard**:
`json
{
  "maxRetries": 3,
  "backoffMs": 1000
}
`

---

## 6. Deterministic Routing Rules & Safe Fallback

Routing resolution is implemented in src/lib/server/routing-resolver.ts.

### Resolution Protocol:
1. Resolve service by ID or unique code.
2. If unregistered, return immediately:
   - status: "ROUTING_REQUIRES_MANUAL_REVIEW"
   - outingMode: "MANUAL_REVIEW_REQUIRED"
   - eason: Explanation logged to audit log.
3. Query active outing_rules for the service ordered by priority_order ASC.
4. Match rule conditions against runtime application context (stateCode, category, priority, etc.).
5. If matched:
   - status: "ROUTED"
   - outingMode: "RULE_BASED"
   - Target Department, Sub-Department, Office, and Role populated.
6. If no rule matches:
   - status: "ROUTING_REQUIRES_MANUAL_REVIEW"
   - outingMode: "MANUAL_REVIEW_REQUIRED"
   - Target dispatched to centralized nodal review desk.

---

## 7. AI Model 1 Integration Boundary

When AI Model 1 is introduced in Phase 3, it will **NOT**:
- Modify database schemas or create routes on the fly.
- Bypass outing_rules foreign keys.
- Approve or reject applications directly (Product Rule 1).
- Overwrite deterministic verification requirements.

Instead, AI Model 1 will only act as a **recommender**:
`	s
interface AIModel1RoutingRecommendation {
  suggestedDepartmentId: string;
  suggestedSubDepartmentId: string;
  suggestedOfficeId: string;
  confidenceScore: number; // 0.00 - 1.00
  recommendationExplanation: string;
  suggestedRoutingRuleId?: string;
}
`
If confidence is below threshold (< 0.85) or unmapped, the system executes the fallback: ROUTING_REQUIRES_MANUAL_REVIEW.
Human officers retain complete statutory authority to review, confirm, or alter any routing recommendation.
