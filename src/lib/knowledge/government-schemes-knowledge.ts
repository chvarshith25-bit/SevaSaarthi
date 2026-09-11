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
    issuingPortal: "State e-District / MeeSeva Portal",
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
    issuingPortal: "State e-District / MeeSeva Portal",
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
};

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
    portal: "scholarships.gov.in/complaint / cpgrams.gov.in",
    helpline: "0120 - 6619540 (NSP Helpdesk, 8 AM - 8 PM)",
    email: "helpdesk@nsp.gov.in",
    escalationLevel: "District Backward Classes / SC / ST Welfare Officer",
  },
};
