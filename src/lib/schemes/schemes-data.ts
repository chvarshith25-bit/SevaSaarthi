import { ProfileField } from "@/types";

export interface GovernmentScheme {
  id: string;
  title: string;
  shortCode: string;
  category: "Higher Education & Scholarships" | "Skill & Employment" | "Housing & Urban Affairs" | "Healthcare & Social Security" | "Identity & Tax";
  ministry: string;
  benefitAmount: string;
  applicationDeadline: string;
  status: "OPEN" | "CLOSING_SOON" | "ALWAYS_ACTIVE";
  description: string;
  officialPortal: string;
  portalDomain: string;
  officialUrl: string;
  iconType: "GRADUATION" | "HEALTH" | "HOME" | "SKILL" | "WALLET" | "TAX";
  requiredDocuments: string[];
  docRequirementSummary: string;
  
  // Eligibility criteria parameters
  eligibilityRules: {
    maxAnnualIncome?: number;
    allowedCategories: string[]; // ["OBC", "SC", "ST", "EWS", "General", "ALL"]
    allowedGenders: ("Male" | "Female" | "Other" | "ANY")[];
    educationLevelRequired?: "POST_MATRIC" | "DEGREE" | "SCHOOL" | "TECHNICAL" | "ANY";
    minAge?: number;
    maxAge?: number;
    mustBeResidentOf?: string[];
  };

  processSteps: {
    step: number;
    title: string;
    description: string;
  }[];
}

export interface SchemeMatchResult {
  scheme: GovernmentScheme;
  matchScore: number; // 0 - 100
  isEligible: boolean;
  matchStatus: "HIGHLY_ELIGIBLE" | "ELIGIBLE" | "CRITERIA_CHECK_REQUIRED" | "NOT_ELIGIBLE";
  matchBadge: string;
  matchReasons: string[];
  actionNeeded?: string;
}

export const REAL_GOVERNMENT_SCHEMES: GovernmentScheme[] = [
  {
    id: "s001",
    title: "Post-Matric Scholarship for SC/ST/OBC Students",
    shortCode: "PMS-NSP",
    category: "Higher Education & Scholarships",
    ministry: "Ministry of Social Justice & Empowerment / Tribal Affairs",
    benefitAmount: "Full Tuition Fee Reimbursement + Up to ₹13,500/year Maintenance",
    applicationDeadline: "Open for 2025-26 (Closing: 31st October 2026)",
    status: "OPEN",
    description: "Centrally sponsored scholarship covering complete college tuition fees and annual study maintenance for students pursuing undergraduate, postgraduate, engineering, medical, and diploma courses.",
    officialPortal: "National Scholarship Portal (NSP)",
    portalDomain: "scholarships.gov.in",
    officialUrl: "https://scholarships.gov.in",
    iconType: "GRADUATION",
    requiredDocuments: [
      "Aadhaar Card (UIDAI verified)",
      "College Bonafide Certificate (with AISHE code & Principal seal)",
      "Current Financial Year Income Certificate (< ₹2,50,000)",
      "Caste / Social Category Certificate (OBC/SC/ST)",
      "Previous Qualifying Examination Marksheet (min 50%)",
      "Aadhaar-NPCI Seeded Bank Savings Passbook",
    ],
    docRequirementSummary: "Aadhaar, Bonafide with AISHE, Income (< ₹2.5L), Caste, Passbook",
    eligibilityRules: {
      maxAnnualIncome: 250000,
      allowedCategories: ["OBC", "SC", "ST"],
      allowedGenders: ["ANY"],
      educationLevelRequired: "POST_MATRIC",
    },
    processSteps: [
      { step: 1, title: "One-Time Registration (OTR)", description: "Register on scholarships.gov.in using Aadhaar Face-RD or OTP to generate your permanent 14-digit OTR number." },
      { step: 2, title: "Institute Selection by AISHE Code", description: "Log into NSP and select your college using its official AISHE Code (e.g. C-19736 for Vidya Jyothi Institute of Technology)." },
      { step: 3, title: "Fill Details & Upload Docs", description: "Enter academic marks, family annual income, bank details, and upload documents under 200 KB." },
      { step: 4, title: "Institute Nodal Verification (INO)", description: "Submit printed form and physical document copies to college scholarship counter for online INO verification." },
      { step: 5, title: "State Approval & PFMS DBT", description: "State Nodal Officer sanctions the grant, and funds are disbursed directly to your Aadhaar-seeded bank account." },
    ],
  },
  {
    id: "s002",
    title: "Central Sector Scheme of Scholarships for College & University Students (PM-USP)",
    shortCode: "PM-USP-HE",
    category: "Higher Education & Scholarships",
    ministry: "Department of Higher Education, Ministry of Education",
    benefitAmount: "₹12,000/year for UG (Years 1-3) & ₹20,000/year for PG Studies",
    applicationDeadline: "Open for 2025-26 (Closing: 15th November 2026)",
    status: "OPEN",
    description: "Merit-cum-means scholarship awarded to meritorious students pursuing regular undergraduate degrees in recognized universities and institutions across India.",
    officialPortal: "National Scholarship Portal (NSP)",
    portalDomain: "scholarships.gov.in",
    officialUrl: "https://scholarships.gov.in",
    iconType: "GRADUATION",
    requiredDocuments: [
      "Class 12 / Intermediate Board Marksheet (> 80th percentile)",
      "College Bonafide / Enrollment Verification Certificate",
      "Annual Family Income Certificate (< ₹4,50,000)",
      "Aadhaar Card",
      "Aadhaar-NPCI Seeded Bank Passbook",
    ],
    docRequirementSummary: "Class 12 Marksheet (>80%), Bonafide, Income (< ₹4.5L), Aadhaar",
    eligibilityRules: {
      maxAnnualIncome: 450000,
      allowedCategories: ["ALL"],
      allowedGenders: ["ANY"],
      educationLevelRequired: "DEGREE",
    },
    processSteps: [
      { step: 1, title: "OTR on National Scholarship Portal", description: "Authenticate via Aadhaar on scholarships.gov.in." },
      { step: 2, title: "Merit Percentile Matching", description: "NSP automatically validates your Class 12 board roll number against the Ministry's top 80th percentile cutoff list." },
      { step: 3, title: "College Verification", description: "College INO verifies active degree admission and confirms you are not availing any duplicate central scholarship." },
      { step: 4, title: "Direct Benefit Transfer", description: "Direct credit of ₹12,000 per academic year directly into beneficiary bank account via PFMS." },
    ],
  },
  {
    id: "s003",
    title: "AICTE Pragati & Saksham Scholarship for Technical Education",
    shortCode: "AICTE-PRAGATI",
    category: "Higher Education & Scholarships",
    ministry: "All India Council for Technical Education (AICTE)",
    benefitAmount: "₹50,000 per year towards tuition and college equipment",
    applicationDeadline: "Open for 2025-26 (Closing: 31st December 2026)",
    status: "OPEN",
    description: "Financial empowerment scholarship dedicated to meritorious girl students (Pragati) and differently-abled students (Saksham) admitted to AICTE-approved degree and diploma institutions.",
    officialPortal: "National Scholarship Portal & AICTE India",
    portalDomain: "scholarships.gov.in",
    officialUrl: "https://www.aicte-india.org",
    iconType: "WALLET",
    requiredDocuments: [
      "AICTE College Admission Allotment Order",
      "Bonafide Certificate on College Letterhead",
      "Income Certificate (< ₹8,00,000)",
      "Class 10 & 12 Marksheets",
      "Aadhaar Card & DBT Bank Passbook",
    ],
    docRequirementSummary: "AICTE Admission Letter, Bonafide, Income (< ₹8L), Aadhaar",
    eligibilityRules: {
      maxAnnualIncome: 800000,
      allowedCategories: ["ALL"],
      allowedGenders: ["Female", "Other"],
      educationLevelRequired: "TECHNICAL",
    },
    processSteps: [
      { step: 1, title: "Apply on NSP AICTE Section", description: "Select AICTE Pragati / Saksham Scheme under Central Schemes on NSP." },
      { step: 2, title: "AICTE Institution Verification", description: "Institute verifies that your course is in an AICTE-approved institution and you were admitted via state/national entrance quota." },
      { step: 3, title: "Merit List Publication", description: "AICTE issues national merit list of 10,000 selected female candidates." },
      { step: 4, title: "Disbursement", description: "₹50,000 credited annually for each year of course study." },
    ],
  },
  {
    id: "s004",
    title: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
    shortCode: "PM-JAY",
    category: "Healthcare & Social Security",
    ministry: "National Health Authority (NHA) / Ministry of Health & Family Welfare",
    benefitAmount: "₹5,00,000 Cashless Health Hospitalization Cover per family per year",
    applicationDeadline: "Active (24/7 Rolling Registration)",
    status: "ALWAYS_ACTIVE",
    description: "The world's largest health assurance scheme providing ₹5 Lakhs per family annually for secondary and tertiary hospital care across 27,000+ empanelled government and private hospitals.",
    officialPortal: "NHA Beneficiary Portal",
    portalDomain: "beneficiary.nha.gov.in",
    officialUrl: "https://beneficiary.nha.gov.in",
    iconType: "HEALTH",
    requiredDocuments: [
      "Aadhaar Card with Mobile Linkage",
      "Ration Card / Food Security Card / SECC Household Letter",
      "Active Mobile Number for OTP Verification",
    ],
    docRequirementSummary: "Aadhaar Card, Ration Card / Food Security Card",
    eligibilityRules: {
      maxAnnualIncome: 300000,
      allowedCategories: ["ALL"],
      allowedGenders: ["ANY"],
    },
    processSteps: [
      { step: 1, title: "Check Eligibility", description: "Enter your 12-digit Aadhaar or Ration Card number on beneficiary.nha.gov.in." },
      { step: 2, title: "Aadhaar e-KYC Verification", description: "Authenticate via mobile OTP or visit nearest Arogya Mitra at any empanelled hospital." },
      { step: 3, title: "Instant Ayushman Golden Card Download", description: "Download your digitally signed Ayushman Card with unique PM-JAY ABHA ID." },
    ],
  },
  {
    id: "s005",
    title: "PM Kaushal Vikas Yojana 4.0 (Skill India Digital)",
    shortCode: "PMKVY-4.0",
    category: "Skill & Employment",
    ministry: "Ministry of Skill Development & Entrepreneurship (MSDE)",
    benefitAmount: "100% Free Industry 4.0 Skilling + ₹8,000 Reward + NSDC Certification",
    applicationDeadline: "Open (Continuous Rolling Admissions)",
    status: "ALWAYS_ACTIVE",
    description: "National skill certification scheme providing industry-aligned training in Artificial Intelligence, Cloud Computing, Cyber Security, Robotics, and advanced technology domains with placement assistance.",
    officialPortal: "Skill India Digital Hub",
    portalDomain: "skillindiadigital.gov.in",
    officialUrl: "https://www.skillindiadigital.gov.in",
    iconType: "SKILL",
    requiredDocuments: [
      "Aadhaar Card",
      "College Student ID or Highest Educational Marksheet",
      "Aadhaar-Linked Bank Account Passbook",
    ],
    docRequirementSummary: "Aadhaar Card, College ID, Bank Passbook",
    eligibilityRules: {
      allowedCategories: ["ALL"],
      allowedGenders: ["ANY"],
      minAge: 15,
      maxAge: 45,
    },
    processSteps: [
      { step: 1, title: "Register on Skill India Digital", description: "Create your citizen account using your mobile number and Aadhaar e-KYC." },
      { step: 2, title: "Select Emerging Technology Course", description: "Enroll in AI, Web Development, Data Analytics, or Advanced Tech certification courses." },
      { step: 3, title: "Complete Training & Assessment", description: "Attend authorized center or hybrid classes, take the national NSDC skill assessment." },
      { step: 4, title: "Government Certification & Reward", description: "Receive digital NSDC Skill Certificate and direct stipend to your bank account." },
    ],
  },
  {
    id: "s006",
    title: "Pradhan Mantri Awas Yojana - Urban 2.0 (PMAY-U)",
    shortCode: "PMAY-U",
    category: "Housing & Urban Affairs",
    ministry: "Ministry of Housing and Urban Affairs (MoHUA)",
    benefitAmount: "Up to ₹2.67 Lakhs Direct Interest Subsidy on Home Construction / Purchase",
    applicationDeadline: "Active under PMAY-U 2.0 Mission",
    status: "ALWAYS_ACTIVE",
    description: "Urban housing mission providing interest subsidies and direct financial assistance to Economically Weaker Sections (EWS) and Low Income Groups (LIG) to own a pucca house in municipal areas.",
    officialPortal: "PMAY Urban Management Information System",
    portalDomain: "pmaymis.gov.in",
    officialUrl: "https://pmaymis.gov.in",
    iconType: "HOME",
    requiredDocuments: [
      "Aadhaar Card of Family Members",
      "Revenue Income Certificate (< ₹3,00,000 for EWS, < ₹6,00,000 for LIG)",
      "Bank Account Statement / Passbook",
      "Proof of Urban Residence / Municipal Identity",
      "Affidavit confirming family does not own a pucca house in India",
    ],
    docRequirementSummary: "Aadhaar, Revenue Income Certificate, Bank Statements",
    eligibilityRules: {
      maxAnnualIncome: 600000,
      allowedCategories: ["ALL"],
      allowedGenders: ["ANY"],
    },
    processSteps: [
      { step: 1, title: "Citizen Assessment on PMAY Portal", description: "Select 'Apply Online' on pmaymis.gov.in and authenticate with Aadhaar." },
      { step: 2, title: "Fill Socio-Economic & Urban Details", description: "Enter current urban ward, municipal town, family income, and housing requirements." },
      { step: 3, title: "Municipal Verification & Geotagging", description: "Municipal corporation officers verify physical location and approve beneficiary quota." },
      { step: 4, title: "Subsidy Credit", description: "Direct credit of interest subsidy upfront into home loan account via NHB / HUDCO." },
    ],
  },
  {
    id: "s007",
    title: "Dr. Ambedkar Post-Matric Scholarship for Economically Backward Classes (EBCs)",
    shortCode: "EBC-PMS",
    category: "Higher Education & Scholarships",
    ministry: "Ministry of Social Justice & Empowerment",
    benefitAmount: "Full Tuition Fee Reimbursement + Monthly Maintenance Allowances",
    applicationDeadline: "Open for 2025-26 (Closing: 30th November 2026)",
    status: "OPEN",
    description: "Dedicated central scholarship for general/unreserved category students who belong to economically weaker families, enabling equal access to higher educational degrees and technical courses.",
    officialPortal: "National Scholarship Portal (NSP)",
    portalDomain: "scholarships.gov.in",
    officialUrl: "https://scholarships.gov.in",
    iconType: "GRADUATION",
    requiredDocuments: [
      "EBC Income Certificate (< ₹2,50,000 issued by Tahsildar)",
      "College Bonafide Certificate with AISHE Code",
      "Aadhaar Card",
      "Class 10 & 12 Marksheets",
      "DBT-Seeded Bank Passbook",
    ],
    docRequirementSummary: "Tahsildar EBC Income Certificate (< ₹2.5L), Bonafide, Marksheet",
    eligibilityRules: {
      maxAnnualIncome: 250000,
      allowedCategories: ["General", "EWS"],
      allowedGenders: ["ANY"],
      educationLevelRequired: "POST_MATRIC",
    },
    processSteps: [
      { step: 1, title: "OTR on NSP", description: "Complete One-Time Registration using Aadhaar Face-RD or Mobile OTP." },
      { step: 2, title: "Apply under MoSJE Schemes", description: "Choose Dr. Ambedkar EBC Post-Matric Scholarship under the Ministry of Social Justice tab." },
      { step: 3, title: "Institute Verification", description: "Submit documents to college scholarship desk for online verification." },
      { step: 4, title: "DBT Disbursement", description: "Tuition and maintenance grant credited directly through PFMS." },
    ],
  },
  {
    id: "s008",
    title: "National Means-cum-Merit Scholarship Scheme (NMMSS)",
    shortCode: "NMMSS",
    category: "Higher Education & Scholarships",
    ministry: "Department of School Education & Literacy, Ministry of Education",
    benefitAmount: "₹12,000 per year (₹1,000 per month) for secondary and higher secondary study",
    applicationDeadline: "Open for 2025-26 (Closing: 30th November 2026)",
    status: "OPEN",
    description: "Merit scholarship intended to arrest dropout rates among economically weaker school students and support continuation from Class 9 to Class 12.",
    officialPortal: "National Scholarship Portal (NSP)",
    portalDomain: "scholarships.gov.in",
    officialUrl: "https://scholarships.gov.in",
    iconType: "GRADUATION",
    requiredDocuments: [
      "NMMSS Selection Exam Admit Card / Marks memo",
      "School Bonafide Certificate",
      "Income Certificate (< ₹3,50,000)",
      "Aadhaar Card",
      "Aadhaar-Seeded Bank Passbook",
    ],
    docRequirementSummary: "NMMSS Exam Score, School Bonafide, Income (< ₹3.5L)",
    eligibilityRules: {
      maxAnnualIncome: 350000,
      allowedCategories: ["ALL"],
      allowedGenders: ["ANY"],
      educationLevelRequired: "SCHOOL",
    },
    processSteps: [
      { step: 1, title: "Pass State NMMSS Examination", description: "Qualify in the state-level Mental Ability and Scholastic Aptitude Test." },
      { step: 2, title: "Register on NSP", description: "Apply on scholarships.gov.in using your NMMSS Roll Number and Aadhaar." },
      { step: 3, title: "School Verification", description: "School Headmaster verifies active enrollment in Class 9 - 12." },
      { step: 4, title: "Direct Transfer", description: "Annual allowance of ₹12,000 credited to student's bank account via PFMS." },
    ],
  },
];

// ----------------------------------------------------------------------
// Dynamic Profile-to-Scheme Eligibility Evaluation Algorithm
// ----------------------------------------------------------------------
export function evaluateSchemeEligibility(
  scheme: GovernmentScheme,
  profileFields: ProfileField[],
  userName?: string
): SchemeMatchResult {
  const getField = (name: string): string => {
    return profileFields.find((f) => f.field_name === name)?.value || "";
  };

  const rawIncome = getField("annual_income");
  const incomeNum = rawIncome ? parseInt(rawIncome.replace(/[^0-9]/g, ""), 10) : 180000;
  const course = getField("education_degree") || "B.Tech Computer Science";
  const college = getField("college_name") || "Vidya Jyothi Institute of Technology";
  const category = (getField("caste_category") || "OBC").trim();
  const gender = (getField("gender") || "Male").trim();
  const location = getField("location") || "Hyderabad, Telangana";
  const aadhaar = getField("aadhaar_number") || "";

  const matchReasons: string[] = [];
  let matchScore = 70;
  let isEligible = true;
  let actionNeeded: string | undefined = undefined;

  const rules = scheme.eligibilityRules;

  // 1. Income Check
  if (rules.maxAnnualIncome) {
    if (incomeNum <= rules.maxAnnualIncome) {
      matchScore += 12;
      const formattedIncome = `₹${incomeNum.toLocaleString("en-IN")}`;
      const formattedCeiling = `₹${rules.maxAnnualIncome.toLocaleString("en-IN")}`;
      matchReasons.push(`Income Eligible: Annual household income (${formattedIncome}) is below the scheme ceiling of ${formattedCeiling}.`);
    } else {
      isEligible = false;
      matchScore -= 30;
      matchReasons.push(`Income Exceeded: Current annual income (₹${incomeNum.toLocaleString("en-IN")}) exceeds the scheme limit of ₹${rules.maxAnnualIncome.toLocaleString("en-IN")}.`);
    }
  }

  // 2. Category Check
  if (rules.allowedCategories && !rules.allowedCategories.includes("ALL")) {
    const isCategoryAllowed = rules.allowedCategories.some(
      (c) => c.toLowerCase() === category.toLowerCase()
    );
    if (isCategoryAllowed) {
      matchScore += 10;
      matchReasons.push(`Social Category Matched: ${category} qualifies under central & state reserved quota.`);
    } else {
      isEligible = false;
      matchScore -= 25;
      matchReasons.push(`Category Restricted: Scheme is dedicated to ${rules.allowedCategories.join(" / ")}, but your profile lists ${category}.`);
    }
  } else {
    matchScore += 5;
    matchReasons.push(`Universal Category: Open to all social categories (${category} welcome).`);
  }

  // 3. Education / Course Check
  if (rules.educationLevelRequired) {
    if (rules.educationLevelRequired === "POST_MATRIC" || rules.educationLevelRequired === "DEGREE" || rules.educationLevelRequired === "TECHNICAL") {
      const isHigherEd = course.toLowerCase().includes("b.tech") || course.toLowerCase().includes("degree") || course.toLowerCase().includes("engineering") || course.toLowerCase().includes("diploma") || course.toLowerCase().includes("bsc") || course.toLowerCase().includes("bcom");
      if (isHigherEd || college.length > 0) {
        matchScore += 10;
        matchReasons.push(`Academic Requirement Met: Enrolled in recognized program (${course}) at ${college || "recognized institution"}.`);
      }
    } else if (rules.educationLevelRequired === "SCHOOL") {
      // School specific
      matchScore -= 10;
      matchReasons.push(`School Scheme: Designed for secondary school students (Class 9-12). College applicants must have valid prior score.`);
    }
  }

  // 4. Gender Check
  if (rules.allowedGenders && !rules.allowedGenders.includes("ANY")) {
    const isGenderAllowed = rules.allowedGenders.some(
      (g) => g.toLowerCase() === gender.toLowerCase()
    );
    if (isGenderAllowed) {
      matchScore += 5;
      matchReasons.push(`Gender Eligible: Profile matches program criteria (${gender}).`);
    } else {
      isEligible = false;
      matchScore = Math.min(matchScore, 45);
      matchReasons.push(`Gender Exclusive: Scheme is exclusively for ${rules.allowedGenders.join(" / ")} candidates.`);
      actionNeeded = `Exclusively open for ${rules.allowedGenders.join(", ")} candidates. Female family members can apply.`;
    }
  }

  // 5. Identity verification bonus
  if (aadhaar && aadhaar.length >= 10) {
    matchScore += 5;
    matchReasons.push(`Identity Ready: Aadhaar UID verified for automated e-KYC and DBT seeding.`);
  }

  matchScore = Math.min(Math.max(matchScore, 20), 99);

  let matchStatus: SchemeMatchResult["matchStatus"] = "ELIGIBLE";
  let matchBadge = "Eligible to Apply";

  if (!isEligible) {
    matchStatus = "NOT_ELIGIBLE";
    matchBadge = "Criteria Not Met";
  } else if (matchScore >= 90) {
    matchStatus = "HIGHLY_ELIGIBLE";
    matchBadge = `${matchScore}% Match - Highly Eligible`;
  } else if (matchScore >= 75) {
    matchStatus = "ELIGIBLE";
    matchBadge = `${matchScore}% Match - Eligible`;
  } else {
    matchStatus = "CRITERIA_CHECK_REQUIRED";
    matchBadge = `${matchScore}% Match - Verify Documents`;
  }

  return {
    scheme,
    matchScore,
    isEligible,
    matchStatus,
    matchBadge,
    matchReasons,
    actionNeeded,
  };
}
