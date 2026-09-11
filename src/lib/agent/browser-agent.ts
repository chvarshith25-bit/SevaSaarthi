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
    dob: string;
    gender: string;
    aadhaarNo: string;
    phone: string;
    email: string;
    annualIncome: string;
    collegeName: string;
    degree: string;
    rollNo: string;
    bankAccountNo: string;
    bankIfsc: string;
    casteCategory: string;
  };
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
