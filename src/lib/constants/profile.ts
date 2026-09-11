import { User, GraduationCap, Banknote, Landmark } from "lucide-react";
import { ProfileField } from "@/types";

export interface ProfileFieldDefinition {
  fieldName: string;
  label: string;
  placeholder: string;
  type?: string;
  category: "IDENTITY" | "EDUCATION" | "INCOME" | "BANKING";
  isKeyField?: boolean;
  options?: string[];
}

export const CANONICAL_PROFILE_FIELDS: ProfileFieldDefinition[] = [
  // 1. Identity & Personal Info (10 fields)
  { fieldName: "full_name", label: "Full Name (as per Aadhaar/10th)", placeholder: "e.g. Sai Sankeerth", category: "IDENTITY", isKeyField: true },
  { fieldName: "father_name", label: "Father's / Guardian's Full Name", placeholder: "e.g. Ramesh Kumar", category: "IDENTITY" },
  { fieldName: "mother_name", label: "Mother's Full Name", placeholder: "e.g. Lakshmi Devi", category: "IDENTITY" },
  { fieldName: "date_of_birth", label: "Date of Birth", placeholder: "YYYY-MM-DD", type: "date", category: "IDENTITY", isKeyField: true },
  { fieldName: "gender", label: "Gender", placeholder: "Male / Female / Other", category: "IDENTITY", isKeyField: true, options: ["Male", "Female", "Other"] },
  { fieldName: "aadhaar_number", label: "Aadhaar Number (12-digit UID)", placeholder: "12-digit Aadhaar UID", category: "IDENTITY", isKeyField: true },
  { fieldName: "phone_number", label: "Primary Mobile Number (Aadhaar Linked)", placeholder: "10-digit mobile number", category: "IDENTITY" },
  { fieldName: "email", label: "Primary Email Address", placeholder: "e.g. user@example.com", category: "IDENTITY" },
  { fieldName: "location", label: "Current City & State", placeholder: "e.g. Hyderabad, Telangana", category: "IDENTITY", isKeyField: true },
  { fieldName: "permanent_address", label: "Permanent Address & Pincode", placeholder: "House No, Street, Landmark, Pincode", category: "IDENTITY" },

  // 2. Academic & College Details (6 fields)
  { fieldName: "college_name", label: "College / University Name", placeholder: "e.g. Vidya Jyothi Institute of Technology", category: "EDUCATION", isKeyField: true },
  { fieldName: "education_degree", label: "Course / Degree & Branch", placeholder: "e.g. B.Tech Computer Science & Engineering", category: "EDUCATION", isKeyField: true },
  { fieldName: "current_year", label: "Current Year / Semester of Study", placeholder: "e.g. 3rd Year / 5th Sem", category: "EDUCATION" },
  { fieldName: "roll_number", label: "Roll / Hall Ticket / Registration Number", placeholder: "e.g. 22071A0589", category: "EDUCATION" },
  { fieldName: "tenth_percentage", label: "Class 10 (SSC) Percentage / GPA", placeholder: "e.g. 92.4% or 9.5 GPA", category: "EDUCATION" },
  { fieldName: "twelfth_percentage", label: "Class 12 / Intermediate Percentage / Marks", placeholder: "e.g. 88.6% or 886/1000", category: "EDUCATION" },

  // 3. Income & Reservation Category (6 fields)
  { fieldName: "annual_income", label: "Annual Family Household Income (₹)", placeholder: "e.g. 180000", type: "number", category: "INCOME", isKeyField: true },
  { fieldName: "income_cert_no", label: "Income Certificate / MeeSeva Application No", placeholder: "e.g. IC01240982312", category: "INCOME" },
  { fieldName: "caste_category", label: "Caste / Social Category", placeholder: "General / OBC / SC / ST / EWS", category: "INCOME", options: ["General", "OBC", "SC", "ST", "EWS"] },
  { fieldName: "sub_caste", label: "Sub-Caste / Community Name", placeholder: "e.g. Yadava, Kapu, Reddy, Brahmin, Mala, Madiga", category: "INCOME" },
  { fieldName: "minority_status", label: "Religious Minority Status", placeholder: "No / Muslim / Christian / Sikh / Jain / Buddhist", category: "INCOME", options: ["No", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Parsi"] },
  { fieldName: "disability_status", label: "Differently Abled / PwD Status", placeholder: "No / Yes (40%+ disability)", category: "INCOME", options: ["No", "Yes (40%+ disability)", "Yes (Less than 40%)"] },

  // 4. Banking & DBT Seeding (5 fields)
  { fieldName: "bank_name", label: "Bank Name & Branch", placeholder: "e.g. State Bank of India, Himayathnagar", category: "BANKING" },
  { fieldName: "bank_account_no", label: "Bank Savings Account Number", placeholder: "e.g. 38491029481", category: "BANKING", isKeyField: true },
  { fieldName: "bank_ifsc", label: "Bank IFSC Code", placeholder: "e.g. SBIN0012948", category: "BANKING", isKeyField: true },
  { fieldName: "account_holder_name", label: "Account Holder Name (Must match Aadhaar)", placeholder: "e.g. Sai Sankeerth", category: "BANKING" },
  { fieldName: "dbt_seeding_status", label: "Aadhaar-NPCI DBT Seeding Status", placeholder: "Seeded (Active) / Linked", category: "BANKING", options: ["Seeded (Active)", "Linked", "Not Seeded"] },
];

export const PROFILE_CATEGORIES = [
  { key: "IDENTITY" as const, title: "Identity & Personal Info", icon: User, iconBg: "bg-indigo-50 text-indigo-600" },
  { key: "EDUCATION" as const, title: "Academic & College Details", icon: GraduationCap, iconBg: "bg-blue-50 text-blue-600" },
  { key: "INCOME" as const, title: "Income & Reservation Category", icon: Banknote, iconBg: "bg-amber-50 text-amber-600" },
  { key: "BANKING" as const, title: "Bank Account (DBT Seeding)", icon: Landmark, iconBg: "bg-emerald-50 text-emerald-600" },
];

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
