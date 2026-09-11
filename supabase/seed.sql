-- ================================================================
-- FORMLY MVP — SEED DATA (Supabase / Postgres)
-- MVP Service: National Post-Matric Scholarship for Higher Education
-- ================================================================

insert into services (id, name, description, official_url, official_domain, category, is_active)
values (
  'a0000000-0000-0000-0000-000000000001',
  'Post-Matric Scholarship for Higher Education',
  'Central & State sponsored scholarship scheme for students pursuing post-matriculation or post-secondary courses in recognized colleges and universities. Covers tuition fees, maintenance allowance, and study grants.',
  'https://scholarships.gov.in',
  'scholarships.gov.in',
  'Higher Education & Scholarships',
  true
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  official_url = excluded.official_url,
  official_domain = excluded.official_domain,
  category = excluded.category,
  is_active = excluded.is_active;

-- Service Requirements
insert into service_requirements (id, service_id, requirement_type, field_name, label, required, guidance_text, notes, display_order)
values
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'IDENTITY_DOCUMENT',
    null,
    'Aadhaar Card (UIDAI)',
    true,
    'Download an e-Aadhaar PDF from the official UIDAI portal (myaadhaar.uidai.gov.in) using your registered mobile number OTP, or upload a clear color scan of the front and back of your physical card. Ensure the 12-digit number, name, and DOB match your academic records.',
    'AADHAAR',
    1
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'INCOME_DOCUMENT',
    null,
    'Income Certificate (Current Financial Year)',
    true,
    'Obtain this from your local Tahsildar / Revenue Mandal Officer or state citizen service portal (MeeSeva / e-District / Nadakacheri). It must certify your annual family income is below ₹2,50,000 and have a valid digital signature or official seal.',
    'INCOME_CERTIFICATE',
    2
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'EDUCATION_DOCUMENT',
    null,
    'College Student ID Card or Bonafide Certificate',
    true,
    'Request a Bonafide Certificate from your college administrative office / Dean of Student Affairs, or upload a clear scan of your valid student photo ID card showing your Roll Number, Degree, and current academic year.',
    'COLLEGE_ID',
    3
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'EDUCATION_DOCUMENT',
    null,
    'Previous Qualifying Exam / Semester Marksheet',
    true,
    'Upload your Class 12 / Intermediate marks memo or last completed semester grade sheet issued by your board or university. Minimum passing percentage required: 50% for general, 45% for reserved categories.',
    'PREVIOUS_MARKSHEET',
    4
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'BANK_DOCUMENT',
    null,
    'Bank Passbook Copy / Cancelled Cheque',
    true,
    'Provide a scanned copy of the first page of your active bank savings account passbook showing your Full Name, Account Number, and IFSC Code. The account must be seeded with your Aadhaar for Direct Benefit Transfer (DBT).',
    'BANK_PASSBOOK',
    5
  ),
  (
    'b0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    'PERSONAL_INFORMATION',
    'full_name',
    'Applicant Full Name (as per 10th / Aadhaar)',
    true,
    'Ensure your full name matches character-by-character with your matriculation certificate and Aadhaar card. Discrepancies can lead to application rejection by the verification officer.',
    null,
    6
  ),
  (
    'b0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000001',
    'PERSONAL_INFORMATION',
    'date_of_birth',
    'Date of Birth',
    true,
    'Must match the Date of Birth recorded in your 10th standard certificate and Aadhaar card (DD/MM/YYYY format).',
    null,
    7
  ),
  (
    'b0000000-0000-0000-0000-000000000008',
    'a0000000-0000-0000-0000-000000000001',
    'PERSONAL_INFORMATION',
    'annual_income',
    'Annual Family Income (in INR)',
    true,
    'Enter the exact gross annual household income amount mentioned in your government issued Income Certificate (must be <= ₹2,50,000).',
    null,
    8
  ),
  (
    'b0000000-0000-0000-0000-000000000009',
    'a0000000-0000-0000-0000-000000000001',
    'PERSONAL_INFORMATION',
    'college_name',
    'Current College / University Name',
    true,
    'Select or enter your registered AISHE (All India Survey on Higher Education) affiliated institution name.',
    null,
    9
  ),
  (
    'b0000000-0000-0000-0000-000000000010',
    'a0000000-0000-0000-0000-000000000001',
    'DECLARATION',
    null,
    'Domicile / Residence Certificate',
    false,
    'Issued by Tehsildar / Sub-Divisional Magistrate verifying residency in the awarding state. Optional if Aadhaar address already reflects continuous 5+ year residency.',
    'DOMICILE_CERTIFICATE',
    10
  )
on conflict (id) do update set
  label = excluded.label,
  required = excluded.required,
  guidance_text = excluded.guidance_text,
  notes = excluded.notes,
  display_order = excluded.display_order;
