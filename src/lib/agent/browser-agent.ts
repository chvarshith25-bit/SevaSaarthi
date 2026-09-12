export type AgentState =
  | "IDLE"
  | "INITIALIZING"
  | "LAUNCHING_BROWSER"
  | "NAVIGATING"
  | "INSPECTING_DOM"
  | "AUTOFILLING_FIELDS"
  | "ATTACHING_DOCUMENTS"
  | "AWAITING_USER_APPROVAL"
  | "SUBMITTING"
  | "COMPLETED"
  | "ABORTED";

export interface AgentStepLog {
  id: string;
  timestamp: string;
  type: "INFO" | "NAVIGATE" | "ACTION" | "SUCCESS" | "WARN" | "APPROVAL";
  message: string;
  field?: string;
  value?: string;
}

export interface AutofillPayload {
  serviceId: string;
  serviceName: string;
  portalUrl: string;
  portalDomain: string;
  applicant: {
    fullName: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    nameInRegionalLang?: string;
    dob: string;
    gender: string;
    maritalStatus?: string;
    bloodGroup?: string;
    placeOfBirth?: string;
    districtOfBirth?: string;
    stateOfBirth?: string;
    identificationMark1?: string;
    nationality?: string;

    // Family
    fatherName?: string;
    fatherOccupation?: string;
    fatherMobile?: string;
    motherName?: string;
    motherOccupation?: string;
    spouseName?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;

    // Statutory IDs
    aadhaarNo: string;
    panNumber?: string;
    voterId?: string;
    passportNumber?: string;
    drivingLicenseNumber?: string;
    rationCardNumber?: string;
    apaarId?: string;
    familyId?: string;

    // Contact & Address
    phone: string;
    email: string;
    presentAddressLine1?: string;
    presentAddressLine2?: string;
    presentVillageOrCity?: string;
    presentMandalOrTehsil?: string;
    presentDistrict?: string;
    presentState?: string;
    presentPincode?: string;
    presentPostOffice?: string;
    presentPoliceStation?: string;
    permanentAddressLine1?: string;
    permanentVillageOrCity?: string;
    permanentDistrict?: string;
    permanentState?: string;
    permanentPincode?: string;

    // Income & Welfare
    annualIncome: string;
    incomeCertificateNumber?: string;
    casteCategory: string;
    casteSubcaste?: string;
    casteCertificateNumber?: string;
    religion?: string;
    isMinority?: string;
    isDifferentlyAbled?: string;

    // Education
    highestQualification?: string;
    tenthBoard?: string;
    tenthRollNo?: string;
    tenthPassingYear?: string;
    tenthPercentage?: string;
    twelfthBoard?: string;
    twelfthRollNo?: string;
    twelfthPassingYear?: string;
    twelfthPercentage?: string;
    collegeName: string;
    collegeAisheCode?: string;
    degree: string;
    courseYear?: string;
    rollNo: string;

    // Banking
    bankName?: string;
    bankBranch?: string;
    bankAccountNo: string;
    bankIfsc: string;
    bankAccountHolder?: string;
    dbtSeedingStatus?: string;
  };
  rawProfileFields?: Record<string, string>;
  documents: {
    type: string;
    filename: string;
    verified: boolean;
  }[];
}

export interface AutofillSession {
  id: string;
  state: AgentState;
  currentStepIndex: number;
  totalSteps: number;
  logs: AgentStepLog[];
  filledFields: Record<string, string>;
  attachedDocs: string[];
  requiresUserApproval: boolean;
  userApproved?: boolean;
  applicationId?: string;
  submittedAt?: string;
}
