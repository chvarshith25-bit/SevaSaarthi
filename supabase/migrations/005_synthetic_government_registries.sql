-- ====================================================================
-- SEVA SAARTHI MIGRATION 005: SYNTHETIC GOVERNMENT REGISTRIES (FOR MODEL 2)
-- ====================================================================
-- NOTICE: ALL DATA CONTAINED WITHIN THESE TABLES IS ENTIRELY SYNTHETIC AND
-- GENERATED FOR SMART INDIA HACKATHON (SIH) DEMONSTRATION PURPOSES.
-- NO REAL-WORLD IDENTIFIERS OR PRIVATE CITIZEN ATTRIBUTES ARE STORED.
-- ====================================================================

-- 1. Master Synthetic Citizen Directory
CREATE TABLE IF NOT EXISTS synthetic_master_citizens (
  citizen_id text PRIMARY KEY,
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
  father_name text,
  guardian_name text,
  mobile_number text,
  email text,
  address text NOT NULL,
  district text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  aadhaar_reference text NOT NULL UNIQUE,
  pan_reference text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Revenue Department Registry (Income & Tehsildar Certificates)
CREATE TABLE IF NOT EXISTS registry_revenue (
  id text PRIMARY KEY,
  citizen_id text REFERENCES synthetic_master_citizens(citizen_id) ON DELETE SET NULL,
  name text NOT NULL,
  father_name text,
  dob date NOT NULL,
  address text NOT NULL,
  district text,
  income_certificate_number text NOT NULL UNIQUE,
  annual_income numeric(12,2) NOT NULL,
  certificate_status text NOT NULL CHECK (certificate_status IN ('ACTIVE', 'EXPIRED', 'PENDING', 'CANCELLED')),
  issue_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Education / Scholarship Registry (AISHE & NSP)
CREATE TABLE IF NOT EXISTS registry_education (
  id text PRIMARY KEY,
  citizen_id text REFERENCES synthetic_master_citizens(citizen_id) ON DELETE SET NULL,
  student_name text NOT NULL,
  dob date NOT NULL,
  college_name text NOT NULL,
  course text NOT NULL,
  scholarship_id text NOT NULL UNIQUE,
  scholarship_status text NOT NULL CHECK (scholarship_status IN ('DISBURSED', 'SANCTIONED', 'APPLIED', 'REJECTED')),
  academic_year text NOT NULL,
  income_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Agriculture Registry (PM-Kisan & Land Holding Support)
CREATE TABLE IF NOT EXISTS registry_agriculture (
  id text PRIMARY KEY,
  citizen_id text REFERENCES synthetic_master_citizens(citizen_id) ON DELETE SET NULL,
  farmer_name text NOT NULL,
  village text NOT NULL,
  district text,
  land_reference text NOT NULL,
  pm_kisan_status text NOT NULL CHECK (pm_kisan_status IN ('ACTIVE', 'INELIGIBLE', 'PENDING_VERIFICATION')),
  bank_reference text,
  eligibility_status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Health Registry (Ayushman Bharat PM-JAY)
CREATE TABLE IF NOT EXISTS registry_health (
  id text PRIMARY KEY,
  citizen_id text REFERENCES synthetic_master_citizens(citizen_id) ON DELETE SET NULL,
  beneficiary_name text NOT NULL,
  dob date NOT NULL,
  health_scheme_id text NOT NULL UNIQUE,
  ayushman_status text NOT NULL CHECK (ayushman_status IN ('ACTIVE', 'SUSPENDED', 'VERIFICATION_REQUIRED')),
  family_reference text,
  eligibility_status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Housing Registry (Pradhan Mantri Awas Yojana PMAY)
CREATE TABLE IF NOT EXISTS registry_housing (
  id text PRIMARY KEY,
  citizen_id text REFERENCES synthetic_master_citizens(citizen_id) ON DELETE SET NULL,
  applicant_name text NOT NULL,
  address text NOT NULL,
  district text,
  household_income numeric(12,2) NOT NULL,
  housing_scheme_id text NOT NULL UNIQUE,
  housing_status text NOT NULL CHECK (housing_status IN ('SANCTIONED', 'UNDER_CONSTRUCTION', 'COMPLETED', 'APPLIED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Land Records Registry (Bhoomi / RoR 1B)
CREATE TABLE IF NOT EXISTS registry_land (
  id text PRIMARY KEY,
  citizen_id text REFERENCES synthetic_master_citizens(citizen_id) ON DELETE SET NULL,
  owner_name text NOT NULL,
  survey_number text NOT NULL,
  village text NOT NULL,
  district text NOT NULL,
  land_area text NOT NULL,
  ownership_status text NOT NULL CHECK (ownership_status IN ('SOLE_OWNER', 'JOINT_OWNER', 'DISPUTED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. PAN / Tax Registry (CBDT Income Tax)
CREATE TABLE IF NOT EXISTS registry_pan (
  id text PRIMARY KEY,
  citizen_id text REFERENCES synthetic_master_citizens(citizen_id) ON DELETE SET NULL,
  name text NOT NULL,
  dob date NOT NULL,
  pan_reference text NOT NULL UNIQUE,
  pan_status text NOT NULL CHECK (pan_status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')),
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Ground-Truth Entity Resolution Links (Evaluation Gold Standard)
CREATE TABLE IF NOT EXISTS synthetic_entity_ground_truth (
  id text PRIMARY KEY,
  master_citizen_id text NOT NULL REFERENCES synthetic_master_citizens(citizen_id) ON DELETE CASCADE,
  source_registry text NOT NULL,
  source_record_id text NOT NULL,
  candidate_citizen_id text,
  match_type text NOT NULL CHECK (match_type IN (
    'EXACT',
    'FUZZY_NAME',
    'INITIALS',
    'TRANSLITERATION_VARIATION',
    'ADDRESS_VARIATION',
    'NON_MATCH_NAME_COLLISION',
    'NON_MATCH_DISTINCT'
  )),
  ground_truth_match boolean NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast lookup by name, DOB, phone, district, and references
CREATE INDEX IF NOT EXISTS idx_synth_master_name ON synthetic_master_citizens (full_name);
CREATE INDEX IF NOT EXISTS idx_synth_master_dob ON synthetic_master_citizens (date_of_birth);
CREATE INDEX IF NOT EXISTS idx_synth_master_district ON synthetic_master_citizens (district);
CREATE INDEX IF NOT EXISTS idx_synth_master_pincode ON synthetic_master_citizens (pincode);

CREATE INDEX IF NOT EXISTS idx_reg_revenue_name ON registry_revenue (name);
CREATE INDEX IF NOT EXISTS idx_reg_revenue_dob ON registry_revenue (dob);
CREATE INDEX IF NOT EXISTS idx_reg_revenue_cert ON registry_revenue (income_certificate_number);

CREATE INDEX IF NOT EXISTS idx_reg_edu_name ON registry_education (student_name);
CREATE INDEX IF NOT EXISTS idx_reg_edu_sch ON registry_education (scholarship_id);

CREATE INDEX IF NOT EXISTS idx_reg_agri_name ON registry_agriculture (farmer_name);
CREATE INDEX IF NOT EXISTS idx_reg_health_name ON registry_health (beneficiary_name);
CREATE INDEX IF NOT EXISTS idx_reg_housing_name ON registry_housing (applicant_name);
CREATE INDEX IF NOT EXISTS idx_reg_land_owner ON registry_land (owner_name);
CREATE INDEX IF NOT EXISTS idx_reg_pan_ref ON registry_pan (pan_reference);
CREATE INDEX IF NOT EXISTS idx_gt_master_id ON synthetic_entity_ground_truth (master_citizen_id);
