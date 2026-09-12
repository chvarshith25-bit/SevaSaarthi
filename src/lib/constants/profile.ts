import {
  User,
  Users,
  CreditCard,
  MapPin,
  GraduationCap,
  Banknote,
  Landmark,
  ShieldCheck,
  FileText,
  Compass,
} from "lucide-react";
import { ProfileField } from "@/types";

export type ProfileCategoryKey =
  | "IDENTITY"
  | "FAMILY"
  | "REGISTRY_IDS"
  | "ADDRESSES"
  | "EDUCATION"
  | "INCOME"
  | "BANKING";

export interface ProfileFieldDefinition {
  fieldName: string;
  label: string;
  placeholder: string;
  type?: "text" | "date" | "number" | "select";
  category: ProfileCategoryKey;
  isKeyField?: boolean;
  required?: boolean;
  options?: string[];
  helpText?: string;
  portalTags?: string[]; // e.g. ["PAN", "PASSPORT", "NSP", "VOTER", "SARATHI", "EDISTRICT", "UPSC"]
}

export const CANONICAL_PROFILE_FIELDS: ProfileFieldDefinition[] = [
  // =========================================================================
  // 1. IDENTITY & PERSONAL DEMOGRAPHICS (15 fields)
  // =========================================================================
  {
    fieldName: "full_name",
    label: "Full Name (as per Aadhaar / 10th Certificate)",
    placeholder: "e.g. Sai Sankeerth",
    category: "IDENTITY",
    isKeyField: true,
    portalTags: ["PAN", "PASSPORT", "NSP", "VOTER", "SARATHI", "EDISTRICT", "UPSC"],
    helpText: "Must match character-by-character with 10th marksheet and Aadhaar UID.",
  },
  {
    fieldName: "first_name",
    label: "First / Given Name",
    placeholder: "e.g. Sai",
    category: "IDENTITY",
    portalTags: ["PAN", "PASSPORT", "UPSC"],
  },
  {
    fieldName: "middle_name",
    label: "Middle Name (if applicable)",
    placeholder: "e.g. Kumar",
    category: "IDENTITY",
    portalTags: ["PAN", "PASSPORT"],
  },
  {
    fieldName: "last_name",
    label: "Last Name / Surname",
    placeholder: "e.g. Sankeerth",
    category: "IDENTITY",
    portalTags: ["PAN", "PASSPORT", "UPSC"],
  },
  {
    fieldName: "name_in_regional_lang",
    label: "Full Name in Regional Script (Telugu / Hindi)",
    placeholder: "e.g. సాయి సంకీర్త్ / साई संकीर्थ",
    category: "IDENTITY",
    portalTags: ["VOTER", "EDISTRICT"],
    helpText: "Printed on Voter ID Card and State Revenue Certificates.",
  },
  {
    fieldName: "date_of_birth",
    label: "Date of Birth",
    placeholder: "YYYY-MM-DD",
    type: "date",
    category: "IDENTITY",
    isKeyField: true,
    portalTags: ["PAN", "PASSPORT", "NSP", "VOTER", "SARATHI", "EDISTRICT", "UPSC"],
  },
  {
    fieldName: "place_of_birth",
    label: "Place of Birth (Village / Town / City)",
    placeholder: "e.g. Hyderabad",
    category: "IDENTITY",
    portalTags: ["PASSPORT", "SARATHI"],
  },
  {
    fieldName: "district_of_birth",
    label: "District of Birth",
    placeholder: "e.g. Hyderabad District",
    category: "IDENTITY",
    portalTags: ["PASSPORT", "EDISTRICT"],
  },
  {
    fieldName: "state_of_birth",
    label: "State of Birth",
    placeholder: "e.g. Telangana",
    category: "IDENTITY",
    portalTags: ["PASSPORT", "EDISTRICT"],
  },
  {
    fieldName: "gender",
    label: "Gender",
    placeholder: "Male / Female / Transgender",
    category: "IDENTITY",
    isKeyField: true,
    options: ["Male", "Female", "Transgender", "Other"],
    portalTags: ["PAN", "PASSPORT", "NSP", "VOTER", "SARATHI", "EDISTRICT", "UPSC"],
  },
  {
    fieldName: "marital_status",
    label: "Marital Status",
    placeholder: "Single / Married / Divorced / Widowed",
    category: "IDENTITY",
    options: ["Single / Unmarried", "Married", "Divorced", "Widowed"],
    portalTags: ["PASSPORT", "UPSC", "EDISTRICT"],
  },
  {
    fieldName: "blood_group",
    label: "Blood Group",
    placeholder: "e.g. O+ve",
    category: "IDENTITY",
    options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"],
    portalTags: ["SARATHI", "PASSPORT"],
    helpText: "Mandatory for Driving License (Parivahan Sarathi) & Emergency records.",
  },
  {
    fieldName: "identification_mark_1",
    label: "Visible Identification Mark 1 (Mole / Scar)",
    placeholder: "e.g. A mole on the right side of the neck",
    category: "IDENTITY",
    portalTags: ["PASSPORT", "SARATHI", "UPSC"],
    helpText: "Mandatory for Passport Seva, Driving License & UPSC/SSC exam admit cards.",
  },
  {
    fieldName: "identification_mark_2",
    label: "Visible Identification Mark 2 (Optional)",
    placeholder: "e.g. A scar on left forearm",
    category: "IDENTITY",
    portalTags: ["PASSPORT", "SARATHI"],
  },
  {
    fieldName: "nationality",
    label: "Citizenship / Nationality",
    placeholder: "e.g. Citizen of India by Birth",
    category: "IDENTITY",
    options: ["Citizen of India by Birth", "Citizen of India by Descent", "Citizen of India by Registration"],
    portalTags: ["PASSPORT", "UPSC"],
  },

  // =========================================================================
  // 2. FAMILY & RELATIONSHIP INFORMATION (8 fields)
  // =========================================================================
  {
    fieldName: "father_name",
    label: "Father's Legal Name (as per 10th / Aadhaar)",
    placeholder: "e.g. Suresh Kumar",
    category: "FAMILY",
    isKeyField: true,
    portalTags: ["PAN", "PASSPORT", "NSP", "VOTER", "SARATHI", "EDISTRICT", "UPSC"],
  },
  {
    fieldName: "father_occupation",
    label: "Father's Occupation / Profession",
    placeholder: "e.g. Farmer / Private Sector Employee / Govt Service",
    category: "FAMILY",
    portalTags: ["NSP", "EDISTRICT"],
  },
  {
    fieldName: "father_mobile",
    label: "Father's / Guardian's Contact Phone",
    placeholder: "e.g. 9876543210",
    category: "FAMILY",
    portalTags: ["NSP"],
  },
  {
    fieldName: "mother_name",
    label: "Mother's Legal Full Name",
    placeholder: "e.g. Lakshmi Devi",
    category: "FAMILY",
    isKeyField: true,
    portalTags: ["PAN", "PASSPORT", "NSP", "VOTER", "EDISTRICT", "UPSC"],
  },
  {
    fieldName: "mother_occupation",
    label: "Mother's Occupation / Profession",
    placeholder: "e.g. Homemaker / Teacher / Govt Service",
    category: "FAMILY",
    portalTags: ["NSP", "EDISTRICT"],
  },
  {
    fieldName: "spouse_name",
    label: "Spouse's Full Name (if married)",
    placeholder: "e.g. Priya Sharma",
    category: "FAMILY",
    portalTags: ["PASSPORT", "VOTER", "EDISTRICT"],
    helpText: "Mandatory for married passport applicants and ration card additions.",
  },
  {
    fieldName: "emergency_contact_name",
    label: "Emergency Contact Person Name",
    placeholder: "e.g. Suresh Kumar",
    category: "FAMILY",
    portalTags: ["PASSPORT", "SARATHI"],
  },
  {
    fieldName: "emergency_contact_phone",
    label: "Emergency Contact Phone Number",
    placeholder: "e.g. +91 98765 43210",
    category: "FAMILY",
    portalTags: ["PASSPORT", "SARATHI"],
  },

  // =========================================================================
  // 3. NATIONAL REGISTRY IDENTIFIERS (9 fields)
  // =========================================================================
  {
    fieldName: "aadhaar_number",
    label: "Aadhaar Number (12-Digit UID)",
    placeholder: "e.g. 1234 5678 9876",
    category: "REGISTRY_IDS",
    isKeyField: true,
    portalTags: ["PAN", "PASSPORT", "NSP", "VOTER", "SARATHI", "EDISTRICT", "UPSC"],
    helpText: "The primary digital identity token under Aadhaar Act 2016.",
  },
  {
    fieldName: "pan_number",
    label: "PAN Number (10-character Alphanumeric)",
    placeholder: "e.g. ABCDE1234F",
    category: "REGISTRY_IDS",
    portalTags: ["PAN", "PASSPORT", "EDISTRICT"],
    helpText: "Permanent Account Number issued by CBDT / Income Tax Department.",
  },
  {
    fieldName: "voter_id",
    label: "Voter ID / EPIC Card Number",
    placeholder: "e.g. TSB1234567",
    category: "REGISTRY_IDS",
    portalTags: ["PASSPORT", "EDISTRICT"],
    helpText: "Electoral Photo Identity Card number issued by Election Commission of India.",
  },
  {
    fieldName: "passport_number",
    label: "Passport Booklet Number (if existing)",
    placeholder: "e.g. Z1234567",
    category: "REGISTRY_IDS",
    portalTags: ["PASSPORT"],
  },
  {
    fieldName: "passport_expiry_date",
    label: "Passport Expiry Date (if renewing)",
    placeholder: "YYYY-MM-DD",
    type: "date",
    category: "REGISTRY_IDS",
    portalTags: ["PASSPORT"],
  },
  {
    fieldName: "driving_license_number",
    label: "Driving License Number (DL)",
    placeholder: "e.g. TS09 20220012345",
    category: "REGISTRY_IDS",
    portalTags: ["SARATHI"],
  },
  {
    fieldName: "ration_card_number",
    label: "Ration Card / Food Security Card (FSC) No",
    placeholder: "e.g. WAP360982738910",
    category: "REGISTRY_IDS",
    portalTags: ["EDISTRICT", "NSP"],
    helpText: "Crucial for state welfare subsidies and BPL fee concessions.",
  },
  {
    fieldName: "apaar_id",
    label: "APAAR ID / ABC ID (One Nation One Student ID)",
    placeholder: "e.g. 12-digit APAAR ID",
    category: "REGISTRY_IDS",
    portalTags: ["NSP"],
    helpText: "Academic Bank of Credits automated permanent academic account registry ID.",
  },
  {
    fieldName: "family_id",
    label: "Family ID / Parivar Pehchan Patra / Samagra ID",
    placeholder: "e.g. PPP/Samagra 8-digit ID",
    category: "REGISTRY_IDS",
    portalTags: ["EDISTRICT"],
  },

  // =========================================================================
  // 4. ADDRESSES & DOMICILE (14 fields)
  // =========================================================================
  {
    fieldName: "present_address_line1",
    label: "Present Address: Flat / House No & Building Name",
    placeholder: "e.g. H.No 4-12/A, Balaji Nilayam",
    category: "ADDRESSES",
    isKeyField: true,
    portalTags: ["PAN", "PASSPORT", "NSP", "VOTER", "SARATHI", "EDISTRICT", "UPSC"],
  },
  {
    fieldName: "present_address_line2",
    label: "Present Address: Street, Locality & Landmark",
    placeholder: "e.g. Gandhi Nagar, Near Water Tank, Gachibowli",
    category: "ADDRESSES",
    portalTags: ["PAN", "PASSPORT", "NSP", "VOTER", "SARATHI", "EDISTRICT", "UPSC"],
  },
  {
    fieldName: "present_city",
    label: "Present City / Town / Village",
    placeholder: "e.g. Hyderabad",
    category: "ADDRESSES",
    isKeyField: true,
    portalTags: ["PAN", "PASSPORT", "NSP", "VOTER", "SARATHI", "EDISTRICT", "UPSC"],
  },
  {
    fieldName: "present_district",
    label: "Present Revenue District",
    placeholder: "e.g. Rangareddy District",
    category: "ADDRESSES",
    isKeyField: true,
    portalTags: ["PAN", "PASSPORT", "NSP", "VOTER", "SARATHI", "EDISTRICT", "UPSC"],
  },
  {
    fieldName: "present_state",
    label: "Present State / Union Territory",
    placeholder: "e.g. Telangana",
    category: "ADDRESSES",
    isKeyField: true,
    portalTags: ["PAN", "PASSPORT", "NSP", "VOTER", "SARATHI", "EDISTRICT", "UPSC"],
  },
  {
    fieldName: "present_pincode",
    label: "Present Postal PIN Code (6-Digit)",
    placeholder: "e.g. 500081",
    category: "ADDRESSES",
    isKeyField: true,
    portalTags: ["PAN", "PASSPORT", "NSP", "VOTER", "SARATHI", "EDISTRICT", "UPSC"],
  },
  {
    fieldName: "present_police_station",
    label: "Present Police Station Jurisdiction",
    placeholder: "e.g. Gachibowli Police Station",
    category: "ADDRESSES",
    portalTags: ["PASSPORT", "VOTER"],
    helpText: "Mandatory for Passport police verification (PVR) and electoral verification.",
  },
  {
    fieldName: "present_post_office",
    label: "Present Post Office Name",
    placeholder: "e.g. Gachibowli Sub-Post Office",
    category: "ADDRESSES",
    portalTags: ["VOTER", "EDISTRICT"],
  },
  {
    fieldName: "is_permanent_same",
    label: "Is Permanent Address Same as Present?",
    placeholder: "Yes / No",
    category: "ADDRESSES",
    options: ["Yes", "No"],
    portalTags: ["PAN", "PASSPORT", "NSP", "VOTER", "SARATHI", "EDISTRICT", "UPSC"],
  },
  {
    fieldName: "permanent_address_line1",
    label: "Permanent Address: House No & Street",
    placeholder: "e.g. H.No 4-12/A, Gandhi Nagar",
    category: "ADDRESSES",
    portalTags: ["PAN", "PASSPORT", "NSP", "VOTER", "SARATHI", "EDISTRICT", "UPSC"],
  },
  {
    fieldName: "permanent_city",
    label: "Permanent City / Village",
    placeholder: "e.g. Hyderabad",
    category: "ADDRESSES",
    portalTags: ["PAN", "PASSPORT", "NSP", "VOTER", "SARATHI", "EDISTRICT", "UPSC"],
  },
  {
    fieldName: "permanent_district",
    label: "Permanent District",
    placeholder: "e.g. Rangareddy",
    category: "ADDRESSES",
    portalTags: ["PAN", "PASSPORT", "NSP", "VOTER", "SARATHI", "EDISTRICT", "UPSC"],
  },
  {
    fieldName: "permanent_state",
    label: "Permanent State",
    placeholder: "e.g. Telangana",
    category: "ADDRESSES",
    portalTags: ["PAN", "PASSPORT", "NSP", "VOTER", "SARATHI", "EDISTRICT", "UPSC"],
  },
  {
    fieldName: "residing_since",
    label: "Residing at Current Address Since (Years / Date)",
    placeholder: "e.g. 5 Years (Since July 2021)",
    category: "ADDRESSES",
    portalTags: ["PASSPORT", "VOTER", "EDISTRICT"],
    helpText: "Required for Passport Seva and Voter ID Form 6 duration declarations.",
  },

  // =========================================================================
  // 5. ACADEMIC & EDUCATIONAL QUALIFICATIONS (12 fields)
  // =========================================================================
  {
    fieldName: "education_level",
    label: "Highest Educational Qualification Level",
    placeholder: "e.g. Graduation (B.Tech)",
    category: "EDUCATION",
    options: ["10th Standard / Matriculation", "12th Standard / Intermediate / HSC", "Diploma / Polytechnic", "Undergraduate / Bachelor's Degree", "Postgraduate / Master's Degree", "Doctorate / Ph.D."],
    portalTags: ["PASSPORT", "SARATHI", "UPSC"],
  },
  {
    fieldName: "tenth_board",
    label: "Class 10 (SSC) Examination Board",
    placeholder: "e.g. Telangana State SSC Board / CBSE / ICSE",
    category: "EDUCATION",
    portalTags: ["NSP", "UPSC"],
  },
  {
    fieldName: "tenth_school",
    label: "Class 10 School Name",
    placeholder: "e.g. St. Joseph's High School, Hyderabad",
    category: "EDUCATION",
    portalTags: ["NSP"],
  },
  {
    fieldName: "tenth_roll_no",
    label: "Class 10 Hall Ticket / Roll Number",
    placeholder: "e.g. 1823109482",
    category: "EDUCATION",
    portalTags: ["NSP", "UPSC"],
    helpText: "Used by NSP and UPSC as the primary benchmark verification record.",
  },
  {
    fieldName: "tenth_passing_year",
    label: "Class 10 Year of Passing",
    placeholder: "e.g. 2020",
    category: "EDUCATION",
    portalTags: ["NSP", "UPSC"],
  },
  {
    fieldName: "tenth_percentage",
    label: "Class 10 (SSC) Percentage / GPA",
    placeholder: "e.g. 94.2% or 9.6 GPA",
    category: "EDUCATION",
    isKeyField: true,
    portalTags: ["NSP", "UPSC"],
  },
  {
    fieldName: "twelfth_board",
    label: "Class 12 / Intermediate / Diploma Board",
    placeholder: "e.g. Telangana State Board of Intermediate Education (TSBIE)",
    category: "EDUCATION",
    portalTags: ["NSP"],
  },
  {
    fieldName: "twelfth_stream",
    label: "Class 12 Stream / Group",
    placeholder: "e.g. Science (MPC / PCM) / BiPC / Commerce",
    category: "EDUCATION",
    options: ["Science (PCM / MPC)", "Science (PCB / BiPC)", "Commerce (CEC)", "Arts & Humanities (HEC)", "Vocational / Diploma"],
    portalTags: ["NSP"],
  },
  {
    fieldName: "twelfth_roll_no",
    label: "Class 12 / Intermediate Roll Number",
    placeholder: "e.g. 2209182390",
    category: "EDUCATION",
    portalTags: ["NSP"],
  },
  {
    fieldName: "twelfth_percentage",
    label: "Class 12 / Intermediate Percentage / Marks",
    placeholder: "e.g. 91.8% or 918/1000",
    category: "EDUCATION",
    isKeyField: true,
    portalTags: ["NSP"],
  },
  {
    fieldName: "college_name",
    label: "College / University Name",
    placeholder: "e.g. Vidya Jyothi Institute of Technology",
    category: "EDUCATION",
    isKeyField: true,
    portalTags: ["NSP"],
  },
  {
    fieldName: "college_aishe_code",
    label: "College AISHE Code (National Institute Code)",
    placeholder: "e.g. C-19736",
    category: "EDUCATION",
    isKeyField: true,
    portalTags: ["NSP"],
    helpText: "All India Survey on Higher Education institute code. Mandatory for NSP scholarship portal.",
  },
  {
    fieldName: "education_degree",
    label: "Current Course / Degree & Branch",
    placeholder: "e.g. B.Tech Computer Science & Engineering",
    category: "EDUCATION",
    isKeyField: true,
    portalTags: ["NSP"],
  },
  {
    fieldName: "current_year",
    label: "Current Year / Semester of Study",
    placeholder: "e.g. 3rd Year / 5th Sem",
    category: "EDUCATION",
    portalTags: ["NSP"],
  },
  {
    fieldName: "roll_number",
    label: "College Roll / University Registration No",
    placeholder: "e.g. 22071A0589",
    category: "EDUCATION",
    portalTags: ["NSP"],
  },

  // =========================================================================
  // 6. SOCIO-ECONOMIC, INCOME & RESERVATION (10 fields)
  // =========================================================================
  {
    fieldName: "annual_income",
    label: "Annual Family Household Income (in ₹)",
    placeholder: "e.g. 180000",
    type: "number",
    category: "INCOME",
    isKeyField: true,
    portalTags: ["NSP", "EDISTRICT", "UPSC"],
    helpText: "Gross annual family income from all sources as certified by revenue authority.",
  },
  {
    fieldName: "income_cert_no",
    label: "Income Certificate / MeeSeva Application Number",
    placeholder: "e.g. IC01240982312",
    category: "INCOME",
    isKeyField: true,
    portalTags: ["NSP", "EDISTRICT"],
  },
  {
    fieldName: "income_cert_date",
    label: "Income Certificate Issue Date",
    placeholder: "YYYY-MM-DD",
    type: "date",
    category: "INCOME",
    portalTags: ["NSP", "EDISTRICT"],
    helpText: "Must be issued on or after April 1st of the current financial year.",
  },
  {
    fieldName: "income_cert_authority",
    label: "Income Certificate Issuing Authority",
    placeholder: "e.g. Tahsildar / Mandal Revenue Officer (MRO)",
    category: "INCOME",
    portalTags: ["NSP", "EDISTRICT"],
  },
  {
    fieldName: "caste_category",
    label: "Social / Caste Category",
    placeholder: "General / OBC / SC / ST / EWS",
    category: "INCOME",
    isKeyField: true,
    options: ["General", "OBC", "SC", "ST", "EWS"],
    portalTags: ["NSP", "EDISTRICT", "UPSC"],
  },
  {
    fieldName: "sub_caste",
    label: "Sub-Caste / Specific Community Name",
    placeholder: "e.g. Yadava / Padmashali / Mala / Madiga",
    category: "INCOME",
    portalTags: ["NSP", "EDISTRICT"],
  },
  {
    fieldName: "caste_cert_no",
    label: "Caste Certificate Barcode / Serial Number",
    placeholder: "e.g. CC02240192831",
    category: "INCOME",
    portalTags: ["NSP", "EDISTRICT"],
  },
  {
    fieldName: "minority_status",
    label: "Religious Minority Community Status",
    placeholder: "Non-Minority / Muslim / Christian / Sikh...",
    category: "INCOME",
    options: ["Non-Minority", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Parsi"],
    portalTags: ["NSP", "UPSC"],
  },
  {
    fieldName: "disability_status",
    label: "Differently Abled / PwD Status",
    placeholder: "No / Yes (40%+ disability)",
    category: "INCOME",
    options: ["No", "Yes (40%+ Locomotor)", "Yes (40%+ Visual Impairment)", "Yes (40%+ Hearing Impairment)", "Yes (40%+ Other Disability)", "Yes (Less than 40%)"],
    portalTags: ["NSP", "UPSC", "EDISTRICT"],
  },
  {
    fieldName: "udid_number",
    label: "UDID Card Number (Unique Disability ID)",
    placeholder: "e.g. TS09182390182",
    category: "INCOME",
    portalTags: ["NSP", "EDISTRICT"],
  },

  // =========================================================================
  // 7. BANKING & DIRECT BENEFIT TRANSFER (DBT) (6 fields)
  // =========================================================================
  {
    fieldName: "bank_name",
    label: "Bank Name",
    placeholder: "e.g. State Bank of India",
    category: "BANKING",
    isKeyField: true,
    portalTags: ["NSP", "EDISTRICT"],
  },
  {
    fieldName: "bank_branch",
    label: "Bank Branch Name & City",
    placeholder: "e.g. Gachibowli Branch, Hyderabad",
    category: "BANKING",
    portalTags: ["NSP", "EDISTRICT"],
  },
  {
    fieldName: "bank_account_no",
    label: "Savings Bank Account Number (Must be individual student account)",
    placeholder: "e.g. 38491029481",
    category: "BANKING",
    isKeyField: true,
    portalTags: ["NSP", "EDISTRICT"],
    helpText: "Joint accounts are rejected by PFMS. Account must be in student's sole name.",
  },
  {
    fieldName: "bank_ifsc",
    label: "Bank 11-Character IFSC Code",
    placeholder: "e.g. SBIN0012948",
    category: "BANKING",
    isKeyField: true,
    portalTags: ["NSP", "EDISTRICT"],
  },
  {
    fieldName: "account_holder_name",
    label: "Account Holder Name (As per Bank Passbook)",
    placeholder: "e.g. Sai Sankeerth",
    category: "BANKING",
    isKeyField: true,
    portalTags: ["NSP", "EDISTRICT"],
    helpText: "Must match Aadhaar name character-by-character.",
  },
  {
    fieldName: "dbt_seeding_status",
    label: "Aadhaar-NPCI DBT Seeding Status",
    placeholder: "Seeded (Active - Ready for DBT)",
    category: "BANKING",
    isKeyField: true,
    options: ["Seeded (Active - Ready for DBT)", "Linked (Not Seeded)", "Not Seeded"],
    portalTags: ["NSP"],
    helpText: "Active NPCI Aadhaar seeding is mandatory for direct scholarship transfer into account.",
  },
];

export const PROFILE_CATEGORIES = [
  {
    key: "IDENTITY" as const,
    title: "Identity & Personal Info",
    subtitle: "Name, DOB, gender, blood group & identification marks",
    icon: User,
    iconBg: "bg-indigo-50 text-indigo-600",
  },
  {
    key: "FAMILY" as const,
    title: "Family & Relationships",
    subtitle: "Parents, spouse & emergency contact details",
    icon: Users,
    iconBg: "bg-purple-50 text-purple-600",
  },
  {
    key: "REGISTRY_IDS" as const,
    title: "National Government IDs",
    subtitle: "Aadhaar, PAN, Voter ID, Passport, APAAR & Ration card",
    icon: CreditCard,
    iconBg: "bg-sky-50 text-sky-600",
  },
  {
    key: "ADDRESSES" as const,
    title: "Addresses & Domicile",
    subtitle: "Present & permanent postal address and police jurisdiction",
    icon: MapPin,
    iconBg: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "EDUCATION" as const,
    title: "Academic & Education",
    subtitle: "10th, 12th marks, current college, AISHE code & roll no",
    icon: GraduationCap,
    iconBg: "bg-blue-50 text-blue-600",
  },
  {
    key: "INCOME" as const,
    title: "Income & Reservation",
    subtitle: "Annual income, Tahsildar cert, caste, minority & disability",
    icon: Banknote,
    iconBg: "bg-amber-50 text-amber-600",
  },
  {
    key: "BANKING" as const,
    title: "Banking & DBT Seeding",
    subtitle: "Savings bank account, IFSC & NPCI Aadhaar mapper status",
    icon: Landmark,
    iconBg: "bg-teal-50 text-teal-600",
  },
];

// =========================================================================
// APPLICATION PORTAL SPECIFIC REQUIREMENT PRESETS
// =========================================================================
export interface ApplicationPortalPreset {
  id: string;
  name: string;
  shortCode: string;
  shortName?: string;
  authority: string;
  description?: string;
  officialUrl: string;
  badgeBg: string;
  badgeText: string;
  requiredFields: string[];
  optionalFields?: string[];
}

export const APPLICATION_PORTAL_PRESETS: ApplicationPortalPreset[] = [
  {
    id: "pan",
    name: "PAN Card Online Application (Form 49A)",
    shortCode: "PAN-49A",
    shortName: "PAN Card",
    description: "Statutory 10-character Permanent Account Number issued by CBDT via Protean / NSDL",
    authority: "Income Tax Dept / Protean eGov (NSDL)",
    officialUrl: "https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html",
    badgeBg: "bg-blue-50 border-blue-200",
    badgeText: "text-blue-700",
    requiredFields: [
      "full_name",
      "first_name",
      "last_name",
      "father_name",
      "mother_name",
      "date_of_birth",
      "gender",
      "aadhaar_number",
      "present_address_line1",
      "present_village_or_city",
      "present_district",
      "present_state",
      "present_pincode",
    ],
    optionalFields: ["middle_name", "phone_number", "email"],
  },
  {
    id: "nsp_scholarship",
    name: "National Scholarship Portal (NSP Post-Matric)",
    shortCode: "NSP-PMS",
    shortName: "NSP Scholarship",
    description: "Central & State scholarships covering tuition and maintenance fees for higher education",
    authority: "Ministry of Social Justice & Empowerment / MoE",
    officialUrl: "https://scholarships.gov.in",
    badgeBg: "bg-indigo-50 border-indigo-200",
    badgeText: "text-indigo-700",
    requiredFields: [
      "full_name",
      "date_of_birth",
      "gender",
      "aadhaar_number",
      "father_name",
      "mother_name",
      "annual_income",
      "income_certificate_number",
      "social_category",
      "caste_subcaste",
      "tenth_roll_no",
      "tenth_percentage",
      "twelfth_percentage",
      "college_name",
      "college_aishe_code",
      "course_name",
      "admission_roll_no",
      "bank_account_number",
      "bank_ifsc",
      "dbt_seeding_status",
    ],
    optionalFields: ["apaar_id", "father_mobile", "is_minority", "is_differently_abled"],
  },
  {
    id: "passport",
    name: "Passport Seva (Ordinary / Tatkaal 36-Pages)",
    shortCode: "PSP-MEA",
    shortName: "Passport Seva",
    description: "Standard 36-page ordinary booklet issuance by Ministry of External Affairs",
    authority: "Consular, Passport and Visa Division (CPV), MEA",
    officialUrl: "https://portal2.passportindia.gov.in",
    badgeBg: "bg-sky-50 border-sky-200",
    badgeText: "text-sky-700",
    requiredFields: [
      "first_name",
      "last_name",
      "date_of_birth",
      "place_of_birth",
      "district_of_birth",
      "state_of_birth",
      "gender",
      "marital_status",
      "blood_group",
      "identification_mark_1",
      "father_name",
      "mother_name",
      "aadhaar_number",
      "present_address_line1",
      "present_village_or_city",
      "present_district",
      "present_state",
      "present_pincode",
      "present_police_station",
      "emergency_contact_name",
      "emergency_contact_phone",
    ],
    optionalFields: ["middle_name", "spouse_name", "passport_number", "identification_mark_2"],
  },
  {
    id: "voter_id",
    name: "Voter ID Registration (ECI Form 6)",
    shortCode: "ECI-F6",
    shortName: "Voter ID (Form 6)",
    description: "Electors photo identity card for new voter enrollment across assembly constituencies",
    authority: "Election Commission of India (ECI)",
    officialUrl: "https://voters.eci.gov.in",
    badgeBg: "bg-emerald-50 border-emerald-200",
    badgeText: "text-emerald-700",
    requiredFields: [
      "full_name",
      "name_in_regional_lang",
      "father_name",
      "date_of_birth",
      "gender",
      "aadhaar_number",
      "present_address_line1",
      "present_address_line2",
      "present_village_or_city",
      "present_district",
      "present_state",
      "present_pincode",
      "present_police_station",
      "present_post_office",
    ],
    optionalFields: ["spouse_name", "voter_id", "email", "phone_number"],
  },
  {
    id: "sarathi_dl",
    name: "Driving License / LL (Parivahan Sarathi)",
    shortCode: "SARATHI-DL",
    shortName: "Driving License",
    description: "Learner's & Permanent DL application for non-transport & transport motor vehicles",
    authority: "Ministry of Road Transport and Highways (MoRTH)",
    officialUrl: "https://sarathi.parivahan.gov.in",
    badgeBg: "bg-amber-50 border-amber-200",
    badgeText: "text-amber-700",
    requiredFields: [
      "full_name",
      "father_name",
      "date_of_birth",
      "gender",
      "blood_group",
      "identification_mark_1",
      "highest_qualification",
      "aadhaar_number",
      "present_address_line1",
      "present_village_or_city",
      "present_district",
      "present_state",
      "present_pincode",
      "emergency_contact_phone",
    ],
    optionalFields: ["driving_license_number", "place_of_birth", "emergency_contact_name"],
  },
  {
    id: "meeseva_edistrict",
    name: "State Revenue Certificates (Income / Caste / Domicile)",
    shortCode: "MEESEVA",
    shortName: "MeeSeva / e-District",
    description: "State civil administration certificates for income, community, and nativity",
    authority: "Department of Revenue / e-District / MeeSeva",
    officialUrl: "https://ts.meeseva.telangana.gov.in",
    badgeBg: "bg-teal-50 border-teal-200",
    badgeText: "text-teal-700",
    requiredFields: [
      "full_name",
      "name_in_regional_lang",
      "father_name",
      "mother_name",
      "date_of_birth",
      "gender",
      "social_category",
      "caste_subcaste",
      "annual_income",
      "aadhaar_number",
      "ration_card_number",
      "present_address_line1",
      "present_village_or_city",
      "present_district",
      "present_state",
      "present_pincode",
    ],
    optionalFields: ["family_id", "father_occupation", "income_certificate_number", "caste_certificate_number"],
  },
  {
    id: "upsc_otr",
    name: "UPSC / SSC One Time Registration (OTR)",
    shortCode: "UPSC-OTR",
    shortName: "UPSC / SSC OTR",
    description: "Lifelong single master candidate registration for Union & Staff exams",
    authority: "Union Public Service Commission / SSC",
    officialUrl: "https://upsconline.nic.in",
    badgeBg: "bg-rose-50 border-rose-200",
    badgeText: "text-rose-700",
    requiredFields: [
      "full_name",
      "gender",
      "date_of_birth",
      "father_name",
      "mother_name",
      "is_minority",
      "social_category",
      "identification_mark_1",
      "tenth_board",
      "tenth_roll_no",
      "tenth_passing_year",
      "present_address_line1",
      "present_village_or_city",
      "present_state",
      "present_pincode",
    ],
    optionalFields: ["first_name", "last_name", "marital_status", "nationality", "email", "phone_number"],
  },
];

// =========================================================================
// READINESS COMPUTATION UTILITIES
// =========================================================================
export function computeProfileStrength(profileFields: ProfileField[]): number {
  const keyFields = CANONICAL_PROFILE_FIELDS.filter((f) => f.isKeyField);
  if (keyFields.length === 0) return 0;

  const filledCount = keyFields.filter((kf) => {
    const field = profileFields.find((pf) => pf.field_name === kf.fieldName);
    return field && field.value && field.value.trim().length > 0;
  }).length;

  return Math.round((filledCount / keyFields.length) * 100);
}

export function getProfileCompleteness(profileFields: ProfileField[]) {
  const total = CANONICAL_PROFILE_FIELDS.length;
  const filledCount = CANONICAL_PROFILE_FIELDS.filter((cf) => {
    const field = profileFields.find((pf) => pf.field_name === cf.fieldName);
    return field && field.value && field.value.trim().length > 0;
  }).length;

  const emptyCount = Math.max(0, total - filledCount);
  const strength = computeProfileStrength(profileFields);

  return {
    total,
    filledCount,
    emptyCount,
    strength,
    isComplete: emptyCount === 0,
  };
}

export interface PortalReadinessResult {
  preset: ApplicationPortalPreset;
  percentage: number;
  totalRequired: number;
  totalCount: number;
  satisfiedCount: number;
  missingCount: number;
  satisfiedFields: { fieldName: string; label: string; value: string }[];
  missingFields: { fieldName: string; label: string }[];
  isReady: boolean;
}

export function calculatePortalReadiness(
  profileFields: ProfileField[],
  presetId: string
): PortalReadinessResult {
  const preset =
    APPLICATION_PORTAL_PRESETS.find((p) => p.id === presetId) || APPLICATION_PORTAL_PRESETS[0];

  const satisfiedFields: { fieldName: string; label: string; value: string }[] = [];
  const missingFields: { fieldName: string; label: string }[] = [];

  preset.requiredFields.forEach((fieldName) => {
    const fieldDef = CANONICAL_PROFILE_FIELDS.find((f) => f.fieldName === fieldName);
    const label = fieldDef?.label || fieldName;
    const existing = profileFields.find((pf) => pf.field_name === fieldName);

    if (existing && existing.value && existing.value.trim().length > 0) {
      satisfiedFields.push({ fieldName, label, value: existing.value });
    } else {
      missingFields.push({ fieldName, label });
    }
  });

  const totalRequired = preset.requiredFields.length;
  const satisfiedCount = satisfiedFields.length;
  const missingCount = missingFields.length;
  const percentage = totalRequired > 0 ? Math.round((satisfiedCount / totalRequired) * 100) : 0;

  return {
    preset,
    percentage,
    totalRequired,
    totalCount: totalRequired,
    satisfiedCount,
    missingCount,
    satisfiedFields,
    missingFields,
    isReady: missingFields.length === 0,
  };
}

export function generateSampleProfileData(user?: { name: string; email: string; phone?: string } | null): Record<string, string> {
  const name = user?.name?.trim() || "Chiluveri Varshith";
  const email = user?.email?.trim() || "varshith.chiluveri@gmail.com";
  const phone = user?.phone?.trim() || "9876543210";

  const parts = name.split(/\s+/);
  let firstName = parts[0] || "Varshith";
  let lastName = parts.length > 1 ? parts.slice(1).join(" ") : "Chiluveri";
  if (parts.length === 2 && parts[0].toLowerCase().endsWith("i")) {
    firstName = parts[1];
    lastName = parts[0];
  }

  return {
    full_name: name,
    first_name: firstName,
    middle_name: "",
    last_name: lastName,
    name_in_regional_lang: `${name}`,
    date_of_birth: "2002-05-18",
    place_of_birth: "Hyderabad",
    district_of_birth: "Hyderabad",
    state_of_birth: "Telangana",
    gender: "Male",
    marital_status: "Single / Unmarried",
    blood_group: "O+",
    identification_mark_1: "A mole on the right side of the neck",
    identification_mark_2: "A small scar on left forearm",
    nationality: "Citizen of India by Birth",

    // Family
    father_name: `${lastName} Ramesh`,
    father_occupation: "Business & Agriculture",
    father_mobile: "9876543211",
    mother_name: `${lastName} Sujatha`,
    mother_occupation: "Homemaker",
    spouse_name: "",
    emergency_contact_name: `${lastName} Ramesh`,
    emergency_contact_phone: "+91 98765 43211",

    // Statutory IDs
    aadhaar_number: "5492 8173 9012",
    pan_number: "ABCDE1234F",
    voter_id: "TSB1928374",
    passport_number: "",
    passport_expiry_date: "",
    driving_license_number: "TS09 20220012345",
    ration_card_number: "WAP360982738910",
    apaar_id: "2024-9018-2391",
    family_id: "PPP-TS-892019",

    // Addresses
    present_address_line1: "Flat 402, Sri Sai Balaji Residency",
    present_address_line2: "Road No. 5, Sri Ram Nagar, Gachibowli",
    present_village_or_city: "Hyderabad",
    present_mandal_or_tehsil: "Serilingampally",
    present_district: "Rangareddy",
    present_state: "Telangana",
    present_pincode: "500032",
    present_post_office: "Gachibowli SO",
    present_police_station: "Gachibowli Police Station",
    is_permanent_same_as_present: "Yes",
    permanent_address_line1: "Flat 402, Sri Sai Balaji Residency",
    permanent_village_or_city: "Hyderabad",
    permanent_district: "Rangareddy",
    permanent_state: "Telangana",
    permanent_pincode: "500032",

    // Education
    highest_qualification: "Undergraduate (B.Tech / B.E)",
    tenth_board: "State Board of Secondary Education (SSC Telangana)",
    tenth_roll_no: "1923108456",
    tenth_passing_year: "2018",
    tenth_percentage: "92.4",
    twelfth_board: "Telangana Board of Intermediate Education (TSBIE)",
    twelfth_roll_no: "2156890214",
    twelfth_passing_year: "2020",
    twelfth_percentage: "89.6",
    college_name: "National Institute of Technology",
    college_aishe_code: "C-19736",
    course_name: "B.Tech in Computer Science and Engineering",
    course_year: "Final Year (4th Year)",
    admission_roll_no: "21CS042",

    // Income & Welfare
    annual_income: "180000",
    income_certificate_number: "IC-2025-TS-98174",
    social_category: "OBC (Other Backward Classes)",
    caste_subcaste: "Munnuru Kapu",
    caste_certificate_number: "CC-2024-TS-45129",
    religion: "Hinduism",
    is_minority: "No",
    is_differently_abled: "No",
    disability_percentage: "",

    // Banking
    bank_name: "State Bank of India",
    bank_branch: "Gachibowli Branch, Hyderabad",
    bank_account_number: "30982716254",
    bank_ifsc: "SBIN0011663",
    bank_account_holder: name,
    dbt_seeding_status: "Seeded (Active - Ready for DBT)",

    // Contact
    phone_number: phone,
    email: email,
  };
}

