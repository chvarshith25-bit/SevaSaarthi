-- =====================================================================
-- 003_controlled_registry.sql
-- Controlled Government Service & Workflow Registry Extension
-- =====================================================================

-- 1. SUB-DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS sub_departments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id        uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  code                 text NOT NULL UNIQUE,
  name                 text NOT NULL,
  description          text,
  status               text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_departments_dept ON sub_departments(department_id);

-- 2. EXTEND SERVICES WITH CATEGORY, PRIORITY, SUB_DEPARTMENT, DEPARTMENT
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'sub_department_id') THEN
    ALTER TABLE services ADD COLUMN sub_department_id uuid REFERENCES sub_departments(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'category') THEN
    ALTER TABLE services ADD COLUMN category text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'priority') THEN
    ALTER TABLE services ADD COLUMN priority text DEFAULT 'NORMAL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'department_id') THEN
    ALTER TABLE services ADD COLUMN department_id uuid REFERENCES departments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. EXTEND OFFICES WITH SUB_DEPARTMENT
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offices' AND column_name = 'sub_department_id') THEN
    ALTER TABLE offices ADD COLUMN sub_department_id uuid REFERENCES sub_departments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. EXTEND ROUTING_RULES WITH SUB_DEPARTMENT
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'routing_rules' AND column_name = 'sub_department_id') THEN
    ALTER TABLE routing_rules ADD COLUMN sub_department_id uuid REFERENCES sub_departments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. EXTEND WORKFLOW_STEPS WITH SUB_DEPARTMENT AND ASYNC CAPABILITIES
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_steps' AND column_name = 'sub_department_id') THEN
    ALTER TABLE workflow_steps ADD COLUMN sub_department_id uuid REFERENCES sub_departments(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_steps' AND column_name = 'can_run_async') THEN
    ALTER TABLE workflow_steps ADD COLUMN can_run_async boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_steps' AND column_name = 'timeout_seconds') THEN
    ALTER TABLE workflow_steps ADD COLUMN timeout_seconds integer DEFAULT 3600;
  END IF;
END $$;

-- 6. EXTEND CONNECTORS WITH RETRY POLICY AND ENDPOINT MODE
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'connectors' AND column_name = 'endpoint_mode') THEN
    ALTER TABLE connectors ADD COLUMN endpoint_mode text NOT NULL DEFAULT 'SIMULATED' CHECK (endpoint_mode IN ('SIMULATED', 'MOCK', 'LIVE'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'connectors' AND column_name = 'retry_policy') THEN
    ALTER TABLE connectors ADD COLUMN retry_policy jsonb NOT NULL DEFAULT '{"maxRetries": 3, "backoffMs": 1000}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'connectors' AND column_name = 'supported_data') THEN
    ALTER TABLE connectors ADD COLUMN supported_data text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;

-- 7. SEED PROTOTYPE DEPARTMENTS
INSERT INTO departments (id, code, name, government_level, is_active)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'DEPT_INCOME_TAX', 'Income Tax Department (CBDT)', 'CENTRAL', true),
  ('d0000000-0000-0000-0000-000000000002', 'DEPT_HIGHER_EDU', 'Department of Higher Education', 'CENTRAL', true),
  ('d0000000-0000-0000-0000-000000000003', 'DEPT_REVENUE', 'Department of Revenue & Disaster Management', 'STATE', true),
  ('d0000000-0000-0000-0000-000000000004', 'DEPT_AGRICULTURE', 'Department of Agriculture & Farmers Welfare', 'CENTRAL', true),
  ('d0000000-0000-0000-0000-000000000005', 'DEPT_HEALTH', 'Ministry of Health & Family Welfare', 'CENTRAL', true),
  ('d0000000-0000-0000-0000-000000000006', 'DEPT_HOUSING', 'Ministry of Housing & Urban Affairs', 'CENTRAL', true)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- 8. SEED PROTOTYPE SUB-DEPARTMENTS
INSERT INTO sub_departments (id, department_id, code, name, description, status)
VALUES
  ('5d000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'SUB_PAN_PROCESSING', 'PAN Allotment & Processing Cell', 'Manages Form 49A, instant e-PAN, and identity deduplication.', 'ACTIVE'),
  ('5d000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'SUB_SCHOLARSHIP_CELL', 'National Scholarship Cell', 'Disburses central and state scholarship quotas to students.', 'ACTIVE'),
  ('5d000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'SUB_INCOME_CERT', 'Income Certificate Section', 'Issues and verifies annual family income certificates.', 'ACTIVE'),
  ('5d000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 'SUB_LAND_RECORDS', 'Land Records & Survey Section', 'Maintains RoR 1B, patta passbooks, and agricultural titles.', 'ACTIVE'),
  ('5d000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004', 'SUB_FARMER_SERVICES', 'Farmer Welfare & Direct Benefit Section', 'Operates PM-Kisan Samman Nidhi and DBT transfers.', 'ACTIVE'),
  ('5d000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000005', 'SUB_HEALTH_SCHEMES', 'National Health Protection Cell', 'Administers Ayushman Bharat PM-JAY health coverage.', 'ACTIVE'),
  ('5d000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000006', 'SUB_HOUSING_CELL', 'Urban & Rural Housing Cell', 'Administers PM Awas Yojana subsidised dwelling units.', 'ACTIVE')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, status = EXCLUDED.status;

-- 9. SEED PROTOTYPE OFFICES
INSERT INTO offices (id, department_id, sub_department_id, code, name, city, state, pincode, is_active)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '5d000000-0000-0000-0000-000000000001', 'OFC_CPC_BLR', 'Central Processing Centre (CPC)', 'Bengaluru', 'Karnataka', '560500', true),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', '5d000000-0000-0000-0000-000000000001', 'OFC_HYD_01', 'Regional Processing Office Hyderabad', 'Hyderabad', 'Telangana', '500081', true),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', '5d000000-0000-0000-0000-000000000002', 'OFC_NSP_DELHI', 'National Scholarship Processing Office', 'New Delhi', 'Delhi', '110001', true),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', '5d000000-0000-0000-0000-000000000003', 'OFC_REV_TEHSIL', 'Tehsil Revenue Processing Cell', 'Hyderabad', 'Telangana', '500001', true),
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004', '5d000000-0000-0000-0000-000000000005', 'OFC_AGRI_KRISHI', 'Krishi Bhawan Direct Benefit Cell', 'New Delhi', 'Delhi', '110001', true),
  ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000005', '5d000000-0000-0000-0000-000000000006', 'OFC_NHA_HQ', 'National Health Authority HQ', 'New Delhi', 'Delhi', '110001', true),
  ('e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000006', '5d000000-0000-0000-0000-000000000007', 'OFC_PMAY_HQ', 'PMAY Mission Directorate', 'New Delhi', 'Delhi', '110001', true)
ON CONFLICT (department_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  sub_department_id = EXCLUDED.sub_department_id,
  is_active = EXCLUDED.is_active;

-- 10. SEED CONNECTORS (Controlled Registry)
INSERT INTO connectors (id, code, name, environment, connector_type, protocol, enabled, health_status, endpoint_mode, supported_data)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'CONN_UIDAI_AADHAAR', 'UIDAI Aadhaar Verification Service', 'DEMO', 'IDENTITY', 'REST_JSON', true, 'HEALTHY', 'SIMULATED', ARRAY['fullName', 'dateOfBirth', 'gender', 'address', 'aadhaarNumber']),
  ('c0000000-0000-0000-0000-000000000002', 'CONN_DIGILOCKER', 'DigiLocker Document Verification Gateway', 'DEMO', 'DOCUMENT', 'REST_JSON', true, 'HEALTHY', 'SIMULATED', ARRAY['marksheet', 'casteCertificate', 'bonafideCertificate', 'domicileCertificate']),
  ('c0000000-0000-0000-0000-000000000003', 'CONN_PROTEAN_PAN', 'Protean / NSDL PAN Processing Core', 'DEMO', 'PAN_PROCESSING', 'REST_JSON', true, 'HEALTHY', 'SIMULATED', ARRAY['panNumber', 'taxStatus']),
  ('c0000000-0000-0000-0000-000000000004', 'CONN_SECURITY_PRINT', 'India Security Press Card Print Pipeline', 'DEMO', 'PRINTING', 'REST_JSON', true, 'HEALTHY', 'SIMULATED', ARRAY['cardDispatchId']),
  ('c0000000-0000-0000-0000-000000000005', 'CONN_INDIAPOST', 'India Post Speed Post Tracking API', 'DEMO', 'DISPATCH', 'REST_JSON', true, 'HEALTHY', 'SIMULATED', ARRAY['trackingNumber', 'deliveryStatus']),
  ('c0000000-0000-0000-0000-000000000006', 'CONN_REVENUE', 'State Revenue & Tehsildar Income Registry', 'DEMO', 'OTHER', 'REST_JSON', true, 'HEALTHY', 'SIMULATED', ARRAY['annualIncome', 'certificateNumber', 'issuingAuthority']),
  ('c0000000-0000-0000-0000-000000000007', 'CONN_EDUCATION', 'AISHE / State Higher Education Registry', 'DEMO', 'OTHER', 'REST_JSON', true, 'HEALTHY', 'SIMULATED', ARRAY['enrollmentNumber', 'collegeCode', 'degree', 'academicYear']),
  ('c0000000-0000-0000-0000-000000000008', 'CONN_BANK_NPCI', 'NPCI Aadhaar-Seeded Bank Account Gateway', 'DEMO', 'OTHER', 'REST_JSON', true, 'HEALTHY', 'SIMULATED', ARRAY['accountNumber', 'ifsc', 'dbtSeededStatus']),
  ('c0000000-0000-0000-0000-000000000009', 'CONN_LAND_RECORDS', 'Bhoomi / Dharani Land Registry Gateway', 'DEMO', 'OTHER', 'REST_JSON', true, 'HEALTHY', 'SIMULATED', ARRAY['khasraNumber', 'surveyNumber', 'landAreaAcres', 'ownershipStatus'])
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  health_status = EXCLUDED.health_status,
  endpoint_mode = EXCLUDED.endpoint_mode,
  supported_data = EXCLUDED.supported_data;

-- 11. SEED ALL 7 AUTHORITATIVE SERVICES
-- Normalize any existing service codes from earlier migrations so ON CONFLICT (code) matches
UPDATE services SET code = 'POST_MATRIC_SCHOLARSHIP' WHERE id = 'a0000000-0000-0000-0000-000000000001' OR code = 'SCHOLARSHIP_01';
UPDATE services SET code = 'INSTANT_E_PAN' WHERE id = 'a0000000-0000-0000-0000-000000000002' OR code = 'PAN_ISSUANCE_01';

INSERT INTO services (id, code, name, description, provider_name, provider_level, category, priority, department_id, sub_department_id, version, is_active)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'POST_MATRIC_SCHOLARSHIP',
    'Post-Matric Scholarship for Higher Education',
    'Centrally sponsored scholarship covering college tuition fees and study maintenance for students pursuing degrees.',
    'Department of Higher Education',
    'CENTRAL',
    'Higher Education & Scholarships',
    'HIGH',
    'd0000000-0000-0000-0000-000000000002',
    '5d000000-0000-0000-0000-000000000002',
    2,
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'INSTANT_E_PAN',
    'Instant e-PAN & Physical Card Issuance (Form 49A)',
    'Paperless issuance of Permanent Account Number (PAN) by Income Tax Department with instant e-PAN and doorstep delivery.',
    'Income Tax Department / CBDT',
    'CENTRAL',
    'Identity & Tax',
    'NORMAL',
    'd0000000-0000-0000-0000-000000000001',
    '5d000000-0000-0000-0000-000000000001',
    2,
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'INCOME_CERTIFICATE',
    'Government Family Income Certificate Issuance',
    'Statutory certificate certifying annual family gross income for welfare scheme eligibility, concessions, and admissions.',
    'Department of Revenue',
    'STATE',
    'Revenue & Civil Certifications',
    'HIGH',
    'd0000000-0000-0000-0000-000000000003',
    '5d000000-0000-0000-0000-000000000003',
    1,
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    'LAND_RECORD',
    'Certified Land Record Extracts & Title Verification (RoR 1B)',
    'Digital extract of Record of Rights (RoR 1B), survey sketch, and encumbrance certificate for agricultural and non-agricultural holdings.',
    'Department of Revenue',
    'STATE',
    'Land Records & Agrarian Welfare',
    'NORMAL',
    'd0000000-0000-0000-0000-000000000003',
    '5d000000-0000-0000-0000-000000000004',
    1,
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000005',
    'PM_KISAN',
    'PM-Kisan Samman Nidhi Direct Income Support',
    'Direct benefit transfer of ₹6,000 per year in three four-monthly installments to small and marginal farmer families.',
    'Ministry of Agriculture & Farmers Welfare',
    'CENTRAL',
    'Agriculture & Rural Support',
    'HIGH',
    'd0000000-0000-0000-0000-000000000004',
    '5d000000-0000-0000-0000-000000000005',
    1,
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000006',
    'AYUSHMAN_BHARAT',
    'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    'Provides secondary and tertiary care hospitalization coverage of up to ₹5 Lakh per family per year to eligible beneficiaries.',
    'National Health Authority',
    'CENTRAL',
    'Healthcare & Social Security',
    'CRITICAL',
    'd0000000-0000-0000-0000-000000000005',
    '5d000000-0000-0000-0000-000000000006',
    1,
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000007',
    'PM_AWAS',
    'Pradhan Mantri Awas Yojana (PMAY-Urban/Gramin)',
    'Credit linked subsidy and direct assistance for constructing affordable pucca dwelling units with water, sanitation, and electricity.',
    'Ministry of Housing & Urban Affairs',
    'CENTRAL',
    'Housing & Urban Affairs',
    'NORMAL',
    'd0000000-0000-0000-0000-000000000006',
    '5d000000-0000-0000-0000-000000000007',
    1,
    true
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  department_id = EXCLUDED.department_id,
  sub_department_id = EXCLUDED.sub_department_id,
  is_active = EXCLUDED.is_active;

-- 12. SEED WORKFLOW DEFINITIONS FOR SERVICES
INSERT INTO workflow_definitions (id, service_id, code, version, is_active)
VALUES
  ('eb000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'WF_PAN_LIFECYCLE', 1, true),
  ('eb000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'WF_SCHOLARSHIP_LIFECYCLE', 1, true),
  ('eb000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'WF_INCOME_CERT_LIFECYCLE', 1, true),
  ('eb000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'WF_LAND_RECORD_LIFECYCLE', 1, true),
  ('eb000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'WF_PM_KISAN_LIFECYCLE', 1, true),
  ('eb000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', 'WF_AYUSHMAN_LIFECYCLE', 1, true),
  ('eb000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000007', 'WF_PM_AWAS_LIFECYCLE', 1, true)
ON CONFLICT (service_id, code, version) DO UPDATE SET is_active = EXCLUDED.is_active;

-- 13. SEED WORKFLOW STEPS FOR SCHOLARSHIP (Illustrating Service-Specific Business Flow)
INSERT INTO workflow_steps (id, workflow_definition_id, step_key, label, step_type, requires_human, can_run_async, connector_id, order_hint)
VALUES
  ('ec000000-0000-0000-0000-000000000010', 'eb000000-0000-0000-0000-000000000002', 'STEP_PRE_FLIGHT', 'Pre-Flight Data & Profile Validation', 'AUTOMATED', false, false, null, 1),
  ('ec000000-0000-0000-0000-000000000011', 'eb000000-0000-0000-0000-000000000002', 'STEP_CONSENT', 'DPDP Statutory Consent Verification', 'AUTOMATED', false, false, null, 2),
  ('ec000000-0000-0000-0000-000000000012', 'eb000000-0000-0000-0000-000000000002', 'STEP_ID_VERIFY', 'Identity & Aadhaar Demographic Match', 'AUTOMATED', false, true, 'c0000000-0000-0000-0000-000000000001', 3),
  ('ec000000-0000-0000-0000-000000000013', 'eb000000-0000-0000-0000-000000000002', 'STEP_INCOME_VERIFY', 'Income Threshold & Tehsildar Verification', 'AUTOMATED', false, true, 'c0000000-0000-0000-0000-000000000006', 4),
  ('ec000000-0000-0000-0000-000000000014', 'eb000000-0000-0000-0000-000000000002', 'STEP_EDU_VERIFY', 'College Enrollment & AISHE Accreditation', 'AUTOMATED', false, true, 'c0000000-0000-0000-0000-000000000007', 5),
  ('ec000000-0000-0000-0000-000000000015', 'eb000000-0000-0000-0000-000000000002', 'STEP_BANK_VERIFY', 'Aadhaar-NPCI Bank Account Seeding', 'AUTOMATED', false, true, 'c0000000-0000-0000-0000-000000000008', 6),
  ('ec000000-0000-0000-0000-000000000016', 'eb000000-0000-0000-0000-000000000002', 'STEP_OFFICER_REVIEW', 'Nodal Scholarship Officer Scrutiny', 'HUMAN', true, false, null, 7)
ON CONFLICT (workflow_definition_id, step_key) DO UPDATE SET
  label = EXCLUDED.label,
  requires_human = EXCLUDED.requires_human,
  can_run_async = EXCLUDED.can_run_async,
  connector_id = EXCLUDED.connector_id,
  order_hint = EXCLUDED.order_hint;

-- 14. SEED SERVICE REQUIREMENTS FOR ALL SERVICES
INSERT INTO service_requirements (id, service_id, requirement_key, requirement_type, label, field_key, document_type, required, order_index)
VALUES
  -- Income Certificate Requirements
  ('b2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'REQ_INC_AADHAAR', 'DOCUMENT', 'Aadhaar Card (Proof of Identity)', null, 'AADHAAR', true, 1),
  ('b2000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'REQ_INC_SALARY', 'DOCUMENT', 'Salary Slip / Employer Certificate or Form 16', null, 'INCOME_CERTIFICATE', true, 2),
  ('b2000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'REQ_INC_RATION', 'DOCUMENT', 'Ration Card / Proof of Household Members', null, 'OTHER', false, 3),

  -- Land Record Requirements
  ('b2000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'REQ_LAND_AADHAAR', 'DOCUMENT', 'Aadhaar Card (Pattadar / Owner ID)', null, 'AADHAAR', true, 1),
  ('b2000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004', 'REQ_LAND_PASSBOOK', 'DOCUMENT', 'Pattadar Passbook / Registered Sale Deed', null, 'OTHER', true, 2),

  -- PM Kisan Requirements
  ('b2000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000005', 'REQ_PMK_AADHAAR', 'DOCUMENT', 'Aadhaar Card (Landowner Farmer)', null, 'AADHAAR', true, 1),
  ('b2000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000005', 'REQ_PMK_BANK', 'DOCUMENT', 'Aadhaar-Seeded Bank Passbook Copy', null, 'BANK_PASSBOOK', true, 2),
  ('b2000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000005', 'REQ_PMK_LAND', 'DOCUMENT', 'Land Ownership Certificate / Khatiyan Copy', null, 'OTHER', true, 3),

  -- Ayushman Bharat Requirements
  ('b2000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000006', 'REQ_AB_AADHAAR', 'DOCUMENT', 'Aadhaar Card (Beneficiary e-KYC)', null, 'AADHAAR', true, 1),
  ('b2000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000006', 'REQ_AB_RATION', 'DOCUMENT', 'NFSA / State Food Security Card (Ration Card)', null, 'OTHER', true, 2),

  -- PM Awas Yojana Requirements
  ('b2000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000007', 'REQ_PMAY_AADHAAR', 'DOCUMENT', 'Aadhaar Card of Family Head', null, 'AADHAAR', true, 1),
  ('b2000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000007', 'REQ_PMAY_INCOME', 'DOCUMENT', 'Annual Household Income Certificate (< ₹3,00,000 for EWS)', null, 'INCOME_CERTIFICATE', true, 2),
  ('b2000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000007', 'REQ_PMAY_AFFIDAVIT', 'DOCUMENT', 'Affidavit confirming no existing pucca house ownership in India', null, 'OTHER', true, 3)
ON CONFLICT (service_id, requirement_key) DO UPDATE SET
  label = EXCLUDED.label,
  required = EXCLUDED.required,
  order_index = EXCLUDED.order_index;

-- 15. SEED ROUTING RULES (Structured Multi-Entity Dispatch)
INSERT INTO routing_rules (id, service_id, department_id, sub_department_id, office_id, target_role, conditions, priority_order, is_active)
VALUES
  -- Rule for PAN Issuance (Central Processing Cell)
  (
    '66000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000001',
    '5d000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000002',
    'DEPARTMENT_OFFICER',
    '{"serviceCode": "INSTANT_E_PAN"}'::jsonb,
    1,
    true
  ),
  -- Rule for Post-Matric Scholarship
  (
    '66000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    '5d000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000003',
    'DEPARTMENT_OFFICER',
    '{"serviceCode": "POST_MATRIC_SCHOLARSHIP"}'::jsonb,
    1,
    true
  ),
  -- Rule for Income Certificate
  (
    '66000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000003',
    '5d000000-0000-0000-0000-000000000003',
    'e0000000-0000-0000-0000-000000000004',
    'DEPARTMENT_OFFICER',
    '{"serviceCode": "INCOME_CERTIFICATE"}'::jsonb,
    1,
    true
  ),
  -- Rule for Land Record
  (
    '66000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000003',
    '5d000000-0000-0000-0000-000000000004',
    'e0000000-0000-0000-0000-000000000004',
    'DEPARTMENT_OFFICER',
    '{"serviceCode": "LAND_RECORD"}'::jsonb,
    1,
    true
  ),
  -- Rule for PM Kisan
  (
    '66000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000005',
    'd0000000-0000-0000-0000-000000000004',
    '5d000000-0000-0000-0000-000000000005',
    'e0000000-0000-0000-0000-000000000005',
    'DEPARTMENT_OFFICER',
    '{"serviceCode": "PM_KISAN"}'::jsonb,
    1,
    true
  ),
  -- Rule for Ayushman Bharat
  (
    '66000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000006',
    'd0000000-0000-0000-0000-000000000005',
    '5d000000-0000-0000-0000-000000000006',
    'e0000000-0000-0000-0000-000000000006',
    'DEPARTMENT_OFFICER',
    '{"serviceCode": "AYUSHMAN_BHARAT"}'::jsonb,
    1,
    true
  ),
  -- Rule for PM Awas
  (
    '66000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000007',
    'd0000000-0000-0000-0000-000000000006',
    '5d000000-0000-0000-0000-000000000007',
    'e0000000-0000-0000-0000-000000000007',
    'DEPARTMENT_OFFICER',
    '{"serviceCode": "PM_AWAS"}'::jsonb,
    1,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  department_id = EXCLUDED.department_id,
  sub_department_id = EXCLUDED.sub_department_id,
  office_id = EXCLUDED.office_id,
  conditions = EXCLUDED.conditions,
  priority_order = EXCLUDED.priority_order,
  is_active = EXCLUDED.is_active;
