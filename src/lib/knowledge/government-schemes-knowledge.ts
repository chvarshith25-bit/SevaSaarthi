export interface DocumentProcurementGuide {
  documentType: string;
  name: string;
  issuingAuthority: string;
  issuingPortal?: string;
  portalUrl?: string;
  typicalTurnaround: string;
  validityPeriod: string;
  maxFileSize: string;
  acceptableFormats: string[];
  mandatoryCriteria: string[];
  procurementSteps: string[];
  commonRejectionReasons: string[];
  helpline?: string;
}

export interface SchemeProcessStage {
  stageNumber: number;
  stageName: string;
  responsibleParty: string;
  timeline: string;
  description: string;
  actionItems: string[];
  verificationCriteria: string[];
}

export interface SchemeApplicationWorkflow {
  schemeId: string;
  schemeName: string;
  officialPortal: string;
  portalDomain: string;
  schemeType: "CENTRAL_SCHOLARSHIP" | "STATE_SCHOLARSHIP" | "HEALTH_INSURANCE" | "HOUSING" | "SKILL_DEVELOPMENT";
  stages: SchemeProcessStage[];
  requiredDocuments: string[];
  grievanceRedressal: {
    portal: string;
    helpline: string;
    email: string;
    escalationLevel: string;
  };
}

// ----------------------------------------------------------------------
// 1. Authoritative Document Procurement Knowledge Base
// ----------------------------------------------------------------------
export const DOCUMENT_PROCUREMENT_GUIDES: Record<string, DocumentProcurementGuide> = {
  BONAFIDE_CERTIFICATE: {
    documentType: "BONAFIDE_CERTIFICATE",
    name: "Institutional Bonafide Student Certificate",
    issuingAuthority: "Academic Section / Principal's Office of Recognized College or University",
    issuingPortal: "Higher Education Portal (AISHE)",
    portalUrl: "https://aishe.gov.in",
    typicalTurnaround: "1 - 2 Working Days",
    validityPeriod: "Current Academic Year (2025-26)",
    maxFileSize: "200 KB",
    acceptableFormats: ["PDF", "JPG", "PNG"],
    mandatoryCriteria: [
      "Must be printed on the official institution letterhead",
      "Must clearly mention student's Full Name, Roll No / Hall Ticket No, and Admission Year",
      "Must state the exact degree program and current year of study (e.g. B.Tech CSE 3rd Year)",
      "Must state the college's national AISHE (All India Survey on Higher Education) code",
      "Must bear the physical signature of the Principal / Dean with the official institutional round seal",
    ],
    procurementSteps: [
      "Visit your college Administrative Office / Academic Section counter.",
      "Submit a written application or fill the institution's Bonafide Request Form attaching a copy of your college ID card.",
      "The academic clerk verifies your active enrollment and fee clearance, then prints the certificate on college letterhead.",
      "The certificate is signed by the Head of Department / Academic Dean and stamped with the Principal's official seal.",
      "Collect the physical document, scan it at 150-200 DPI as a crisp PDF under 200 KB, and upload to your Formly vault.",
    ],
    commonRejectionReasons: [
      "Missing college round seal or Principal's signature",
      "College AISHE institution code not mentioned on the letterhead",
      "Certificate issued for a past academic session instead of current year",
      "Low-resolution or blurry mobile phone photograph of crumpled paper",
    ],
  },

  INCOME_CERTIFICATE: {
    documentType: "INCOME_CERTIFICATE",
    name: "Annual Family Income Certificate",
    issuingAuthority: "Revenue Department (Tahsildar / Mandal Revenue Officer - MRO / Sub-Divisional Magistrate)",
    issuingPortal: "National Government Services Portal (e-District)",
    portalUrl: "https://services.india.gov.in/service/search?kw=Income+Certificate",
    typicalTurnaround: "3 - 7 Working Days",
    validityPeriod: "1 Financial Year (Must be issued on or after April 1st of current financial year)",
    maxFileSize: "200 KB",
    acceptableFormats: ["PDF", "JPG"],
    mandatoryCriteria: [
      "Certified total annual family household income must not exceed scheme ceiling (₹2,50,000 for Post-Matric SC/ST/OBC)",
      "Must be issued in the name of the student's parent/guardian or applicant with family relation explicitly stated",
      "Must carry a verifiable digital signature, QR code, and unique state Revenue Application Number",
      "Must be issued by the revenue jurisdiction where the family permanently resides",
    ],
    procurementSteps: [
      "Open your State Citizen Services portal (e.g. MeeSeva in Telangana/AP, e-District in Delhi/UP, Nadakacheri in Karnataka, Seva Sindhu in Karnataka) or visit the nearest Common Service Center (CSC).",
      "Submit applicant identity proof (Aadhaar), parent's proof of income (Salary Slip / Form 16 / IT Return / Notarized Income Affidavit), and proof of residence (Ration Card / Voter ID).",
      "The Village Revenue Officer (VRO) and Revenue Inspector (RI) conduct inquiry and submit field inspection report.",
      "The Tahsildar approves and signs the certificate digitally with an official QR code.",
      "Download the digitally signed PDF from the portal or collect the digitally stamped hard copy from the MeeSeva center.",
    ],
    commonRejectionReasons: [
      "Certificate issued in the previous financial year (Income certificates expire annually on March 31st)",
      "Annual income recorded exceeds the scholarship threshold limit of ₹2,50,000",
      "Name spelling on income certificate differs from student's 10th marksheet or Aadhaar card",
      "Unregistered notary affidavit uploaded instead of government Tahsildar-issued certificate",
    ],
    helpline: "Toll-Free MeeSeva: 1800-425-4440 | CSC Helpline: 14599",
  },

  CASTE_CERTIFICATE: {
    documentType: "CASTE_CERTIFICATE",
    name: "Community / Caste / Social Category Certificate",
    issuingAuthority: "Revenue Department (Tahsildar / Sub-Divisional Magistrate)",
    issuingPortal: "National Government Services Portal (e-District)",
    portalUrl: "https://services.india.gov.in/service/search?kw=Caste+Certificate",
    typicalTurnaround: "7 - 14 Working Days",
    validityPeriod: "Permanent / Lifetime (Non-Creamy Layer OBC valid for 1 Year)",
    maxFileSize: "200 KB",
    acceptableFormats: ["PDF", "JPG"],
    mandatoryCriteria: [
      "Must clearly mention candidate's Caste / Sub-caste and Category (SC / ST / OBC / BC / EWS)",
      "Must bear verifiable digital signature with Tahsildar seal and barcode / QR verification code",
      "Candidate Name and Father's Name must match Aadhaar card",
    ],
    procurementSteps: [
      "Apply through State Citizen Services portal (MeeSeva / e-District) or visit a local Citizen Service Center.",
      "Submit applicant Aadhaar card, parent's caste certificate or school transfer certificate (TC) showing caste.",
      "Revenue Inspector / VRO validates historical lineage in village revenue records.",
      "Tahsildar issues digitally signed Caste Certificate.",
      "Download and upload the PDF with verified QR code into your Formly Vault.",
    ],
    commonRejectionReasons: [
      "Submitting Non-Creamy Layer (NCL) certificate older than 1 year for OBC category",
      "Spelling discrepancies between student name in caste certificate and 10th marks memo",
      "Unregistered private caste affidavits without official revenue seal",
    ],
    helpline: "CSC Helpline: 14599",
  },

  AADHAAR: {
    documentType: "AADHAAR",
    name: "Aadhaar Card (UIDAI Verified)",
    issuingAuthority: "Unique Identification Authority of India (UIDAI)",
    issuingPortal: "UIDAI myAadhaar Portal",
    portalUrl: "https://myaadhaar.uidai.gov.in",
    typicalTurnaround: "Instant Download (e-Aadhaar with OTP)",
    validityPeriod: "Permanent (Lifetime)",
    maxFileSize: "200 KB",
    acceptableFormats: ["PDF", "JPG"],
    mandatoryCriteria: [
      "12-digit Aadhaar UID must be active and linked to the applicant's registered mobile number",
      "Student's Full Name, Father's Name, and Date of Birth must match Class 10 Certificate character-by-character",
      "Must be seeded with National Payments Corporation of India (NPCI) for Aadhaar Direct Benefit Transfer (DBT)",
    ],
    procurementSteps: [
      "Visit myaadhaar.uidai.gov.in and click 'Download Aadhaar'.",
      "Enter your 12-digit Aadhaar number and solve the CAPTCHA.",
      "Enter the 6-digit OTP received on your Aadhaar-linked mobile number.",
      "Download the password-protected e-Aadhaar PDF (password is First 4 letters of your name in CAPITALS + Year of Birth).",
      "Upload the PDF to Formly Vault where our AI engine verifies the digital signature.",
    ],
    commonRejectionReasons: [
      "Mismatch in Name spelling or Date of Birth between Aadhaar and Matriculation certificate",
      "Aadhaar not seeded with active bank account for DBT payment",
      "Inactive or suspended Aadhaar due to pending biometric update (mandatory for age 15+)",
    ],
    helpline: "UIDAI Toll-Free: 1947",
  },

  BANK_PASSBOOK: {
    documentType: "BANK_PASSBOOK",
    name: "Aadhaar-NPCI Seeded Bank Savings Passbook",
    issuingAuthority: "Nationalized or Scheduled Commercial Bank (e.g. SBI, PNB, Canara Bank, Union Bank)",
    issuingPortal: "UIDAI Bank Seeding Status / NPCI",
    portalUrl: "https://myaadhaar.uidai.gov.in/check-aadhaar-banking-status",
    typicalTurnaround: "Immediate (at Bank Branch)",
    validityPeriod: "Valid while account is active and operational",
    maxFileSize: "200 KB",
    acceptableFormats: ["PDF", "JPG"],
    mandatoryCriteria: [
      "Account must be in the student's individual name (Joint accounts are rejected by PFMS)",
      "Account must be active (not dormant or inoperative)",
      "Account must be seeded with NPCI mapper for Direct Benefit Transfer (DBT) credit",
      "Passbook copy must clearly display Account Number, Account Holder Name, Bank Name, Branch, and 11-digit IFSC code",
    ],
    procurementSteps: [
      "Open a savings account in any scheduled commercial bank in the student's own name.",
      "Submit the 'NPCI Aadhaar Mandate & Seeding Form (Annexure 1)' to the bank branch manager.",
      "Request the bank official to flag the account for DBT credit on the NPCI portal.",
      "Check your DBT status on myaadhaar.uidai.gov.in under 'Bank Seeding Status' to confirm 'Active' status.",
      "Get your passbook printed with latest transactions, scan the first page clearly showing your name and IFSC, and upload to Formly.",
    ],
    commonRejectionReasons: [
      "Account is linked for SMS/ATM but NOT seeded with NPCI for Government DBT (causes 80% of scholarship disbursement rejections)",
      "Uploading parent's bank passbook instead of the student's individual bank account",
      "Dormant account due to no transactions in the last 6 months",
      "Rural / cooperative bank account with non-CBS (non-standard) IFSC code",
    ],
  },

  MARKSHEET: {
    documentType: "MARKSHEET",
    name: "Previous Qualifying Examination Marksheet",
    issuingAuthority: "State Board of Intermediate Education / CBSE / University Controller of Examinations",
    issuingPortal: "DigiLocker National Vault",
    portalUrl: "https://www.digilocker.gov.in",
    typicalTurnaround: "Instant on DigiLocker",
    validityPeriod: "Permanent",
    maxFileSize: "200 KB",
    acceptableFormats: ["PDF", "JPG"],
    mandatoryCriteria: [
      "Must be the marksheet of the immediate preceding examination passed (e.g. Class 12 for 1st Year UG, or 2nd Year Marksheet for 3rd Year UG)",
      "Must show minimum qualifying aggregate percentage (usually 50% - 60% depending on category)",
      "Candidate Name and Roll Number must be clearly visible and match the application record",
    ],
    procurementSteps: [
      "Log into digilocker.gov.in or the DigiLocker App using your Aadhaar number and mobile OTP.",
      "Navigate to 'Education' and select your Board (e.g. CBSE, TSBIE, BIEAP, State Technical Board).",
      "Enter your Roll Number, Passing Year, and Examination Registration Number.",
      "Download the government-signed Class 12 / Intermediate certificate with verified DigiLocker green tick.",
      "Upload the authentic digital PDF to your Formly Vault.",
    ],
    commonRejectionReasons: [
      "Uploading internal college midterm marks instead of official Board / University semester grade memo",
      "Aggregate percentage below the minimum scheme cutoff threshold",
      "Failed or backlog subjects not cleared in the regular qualifying attempt",
    ],
  },

  DOMICILE_CERTIFICATE: {
    documentType: "DOMICILE_CERTIFICATE",
    name: "Domicile / Nativity / Residence Certificate",
    issuingAuthority: "Revenue Department (Tahsildar / Sub-Divisional Magistrate)",
    issuingPortal: "National Government Services Portal (e-District)",
    portalUrl: "https://services.india.gov.in/service/search?kw=Domicile+Certificate",
    typicalTurnaround: "5 - 10 Working Days",
    validityPeriod: "Permanent (Valid until residence changes)",
    maxFileSize: "200 KB",
    acceptableFormats: ["PDF", "JPG"],
    mandatoryCriteria: [
      "Must certify continuous residence in the awarding State/UT for the statutory qualifying period (typically 5 to 10 years)",
      "Must carry official government revenue seal and digital certificate number",
      "Candidate Name must match Aadhaar card",
    ],
    procurementSteps: [
      "Apply through your state's online portal (MeeSeva / e-District) or visit a local Citizen Service Center.",
      "Attach residential proofs: continuous Study Certificates from Class 1 to 10, Ration Card, Electricity Bills, or Parent's Property Tax Receipt.",
      "Revenue Inspector verifies resident records in the local municipal or panchayat register.",
      "Tahsildar approves and signs the digital Domicile / Nativity Certificate.",
      "Download the PDF containing the QR verification code and upload it to your vault.",
    ],
    commonRejectionReasons: [
      "Submitting a temporary electricity bill or rent agreement instead of statutory Revenue Domicile Certificate",
      "Incomplete study history failing to demonstrate 5+ consecutive years in the state",
    ],
  },

  COLLEGE_ID: {
    documentType: "COLLEGE_ID",
    name: "College Student Identity Card",
    issuingAuthority: "College Administration / Student Affairs Section",
    issuingPortal: "Department of Higher Education / AISHE",
    portalUrl: "https://aishe.gov.in",
    typicalTurnaround: "Issued at time of admission/enrollment",
    validityPeriod: "Valid for entire degree duration (e.g. 2022-2026)",
    maxFileSize: "200 KB",
    acceptableFormats: ["PDF", "JPG", "PNG"],
    mandatoryCriteria: [
      "Must display student's clear facial photograph, Full Name, Course Name, and Roll Number",
      "Must show validity period covering the current academic year",
      "Must display official college seal and signature of the Principal / Dean",
    ],
    procurementSteps: [
      "Collect your laminated smart student identity card from the college admissions or examination cell.",
      "Ensure your photo, enrollment number, branch, and academic validity are crisp and legible.",
      "Scan both the front and back of the ID card on a single page or as a two-page PDF under 200 KB.",
      "Upload to your Formly Vault for automated OCR extraction.",
    ],
    commonRejectionReasons: [
      "Expired validity date stamped on the card",
      "Missing college name or student enrollment roll number",
      "Blurry mobile snapshot with flash glare obscuring text",
    ],
  },

  RATION_CARD: {
    documentType: "RATION_CARD",
    name: "National Food Security Ration Card (NFSA)",
    issuingAuthority: "Department of Food & Public Distribution / Civil Supplies Department",
    issuingPortal: "National Food Security Portal (NFSA)",
    portalUrl: "https://nfsa.gov.in",
    typicalTurnaround: "15 - 30 Working Days",
    validityPeriod: "Permanent (Subject to annual family member verification)",
    maxFileSize: "200 KB",
    acceptableFormats: ["PDF", "JPG"],
    mandatoryCriteria: [
      "Must display all eligible household family members' names with relationship to head of family",
      "Must list active Ration Card Number and FPS (Fair Price Shop) allocation code",
      "Head of family and applicant names must match Aadhaar database",
    ],
    procurementSteps: [
      "Log into the National Food Security Portal (nfsa.gov.in) or state Food & Civil Supplies portal.",
      "Navigate to 'Ration Card' > 'Know your Ration Card Details' using Aadhaar number.",
      "Download the digitally certified ration card family sheet PDF.",
      "Upload the PDF or clear scanned photograph into your Formly Vault.",
    ],
    commonRejectionReasons: [
      "Applicant name missing from the family member roster",
      "Old expired BPL card without digital ration card barcode",
    ],
    helpline: "National Toll-Free: 1967",
  },

  PAN_CARD: {
    documentType: "PAN_CARD",
    name: "Permanent Account Number (e-PAN)",
    issuingAuthority: "Income Tax Department (CBDT) / Protean NSDL",
    issuingPortal: "Income Tax e-Filing Portal",
    portalUrl: "https://eportal.incometax.gov.in/iec/foservices/#/pre-login/instant-e-pan",
    typicalTurnaround: "Instant (10 Minutes with Aadhaar OTP)",
    validityPeriod: "Permanent (Lifetime)",
    maxFileSize: "200 KB",
    acceptableFormats: ["PDF", "JPG"],
    mandatoryCriteria: [
      "10-character alphanumeric PAN issued by Income Tax Department",
      "Must be linked to active 12-digit Aadhaar UID",
      "Name and Date of Birth must match official government ID records",
    ],
    procurementSteps: [
      "Visit incometax.gov.in > 'Instant e-PAN' section.",
      "Enter your 12-digit Aadhaar number and authenticate with OTP sent to linked mobile.",
      "Confirm demographic details pulled directly from UIDAI database.",
      "Download the digitally signed e-PAN PDF within 10 minutes.",
    ],
    commonRejectionReasons: [
      "Aadhaar name spelling mismatch with PAN applicant name",
      "Unlinked PAN and Aadhaar records",
    ],
    helpline: "Income Tax Helpline: 1800-180-1961",
  },

  DRIVING_LICENSE: {
    documentType: "DRIVING_LICENSE",
    name: "Learner's License / Smart Card Driving License",
    issuingAuthority: "Ministry of Road Transport & Highways (MoRTH) / State RTO",
    issuingPortal: "Parivahan Sarathi Portal",
    portalUrl: "https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do",
    typicalTurnaround: "Same-day online test for Learner's License; 15 days for Driving License",
    validityPeriod: "Learner's License: 6 Months; Permanent DL: 20 Years",
    maxFileSize: "200 KB",
    acceptableFormats: ["PDF", "JPG"],
    mandatoryCriteria: [
      "Must be issued by designated Regional Transport Office (RTO)",
      "Applicant must be minimum 18 years of age with Class 10 DOB certificate",
      "DL number verifiable on the national Parivahan Sarathi database",
    ],
    procurementSteps: [
      "Visit sarathi.parivahan.gov.in and select your state.",
      "Click 'Apply for Learner License' and choose Aadhaar-authenticated contactless mode.",
      "Take the online road safety video tutorial and traffic rules test.",
      "Download the instant Learner's Permit PDF and upload to your Formly Vault.",
    ],
    commonRejectionReasons: [
      "Expired learner license (more than 6 months old)",
      "Medical fitness form 1A missing for transport category licenses",
    ],
    helpline: "Parivahan Helpline: 0120-4925505",
  },
};

// ----------------------------------------------------------------------
// 2. Official End-to-End Application Workflow for Indian Schemes
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// 2. Official End-to-End Application Workflow for Indian Schemes
// ----------------------------------------------------------------------
export const OFFICIAL_NSP_WORKFLOW: SchemeApplicationWorkflow = {
  schemeId: "s001",
  schemeName: "Post-Matric Scholarship for SC/ST/OBC Students (National Scholarship Portal)",
  officialPortal: "https://scholarships.gov.in",
  portalDomain: "scholarships.gov.in",
  schemeType: "CENTRAL_SCHOLARSHIP",
  stages: [
    {
      stageNumber: 1,
      stageName: "Pre-Application & Document Procurement",
      responsibleParty: "Applicant Citizen",
      timeline: "1 - 2 Weeks Before Portal Deadline",
      description: "Assemble mandatory verifiable government documents and seed bank account for Direct Benefit Transfer.",
      actionItems: [
        "Download latest e-Aadhaar and ensure mobile number is linked for OTP verification.",
        "Obtain current year Income Certificate from Tahsildar (annual family income < ₹2,50,000).",
        "Request Bonafide Certificate with AISHE institution code from college registrar.",
        "Submit Aadhaar Seeding (DBT Annexure-1) at bank branch and verify active status on NPCI mapper.",
      ],
      verificationCriteria: [
        "Aadhaar Name matches Matriculation (10th) mark memo exactly",
        "Bank account active and NPCI DBT mapped",
        "All documents converted to PDF/JPG under 200 KB",
      ],
    },
    {
      stageNumber: 2,
      stageName: "One-Time Registration (OTR) on NSP Portal",
      responsibleParty: "Applicant via scholarships.gov.in",
      timeline: "Day 1 (Instant)",
      description: "Create a verified national applicant identity using Aadhaar Face-RD or Aadhaar Mobile OTP.",
      actionItems: [
        "Navigate to scholarships.gov.in and click 'Apply for OTR (One Time Registration)'.",
        "Complete Aadhaar e-KYC using FaceRD mobile app or Aadhaar OTP.",
        "Enter parent details, permanent address, and active mobile number.",
        "Receive unique 14-digit permanent OTR Number (e.g. 20252600012345) and set secure password.",
      ],
      verificationCriteria: [
        "UIDAI e-KYC authentication successful",
        "Aadhaar demographic data locked into NSP master record",
      ],
    },
    {
      stageNumber: 3,
      stageName: "Online Scheme Application & Document Submission",
      responsibleParty: "Applicant via scholarships.gov.in",
      timeline: "Day 2 - 3",
      description: "Select academic institution by AISHE code, fill academic profile, and upload verified documents.",
      actionItems: [
        "Log into NSP with 14-digit OTR number and password.",
        "Select your college using the official AISHE Code (e.g. C-19736 for Vidya Jyothi Institute of Technology).",
        "Enter Admission/Roll Number, course name (e.g. B.Tech Computer Science), admission year, and current year.",
        "Enter previous qualifying examination marks (min 50% aggregate).",
        "Upload Bonafide Certificate, Income Certificate, Caste Certificate, Marksheet, and Passbook.",
        "Preview completed application, agree to declaration, and click 'Final Submit'.",
        "Download and print the completed Application Summary Form with barcode.",
      ],
      verificationCriteria: [
        "College AISHE code matches student's bonafide certificate",
        "Annual income matches uploaded Tahsildar income certificate",
        "Application status updates to 'Submitted - Pending Institute Verification'",
      ],
    },
    {
      stageNumber: 4,
      stageName: "Level 1: Institute Nodal Officer (INO) Verification",
      responsibleParty: "College Scholarship In-Charge / Principal",
      timeline: "Within 15 - 30 Days of Submission",
      description: "Your college administration verifies your physical admission, attendance, and bonafide status on the official portal.",
      actionItems: [
        "Submit printed NSP application form along with physical photocopies of documents to College Scholarship Section.",
        "College verifies admission records, branch, tuition fee receipts, and roll number against enrollment register.",
        "Institute Nodal Officer (INO) logs into NSP portal using college credentials and approves application.",
      ],
      verificationCriteria: [
        "Student is actively enrolled with minimum 75% attendance",
        "No duplicate application filed in any other institution",
        "Application status updates to 'Verified by Institute - Pending District/State Verification'",
      ],
    },
    {
      stageNumber: 5,
      stageName: "Level 2: State Nodal Approval & Direct Benefit Transfer (PFMS DBT)",
      responsibleParty: "State Welfare Department & Ministry of Social Justice / PFMS",
      timeline: "30 - 60 Days Post-Verification",
      description: "State Nodal Officer sanctions the scholarship budget and PFMS credits funds directly to the student's bank account.",
      actionItems: [
        "District Nodal Officer (DNO) and State Nodal Officer (SNO) verify domicile and revenue certificates.",
        "Sanction Order generated by Ministry of Social Justice & Empowerment.",
        "Public Financial Management System (PFMS) validates bank account on NPCI Aadhaar mapper.",
        "Full tuition fee reimbursed to college / state treasury, and maintenance allowance credited directly to student's bank account.",
      ],
      verificationCriteria: [
        "PFMS account validation returned with status 'Accepted by Bank'",
        "SMS notification received on mobile confirming DBT credit reference number",
      ],
    },
  ],
  requiredDocuments: [
    "Aadhaar Card (UIDAI verified with mobile linkage)",
    "Institutional Bonafide Certificate with Principal seal & AISHE code",
    "Current Financial Year Income Certificate (< ₹2,50,000)",
    "Caste / Social Category Certificate (OBC / SC / ST)",
    "Class 10 (Matriculation) & Class 12 / Intermediate Marksheet",
    "Aadhaar-NPCI Seeded Bank Savings Passbook",
    "Current Academic Year College Fee Receipt",
  ],
  grievanceRedressal: {
    portal: "https://scholarships.gov.in/complaint",
    helpline: "0120-6619540 (NSP Helpdesk, 8 AM - 8 PM)",
    email: "helpdesk@nsp.gov.in",
    escalationLevel: "District Backward Classes / SC / ST Welfare Officer",
  },
};

export const SCHEME_WORKFLOWS_MAP: Record<string, SchemeApplicationWorkflow> = {
  s001: OFFICIAL_NSP_WORKFLOW,
  s002: {
    schemeId: "s002",
    schemeName: "Central Sector Scholarship Scheme (PM-USP)",
    officialPortal: "https://scholarships.gov.in",
    portalDomain: "scholarships.gov.in",
    schemeType: "CENTRAL_SCHOLARSHIP",
    stages: OFFICIAL_NSP_WORKFLOW.stages,
    requiredDocuments: [
      "Aadhaar Card (UIDAI linked)",
      "Class 12 / Intermediate Marksheet (> 80th percentile)",
      "College Bonafide Certificate with AISHE Code",
      "Income Certificate (< ₹4.5 Lakhs)",
      "DBT Bank Passbook",
    ],
    grievanceRedressal: {
      portal: "https://scholarships.gov.in",
      helpline: "0120-6619540",
      email: "helpdesk@nsp.gov.in",
      escalationLevel: "Ministry of Education (Department of Higher Education)",
    },
  },
  s003: {
    schemeId: "s003",
    schemeName: "Instant e-PAN Card Application",
    officialPortal: "https://eportal.incometax.gov.in/iec/foservices/#/pre-login/instant-e-pan",
    portalDomain: "incometax.gov.in",
    schemeType: "CENTRAL_SCHOLARSHIP",
    stages: [
      {
        stageNumber: 1,
        stageName: "Aadhaar e-KYC Authentication",
        responsibleParty: "Applicant via Income Tax e-Filing",
        timeline: "Instant (2 Minutes)",
        description: "Enter 12-digit Aadhaar UID and verify with one-time password (OTP) sent to linked mobile number.",
        actionItems: ["Visit Income Tax Portal", "Enter 12-digit Aadhaar Number", "Submit OTP"],
        verificationCriteria: ["Aadhaar demographic data validated with UIDAI database"],
      },
      {
        stageNumber: 2,
        stageName: "Validate Details & Father's Name",
        responsibleParty: "Income Tax Department (CBDT)",
        timeline: "Instant",
        description: "Verify auto-populated name, date of birth, photo, and address from Aadhaar master record.",
        actionItems: ["Verify extracted demographic information", "Accept declaration & terms"],
        verificationCriteria: ["No previous PAN allotted against this Aadhaar UID"],
      },
      {
        stageNumber: 3,
        stageName: "Digital PAN Generation & Download",
        responsibleParty: "Protean / UTIITSL / CBDT",
        timeline: "Within 10 Minutes",
        description: "Digitally signed e-PAN is generated with official QR code and made available for instant download.",
        actionItems: ["Download password protected e-PAN PDF", "Verify digital signature"],
        verificationCriteria: ["10-character PAN active on Income Tax master registry"],
      },
    ],
    requiredDocuments: ["Aadhaar Card (Linked with Active Mobile)"],
    grievanceRedressal: {
      portal: "https://eportal.incometax.gov.in",
      helpline: "1800-180-1961",
      email: "ask@incometax.gov.in",
      escalationLevel: "Income Tax Assessing Officer (AO)",
    },
  },
  s004: {
    schemeId: "s004",
    schemeName: "Ayushman Bharat PM-JAY & ABHA Health Card",
    officialPortal: "https://beneficiary.nha.gov.in",
    portalDomain: "beneficiary.nha.gov.in",
    schemeType: "HEALTH_INSURANCE",
    stages: [
      {
        stageNumber: 1,
        stageName: "Beneficiary Search & Eligibility Check",
        responsibleParty: "Applicant via NHA Portal",
        timeline: "Instant",
        description: "Search household in SECC / Ration card database using mobile number, Aadhaar, or Ration Card ID.",
        actionItems: ["Login with Mobile OTP", "Select State and District", "Search Family ID"],
        verificationCriteria: ["Family found in NFSA / SECC eligible database"],
      },
      {
        stageNumber: 2,
        stageName: "Aadhaar e-KYC Verification",
        responsibleParty: "Applicant & National Health Authority",
        timeline: "1 - 2 Minutes",
        description: "Complete live biometric or mobile OTP authentication for all eligible family members.",
        actionItems: ["Submit Aadhaar OTP or Face Auth", "Upload live selfie photograph"],
        verificationCriteria: ["Matching score > 80% with Aadhaar record"],
      },
      {
        stageNumber: 3,
        stageName: "Ayushman Card Generation & Download",
        responsibleParty: "National Health Authority (NHA)",
        timeline: "Immediate to 24 Hours",
        description: "Download PVC Ayushman Card with ₹5,00,000 annual cashless health cover per family.",
        actionItems: ["Download PVC Ayushman Card PDF", "Present at any empanelled hospital"],
        verificationCriteria: ["Active PM-JAY ABHA ID generated"],
      },
    ],
    requiredDocuments: ["Aadhaar Card", "Ration Card / Food Security Card", "Active Mobile Number"],
    grievanceRedressal: {
      portal: "https://cgrms.pmjay.gov.in",
      helpline: "14555",
      email: "pmjay@nha.gov.in",
      escalationLevel: "State Health Agency (SHA) Nodal Officer",
    },
  },
  s005: {
    schemeId: "s005",
    schemeName: "Pradhan Mantri Awas Yojana - Urban (PMAY-U)",
    officialPortal: "https://pmay-urban.gov.in",
    portalDomain: "pmay-urban.gov.in",
    schemeType: "HOUSING",
    stages: [
      {
        stageNumber: 1,
        stageName: "Citizen Assessment Registration",
        responsibleParty: "Applicant via PMAYMIS",
        timeline: "Day 1",
        description: "Register online or at Common Service Center (CSC) with Aadhaar and family income details.",
        actionItems: ["Enter Aadhaar and Name", "Fill household income and urban town details"],
        verificationCriteria: ["Applicant does not own a pucca house in India"],
      },
      {
        stageNumber: 2,
        stageName: "ULB / Municipal Corporation Verification",
        responsibleParty: "Urban Local Body (Municipal Town Planning)",
        timeline: "15 - 30 Days",
        description: "Municipal revenue officials conduct physical site verification and socio-economic survey.",
        actionItems: ["Submit income and land title deeds to municipality", "Geo-tagging of proposed site"],
        verificationCriteria: ["Annual family income certified under EWS (< ₹3L) or LIG (< ₹6L) bracket"],
      },
      {
        stageNumber: 3,
        stageName: "DPR Approval & Subsidy Disbursal",
        responsibleParty: "State Level Sanctioning Committee (SLSMC) & MoHUA",
        timeline: "30 - 90 Days",
        description: "Interest subsidy credited directly to beneficiary home loan account via Central Nodal Agency (CNA).",
        actionItems: ["Track CLSS subsidy status on CLAP portal", "Receive direct construction installments"],
        verificationCriteria: ["Subsidy credited through DBT direct transfer"],
      },
    ],
    requiredDocuments: ["Aadhaar Card", "Income Certificate", "Bank Passbook", "Domicile Certificate"],
    grievanceRedressal: {
      portal: "https://pmay-urban.gov.in",
      helpline: "011-23063285",
      email: "pmaymis-mohua@gov.in",
      escalationLevel: "Municipal Commissioner / Project Director",
    },
  },
  s006: {
    schemeId: "s006",
    schemeName: "PM Kaushal Vikas Yojana 4.0 (Skill India)",
    officialPortal: "https://www.skillindiadigital.gov.in",
    portalDomain: "skillindiadigital.gov.in",
    schemeType: "SKILL_DEVELOPMENT",
    stages: [
      {
        stageNumber: 1,
        stageName: "Skill India Digital Registration",
        responsibleParty: "Applicant via Skill India Digital Hub",
        timeline: "Instant",
        description: "Create digital learner profile using Aadhaar e-KYC and select Industry 4.0 course.",
        actionItems: ["Login via SIDH portal", "Complete skill assessment questionnaire"],
        verificationCriteria: ["Aadhaar verified candidate account"],
      },
      {
        stageNumber: 2,
        stageName: "Training & Practical Hands-on Labs",
        responsibleParty: "NSDC Accredited Training Partner",
        timeline: "30 - 90 Days",
        description: "Attend classroom and industry lab sessions with biometric attendance tracking.",
        actionItems: ["Complete practical modules", "Maintain minimum 80% biometric attendance"],
        verificationCriteria: ["Course curriculum requirements completed"],
      },
      {
        stageNumber: 3,
        stageName: "Assessment, Certification & Stipend",
        responsibleParty: "Sector Skill Council (SSC) & NSDC",
        timeline: "15 Days Post-Training",
        description: "Pass national skill assessment test to receive NSDC Certification and ₹8,000 direct bank stipend.",
        actionItems: ["Appear for online exam", "Receive DigiLocker verifiable certificate", "Check bank DBT"],
        verificationCriteria: ["Score > 60% on SSC exam; DBT credited"],
      },
    ],
    requiredDocuments: ["Aadhaar Card", "Educational Marksheet / College ID", "DBT Bank Passbook"],
    grievanceRedressal: {
      portal: "https://www.skillindiadigital.gov.in",
      helpline: "080-69255255",
      email: "support@skillindiadigital.gov.in",
      escalationLevel: "NSDC Grievance Cell",
    },
  },
  s007: {
    schemeId: "s007",
    schemeName: "Driving License & Learner's Permit (Sarathi)",
    officialPortal: "https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do",
    portalDomain: "parivahan.gov.in",
    schemeType: "CENTRAL_SCHOLARSHIP",
    stages: [
      {
        stageNumber: 1,
        stageName: "Online Application & Aadhaar e-KYC",
        responsibleParty: "Applicant via Sarathi Parivahan",
        timeline: "Instant",
        description: "Select state, choose contactless Aadhaar authentication, and submit license category.",
        actionItems: ["Fill Form 2 online", "Upload Class 10 DOB certificate", "Pay official fee"],
        verificationCriteria: ["Age verified >= 18 years"],
      },
      {
        stageNumber: 2,
        stageName: "Online Learner License (LL) Test",
        responsibleParty: "Applicant at Home / RTO",
        timeline: "Same Day (Instant Online Test)",
        description: "Watch road safety video tutorial and take 15-question online traffic sign test.",
        actionItems: ["Take online mock test", "Pass final test with >= 60%"],
        verificationCriteria: ["Instant Learner's License issued digitally"],
      },
      {
        stageNumber: 3,
        stageName: "Driving Skill Test & Smart Card DL",
        responsibleParty: "Regional Transport Office (RTO)",
        timeline: "After 30 Days of Learner's License",
        description: "Book practical driving test slot at automated testing track to receive smart card driving license.",
        actionItems: ["Book slot on Sarathi portal", "Appear for practical vehicle driving test", "Speed Post delivery"],
        verificationCriteria: ["Test passed and digital DL issued on DigiLocker / mParivahan"],
      },
    ],
    requiredDocuments: ["Aadhaar Card", "Class 10 Marksheet (DOB Proof)", "Passport Photograph"],
    grievanceRedressal: {
      portal: "https://sarathi.parivahan.gov.in",
      helpline: "0120-4925505",
      email: "helpdesk-sarathi@gov.in",
      escalationLevel: "Regional Transport Officer (RTO)",
    },
  },
  s008: {
    schemeId: "s008",
    schemeName: "Income, Domicile & Caste Certificate (e-District)",
    officialPortal: "https://services.india.gov.in/service/search?kw=Certificate",
    portalDomain: "services.india.gov.in",
    schemeType: "CENTRAL_SCHOLARSHIP",
    stages: [
      {
        stageNumber: 1,
        stageName: "Online Application & Document Submission",
        responsibleParty: "Applicant via State e-District / National Portal",
        timeline: "Day 1",
        description: "Submit revenue service application with Aadhaar, ration card, and previous study/income proofs.",
        actionItems: ["Register on state portal", "Fill applicant particulars", "Upload supporting documents"],
        verificationCriteria: ["Application number generated with tracking SMS"],
      },
      {
        stageNumber: 2,
        stageName: "Field Inquiry & Revenue Verification",
        responsibleParty: "Village Revenue Officer (VRO) & Revenue Inspector (RI)",
        timeline: "3 - 7 Days",
        description: "Field officers verify residence, family assets, and community lineage in government revenue records.",
        actionItems: ["Field inquiry by revenue inspector", "Submission of verification report to Tahsildar"],
        verificationCriteria: ["Inquiry report approved"],
      },
      {
        stageNumber: 3,
        stageName: "Digital Signing & Certificate Issuance",
        responsibleParty: "Tahsildar / Sub-Divisional Magistrate (SDM)",
        timeline: "7 - 10 Days",
        description: "Tahsildar digitally signs the certificate with security QR code for instant online verification.",
        actionItems: ["Download digitally signed certificate PDF", "Verify on DigiLocker"],
        verificationCriteria: ["Certificate verifiable nationwide via QR code"],
      },
    ],
    requiredDocuments: ["Aadhaar Card", "Study Certificates (Class 1-10)", "Salary Proof / Income Affidavit"],
    grievanceRedressal: {
      portal: "https://services.india.gov.in",
      helpline: "1800-111-555",
      email: "support.sp@gov.in",
      escalationLevel: "District Revenue Officer (DRO) / District Collector",
    },
  },
};

export function getSchemeWorkflow(schemeId: string, schemeName?: string, portalUrl?: string, portalDomain?: string): SchemeApplicationWorkflow {
  if (SCHEME_WORKFLOWS_MAP[schemeId]) {
    return SCHEME_WORKFLOWS_MAP[schemeId];
  }
  return {
    ...OFFICIAL_NSP_WORKFLOW,
    schemeId,
    schemeName: schemeName || "Government Scheme",
    officialPortal: portalUrl || "https://services.india.gov.in",
    portalDomain: portalDomain || "services.india.gov.in",
  };
}

