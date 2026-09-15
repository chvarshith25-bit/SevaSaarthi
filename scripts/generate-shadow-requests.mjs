import fs from 'fs';
import path from 'path';

// Diverse set of queries across all 7 registered services and OOD categories:
// 1. POST_MATRIC_SCHOLARSHIP (Education)
// 2. INSTANT_E_PAN (Finance/Tax/Identity)
// 3. INCOME_CERTIFICATE (Revenue)
// 4. LAND_RECORD (Land/Revenue)
// 5. PM_KISAN (Agriculture/Farmers)
// 6. AYUSHMAN_BHARAT (Health/Insurance)
// 7. PM_AWAS (Housing)
// 8. OOD (Passport, Driving License, Electricity, Water, Marriage, Birth, etc.)

const testCases = [
  // --- Category 1: POST_MATRIC_SCHOLARSHIP ---
  { text: "I need financial support for college tuition fees under post matric scholarship", category: "Education", state: "KA", docs: ["COLLEGE_ID", "MARKSHEET", "INCOME_CERT"], benefit: "Scholarship" },
  { text: "Apply for scholarship higher studies engineering degree", category: "Education", state: "MH", docs: ["MARKSHEET", "FEE_RECEIPT"], benefit: "Fee Reimbursement" },
  { text: "post matric scholarship", category: "Education", state: "TN", docs: ["CASTE_CERT", "MARKSHEET"], benefit: "Scholarship" },
  { text: "scholarship for sc st obc students in polytechnic", category: "Education", state: "UP", docs: ["ID_PROOF", "INCOME_CERT"], benefit: "Tuition waiver" },
  { text: "my daughter passed 12th class wants money assistance for college admission fees", category: "Education", state: "DL", docs: ["MARKSHEET", "AADHAAR"], benefit: "Education Grant" },
  { text: "Need renewal of my pre-existing college scholarship disbursement", category: "Education", state: "TS", docs: ["MARKSHEET", "BANK_PASSBOOK"], benefit: "Scholarship" },
  { text: "postmatric schlorship portal registration error", category: "Education", state: "KA", docs: ["MARKSHEET"], benefit: "Scholarship" },
  { text: "Financial aid for master degree studies in government university", category: "Education", state: "WB", docs: ["COLLEGE_ID", "INCOME_CERT"], benefit: "Financial Support" },
  { text: "Hostel fees and book grant for engineering post matric student", category: "Education", state: "MH", docs: ["HOSTEL_RECEIPT", "STUDENT_ID"], benefit: "Maintenance Allowance" },
  { text: "apply for higher education scholarship fund", category: "Education", state: "MP", docs: ["MARKSHEET"], benefit: "Scholarship" },
  { text: "sholarship form submit", category: "Education", state: "GJ", docs: ["MARKSHEET"], benefit: "Scholarship" },
  { text: "fee concession scholarship for backward classes college student", category: "Education", state: "AP", docs: ["CASTE_CERT", "INCOME_CERT"], benefit: "Concession" },

  // --- Category 2: INSTANT_E_PAN ---
  { text: "Apply for new PAN card online with instant e-pan facility", category: "Finance", state: "DL", docs: ["AADHAAR", "PHOTO"], benefit: "PAN Card" },
  { text: "instant pan card download through aadhaar ekyc", category: "Finance", state: "MH", docs: ["AADHAAR"], benefit: "e-PAN" },
  { text: "pan", category: "Identity", state: "KA", docs: ["ID_PROOF"], benefit: "PAN" },
  { text: "Urgent need 10 digit permanent account number for opening bank account", category: "Finance", state: "TN", docs: ["AADHAAR", "VOTER_ID"], benefit: "PAN Number" },
  { text: "generate instant e-PAN form 49A paperless application", category: "Finance", state: "UP", docs: ["AADHAAR", "SIGNATURE"], benefit: "Form 49A" },
  { text: "lost my physical pan card need duplicate or digital copy immediately", category: "Finance", state: "WB", docs: ["AADHAAR"], benefit: "Duplicate PAN" },
  { text: "PAN card correction and reissuance request", category: "Finance", state: "GJ", docs: ["AADHAAR", "OLD_PAN"], benefit: "PAN Card" },
  { text: "i want pan card urgently for income tax filing", category: "Tax", state: "TS", docs: ["AADHAAR"], benefit: "PAN Card" },
  { text: "pan card form 49a online application", category: "Finance", state: "MP", docs: ["AADHAAR"], benefit: "Tax Identity" },
  { text: "apply pan", category: "Finance", state: "RJ", docs: ["AADHAAR"], benefit: "PAN" },
  { text: "instant epan reprint and card dispatch to residential address", category: "Finance", state: "KL", docs: ["AADHAAR", "ADDRESS_PROOF"], benefit: "Physical Card" },
  { text: "e-pan card banwana hai urgently", category: "Finance", state: "HR", docs: ["AADHAAR"], benefit: "e-PAN" },

  // --- Category 3: INCOME_CERTIFICATE ---
  { text: "Application for annual family income certificate from tahsildar office", category: "Revenue", state: "KA", docs: ["SALARY_SLIP", "RATION_CARD", "AADHAAR"], benefit: "Income Certificate" },
  { text: "income certificate", category: "Revenue", state: "MH", docs: ["AADHAAR", "AFFIDAVIT"], benefit: "Certificate" },
  { text: "Need tahsil income certificate to prove household earnings below 1 lakh for subsidy", category: "Revenue", state: "UP", docs: ["ELECTRICITY_BILL", "AADHAAR"], benefit: "Income Proof" },
  { text: "certified proof of gross family income for government reservation quota", category: "Revenue", state: "TN", docs: ["SALARY_CERT", "VOTER_ID"], benefit: "Income Certificate" },
  { text: "revenue department income certificate issuance for ew category", category: "Revenue", state: "TS", docs: ["AADHAAR", "TAX_RETURN"], benefit: "Income Certificate" },
  { text: "request for revenue inspector inquiry and income certificate", category: "Revenue", state: "WB", docs: ["AFFIDAVIT", "RATION_CARD"], benefit: "Income Certificate" },
  { text: "income cert for admission fee rebate", category: "Revenue", state: "GJ", docs: ["SALARY_SLIP"], benefit: "Fee Rebate" },
  { text: "incom certificate urgent requirement", category: "Revenue", state: "MP", docs: ["AADHAAR"], benefit: "Certificate" },
  { text: "statutory income declaration certificate for scholarship application", category: "Revenue", state: "AP", docs: ["INCOME_DECLARATION", "AADHAAR"], benefit: "Income Verification" },
  { text: "tahsildar signed income proof certificate", category: "Revenue", state: "KL", docs: ["TAX_RECEIPT", "AADHAAR"], benefit: "Income Certificate" },
  { text: "patwari verified annual household income certificate", category: "Revenue", state: "HR", docs: ["RATION_CARD", "VOTER_ID"], benefit: "Income Certificate" },
  { text: "income cert", category: "Revenue", state: "DL", docs: ["AADHAAR"], benefit: "Certificate" },

  // --- Category 4: LAND_RECORD ---
  { text: "Certified copy of RoR 1B record of rights and land title sketch", category: "Land", state: "KA", docs: ["SURVEY_NO", "AADHAAR"], benefit: "RoR 1B" },
  { text: "land record", category: "Revenue", state: "MH", docs: ["KHATA_NO"], benefit: "7/12 Extract" },
  { text: "Request 7/12 extract and 8A land revenue ownership document", category: "Land", state: "GJ", docs: ["SURVEY_NUMBER", "ID_PROOF"], benefit: "Land Records" },
  { text: "mutation of agricultural land title after inheritance partition", category: "Land", state: "UP", docs: ["DEATH_CERT", "SALE_DEED", "AADHAAR"], benefit: "Land Mutation" },
  { text: "patta chitta digital copy for farm land survey number 45", category: "Revenue", state: "TN", docs: ["PATTA_NUMBER"], benefit: "Patta Chitta" },
  { text: "check land title encumbrance certificate and khasra khatauni details", category: "Land", state: "MP", docs: ["KHASRA_NO"], benefit: "Khasra Khatauni" },
  { text: "land record verification and boundary sketch map copy", category: "Land", state: "AP", docs: ["SURVEY_NO", "TITLE_DEED"], benefit: "Survey Map" },
  { text: "online land ror record verification", category: "Land", state: "TS", docs: ["PASSBOOK_NO"], benefit: "Land Record" },
  { text: "certified land ownership extract for bank agriculture mortgage", category: "Land", state: "WB", docs: ["KHATIAN_NO", "AADHAAR"], benefit: "Ownership Extract" },
  { text: "land title dispute verification revenue records", category: "Land", state: "RJ", docs: ["SALE_DEED"], benefit: "Verification" },
  { text: "khasra number check and jamabandi copy", category: "Land", state: "HR", docs: ["JAMABANDI_NO"], benefit: "Jamabandi" },
  { text: "land records", category: "Revenue", state: "KL", docs: ["TAX_RECEIPT"], benefit: "Land Records" },

  // --- Category 5: PM_KISAN ---
  { text: "Enrollment in PM Kisan Samman Nidhi scheme for 6000 annual installment", category: "Agriculture", state: "UP", docs: ["LAND_ROR", "AADHAAR", "BANK_PASSBOOK"], benefit: "Income Support" },
  { text: "pm kisan", category: "Agriculture", state: "MH", docs: ["AADHAAR"], benefit: "PM Kisan" },
  { text: "PM-Kisan 16th installment not credited in bank account ekyc update", category: "Agriculture", state: "MP", docs: ["AADHAAR", "BANK_PASSBOOK"], benefit: "Installment Credit" },
  { text: "farmer direct benefit transfer scheme registration for small marginal farmers", category: "Agriculture", state: "KA", docs: ["LAND_EXTRACT", "AADHAAR"], benefit: "DBT Transfer" },
  { text: "apply for pradhan mantri kisan samman nidhi quarterly payment", category: "Agriculture", state: "GJ", docs: ["LAND_TITLE", "AADHAAR", "BANK_DETAILS"], benefit: "Kisan Support" },
  { text: "farmer financial relief scheme 2000 rupees direct transfer", category: "Agriculture", state: "AP", docs: ["PATTADAR_PASSBOOK", "AADHAAR"], benefit: "Direct Benefit" },
  { text: "pmkisan samman nidhi registration new farmer", category: "Agriculture", state: "RJ", docs: ["JAMABANDI", "AADHAAR"], benefit: "Enrollment" },
  { text: "pm kisan ekyc biometric linkage and land seeding status", category: "Agriculture", state: "TN", docs: ["AADHAAR"], benefit: "eKYC Seeding" },
  { text: "pradhan mantri kisan assistance application", category: "Agriculture", state: "WB", docs: ["LAND_RECORD", "BANK_PASSBOOK"], benefit: "Financial Aid" },
  { text: "pm-kisan installment assistance", category: "Agriculture", state: "TS", docs: ["AADHAAR", "LAND_TITLE"], benefit: "Installment" },
  { text: "kisan samman nidhi kist release request", category: "Agriculture", state: "HR", docs: ["AADHAAR"], benefit: "PM-Kisan" },
  { text: "pm kisan", category: "Agriculture", state: "DL", docs: ["AADHAAR"], benefit: "Farmer Aid" },

  // --- Category 6: AYUSHMAN_BHARAT ---
  { text: "Enrollment in Ayushman Bharat PM-JAY for 5 lakh medical health coverage", category: "Health", state: "UP", docs: ["RATION_CARD", "AADHAAR"], benefit: "Health Insurance" },
  { text: "ayushman", category: "Health", state: "MH", docs: ["AADHAAR"], benefit: "Ayushman Card" },
  { text: "Golden card download and hospital empanelment under PMJAY scheme", category: "Health", state: "DL", docs: ["AADHAAR", "SECC_PROOF"], benefit: "Golden Card" },
  { text: "Ayushman card for family cashless surgery treatment in private hospital", category: "Health", state: "GJ", docs: ["RATION_CARD", "AADHAAR"], benefit: "Hospitalization" },
  { text: "Pradhan Mantri Jan Arogya Yojana medical treatment insurance benefit", category: "Health", state: "KA", docs: ["AADHAAR", "FAMILY_CARD"], benefit: "Medical Cover" },
  { text: "card creation under national health authority ayushman bharat", category: "Health", state: "TN", docs: ["AADHAAR"], benefit: "Health Cover" },
  { text: "urgent hospital admission cashless claim under ayushman health card", category: "Health", state: "MP", docs: ["HOSPITAL_SLIP", "AYUSHMAN_CARD"], benefit: "Cashless Treatment" },
  { text: "ayushman bharat pm jay card registration", category: "Health", state: "WB", docs: ["RATION_CARD", "AADHAAR"], benefit: "Ayushman Card" },
  { text: "pmjay medical health card for cancer treatment expenses", category: "Health", state: "RJ", docs: ["MEDICAL_REPORTS", "AADHAAR"], benefit: "Tertiary Healthcare" },
  { text: "ayushman health insurance card", category: "Health", state: "AP", docs: ["AADHAAR"], benefit: "Health Insurance" },
  { text: "ayushman golden card", category: "Health", state: "TS", docs: ["AADHAAR"], benefit: "Golden Card" },
  { text: "apply for ayushman bharat benefit", category: "Health", state: "KL", docs: ["AADHAAR"], benefit: "Health Cover" },

  // --- Category 7: PM_AWAS ---
  { text: "Financial subsidy for constructing pucca house under Pradhan Mantri Awas Yojana PMAY", category: "Housing", state: "UP", docs: ["BPL_CARD", "LAND_PHOTO", "AADHAAR"], benefit: "Housing Subsidy" },
  { text: "pm awas", category: "Housing", state: "MP", docs: ["AADHAAR"], benefit: "PMAY" },
  { text: "PMAY Gramin rural house construction grant instalment release", category: "Housing", state: "MH", docs: ["AADHAAR", "GEO_TAG_PHOTO"], benefit: "House Construction" },
  { text: "Urban affordable housing credit linked subsidy scheme under PM Awas", category: "Housing", state: "GJ", docs: ["INCOME_PROOF", "PROPERTY_PAPERS"], benefit: "Home Loan Subsidy" },
  { text: "homeless family grant to construct permanent brick house pmay", category: "Housing", state: "KA", docs: ["AADHAAR", "CASTE_CERT"], benefit: "Housing Assistance" },
  { text: "apply for pradhan mantri awas yojana list inclusion", category: "Housing", state: "TN", docs: ["RATION_CARD", "AADHAAR"], benefit: "PMAY Beneficiary" },
  { text: "pm awas yojana urban house sanction letter", category: "Housing", state: "DL", docs: ["ALLOTMENT_LETTER", "AADHAAR"], benefit: "Sanction Letter" },
  { text: "subsidy money for building bathroom and roof under awas scheme", category: "Housing", state: "WB", docs: ["HOUSE_PHOTO", "BANK_PASSBOOK"], benefit: "Construction Grant" },
  { text: "pmay house allotment list check and second kist release", category: "Housing", state: "RJ", docs: ["BENEFICIARY_ID"], benefit: "Installment" },
  { text: "pradhan mantri awas yojana registration", category: "Housing", state: "TS", docs: ["AADHAAR", "INCOME_CERT"], benefit: "Housing" },
  { text: "pm awas gramin form", category: "Housing", state: "AP", docs: ["AADHAAR"], benefit: "PMAY-G" },
  { text: "housing assistance for poor rural family under pm awas", category: "Housing", state: "KL", docs: ["BPL_RATION_CARD"], benefit: "Housing Aid" },

  // --- Category 8: Out Of Domain (OOD) Queries (Not handled by the 7 services) ---
  { text: "Passport renewal application and police verification appointment", category: "Passport", state: "DL", docs: ["OLD_PASSPORT", "AADHAAR"], benefit: "Passport" },
  { text: "driving license renewal and learner permit test booking", category: "Transport", state: "KA", docs: ["LEARNER_LICENCE", "MEDICAL_FORM"], benefit: "Driving Licence" },
  { text: "Electricity bill high meter complaint and reading check", category: "Utilities", state: "UP", docs: ["ELECTRICITY_BILL"], benefit: "Bill Correction" },
  { text: "Register marriage certificate under special marriage act", category: "Civic", state: "MH", docs: ["MARRIAGE_AFFIDAVIT", "PHOTOS"], benefit: "Marriage Certificate" },
  { text: "Birth certificate issuance for newborn child from municipal corporation", category: "Civic", state: "TN", docs: ["HOSPITAL_DISCHARGE", "PARENT_IDS"], benefit: "Birth Certificate" },
  { text: "Complaint against fraudulent online ecommerce seller in consumer court", category: "Consumer", state: "DL", docs: ["PURCHASE_INVOICE"], benefit: "Consumer Redressal" },
  { text: "Vehicle registration transfer and RC book NOC certificate", category: "Transport", state: "GJ", docs: ["RC_BOOK", "INSURANCE"], benefit: "RC Transfer" },
  { text: "Voter ID card new enrollment form 6 and election epic number", category: "Election", state: "WB", docs: ["AGE_PROOF", "ADDRESS_PROOF"], benefit: "Voter ID" },
  { text: "Municipal water connection pipeline leakage complaint", category: "Civic", state: "MP", docs: ["WATER_BILL"], benefit: "Repair" },
  { text: "Trade license application for retail garment shop", category: "Commercial", state: "RJ", docs: ["RENT_AGREEMENT", "NOC"], benefit: "Trade License" },
  { text: "Dog license and rabies vaccination token from municipal corporation", category: "Municipal", state: "KA", docs: ["VACCINATION_CARD"], benefit: "Pet License" },
  { text: "Fire department safety NOC certificate for commercial building", category: "Safety", state: "MH", docs: ["BUILDING_PLAN"], benefit: "Fire NOC" },
  { text: "Arms gun license fresh application and background check", category: "Home", state: "UP", docs: ["POLICE_VERIFICATION"], benefit: "Gun License" },
  { text: "Property tax online payment and assessment receipt printout", category: "Municipal", state: "TS", docs: ["PROPERTY_ASSESSMENT_NO"], benefit: "Tax Receipt" },
  { text: "Old age pension monthly allowance under social security", category: "Pension", state: "AP", docs: ["AGE_PROOF", "BPL_CARD"], benefit: "Pension" },
  { text: "Food safety FSSAI registration license for bakery kitchen", category: "Commerce", state: "TN", docs: ["PAN", "AADHAAR"], benefit: "FSSAI License" },
  { text: "Tree cutting permission request due to danger to residential house", category: "Forest", state: "KL", docs: ["SITE_PHOTO"], benefit: "Tree Cutting Permit" },
  { text: "Street light not functioning in sector 4 complaint", category: "Municipal", state: "HR", docs: ["WARD_NO"], benefit: "Civic Repair" },
  { text: "Death certificate copy after cremation register entry", category: "Civic", state: "DL", docs: ["CREMATION_RECEIPT"], benefit: "Death Certificate" },
  { text: "Caste certificate verification and non-creamy layer renewal", category: "Welfare", state: "MH", docs: ["CASTE_RECORD"], benefit: "OBC NCL Certificate" },

  // --- Category 9: Edge cases (typos, voice-like, very short) ---
  { text: "skolership", category: "Education", state: "KA", docs: ["MARKSHEET"], benefit: "Scholarship" },
  { text: "pancard", category: "Finance", state: "MH", docs: ["AADHAAR"], benefit: "PAN" },
  { text: "incme certifcate", category: "Revenue", state: "UP", docs: ["AADHAAR"], benefit: "Certificate" },
  { text: "pm kisan yojana 2000 rupaye kisan", category: "Agriculture", state: "MP", docs: ["AADHAAR"], benefit: "Farmer money" },
  { text: "ayushman hospital 5 lakh", category: "Health", state: "DL", docs: ["AADHAAR"], benefit: "Medical" },
  { text: "awas ghar", category: "Housing", state: "GJ", docs: ["AADHAAR"], benefit: "Home" },
  { text: "land survey map 7 12", category: "Land", state: "MH", docs: ["SURVEY"], benefit: "Land record" },
  { text: "Help me please my application", category: "Unknown", state: "KA", docs: [], benefit: "Unknown" },
  { text: "I need financial aid for my family livelihood", category: "General", state: "WB", docs: ["AADHAAR"], benefit: "Welfare" },
  { text: "Government money transfer in my bank account", category: "Finance", state: "UP", docs: ["BANK_DETAILS"], benefit: "DBT" },
  { text: "urgent assistance needed immediately", category: "Emergency", state: "DL", docs: [], benefit: "Aid" },
  { text: "status of my submitted case file 9832", category: "Inquiry", state: "TN", docs: [], benefit: "Status Check" },
  { text: "download certificate", category: "General", state: "TS", docs: [], benefit: "Certificate Download" },
  { text: "free medical card for poor people", category: "Health", state: "RJ", docs: ["BPL_CARD"], benefit: "Free Medical" },
  { text: "money for studying engineering college", category: "Education", state: "AP", docs: ["COLLEGE_ID"], benefit: "College Money" },
  { text: "farming seeds subsidy and pesticide grant", category: "Agriculture", state: "HR", docs: ["FARMER_ID"], benefit: "Farming Subsidy" }
];

console.log(`Prepared ${testCases.length} diverse test cases.`);

const requests = testCases.map((tc, idx) => ({
  applicationId: `app-${String(idx + 1).padStart(3, '0')}`,
  naturalText: tc.text,
  category: tc.category,
  stateCode: tc.state,
  documentTypes: tc.docs,
  requestedBenefit: tc.benefit,
}));

const outPath = path.resolve('scripts', 'shadow_test_requests.json');
fs.writeFileSync(outPath, JSON.stringify(requests, null, 2), { encoding: 'utf8' });
console.log(`Successfully generated ${requests.length} structured shadow test requests at ${outPath}`);

