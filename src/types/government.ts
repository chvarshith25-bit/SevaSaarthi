export type GovernmentRole = 'OFFICER' | 'DEPT_ADMIN' | 'SYS_ADMIN';

export interface GovernmentUser {
  id: string;
  name: string;
  email: string;
  role: GovernmentRole;
  roleTitle: string;
  department: string;
  office: string;
  avatar?: string;
}

export type ApplicationStage =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VALIDATING'
  | 'VERIFICATION_IN_PROGRESS'
  | 'VERIFIED'
  | 'GOVERNMENT_PROCESSING'
  | 'OFFICER_ASSIGNED'
  | 'OFFICER_REVIEW'
  | 'APPROVED'
  | 'PAN_GENERATION'
  | 'CARD_PRINTING'
  | 'DISPATCHED'
  | 'DELIVERED';

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'ACTION_REQUIRED'
  | 'VERIFICATION_CONFLICT'
  | 'MANUAL_REVIEW'
  | 'API_UNAVAILABLE'
  | 'RETURNED_FOR_CORRECTION'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export type PriorityLevel = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

export interface CitizenApplicationData {
  fullName: string;
  fatherName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: string;
  mobile: string;
  email: string;
  aadhaarNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface VerificationCheck {
  id: string;
  name: string;
  source: string;
  status: 'VERIFIED' | 'CONFLICT' | 'PENDING' | 'FAILED';
  matchScore: number;
  details: string;
  timestamp: string;
  applicationValue?: string;
  registryValue?: string;
  documentValue?: string;
}

export interface ConsentRecord {
  granted: boolean;
  purpose: string;
  legalAct: string;
  consentId: string;
  timestamp: string;
  ipAddress?: string;
  consentText?: string;
}

export interface PhysicalCardDetails {
  applied?: boolean;
  panNumber?: string;
  printedAt?: string;
  dispatchPartner?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  deliveryAddress?: string;
  status?: string;
  requestedAt?: string;
}

export interface PanApplicationRecord {
  id: string; // e.g. "PAN-2026-0001"
  userId: string;
  serviceId: string;
  serviceName: string;
  department: string;
  office: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  stage: ApplicationStage;
  status: ApplicationStatus;
  priority: PriorityLevel;
  slaDeadline: string; // ISO string
  assignedOfficerId: string | null;
  assignedOfficerName: string | null;
  data: CitizenApplicationData;
  documents: {
    identityProof: { name: string; type: string; status: 'VERIFIED' | 'PENDING' | 'FLAGGED'; url?: string; note?: string };
    dobProof: { name: string; type: string; status: 'VERIFIED' | 'PENDING' | 'FLAGGED'; url?: string; note?: string };
    addressProof: { name: string; type: string; status: 'VERIFIED' | 'PENDING' | 'FLAGGED'; url?: string; note?: string };
  };
  verifications: VerificationCheck[];
  consent: ConsentRecord;
  physicalCard: PhysicalCardDetails;
  officerRemarks?: string;
  correctionReason?: string;
  rejectionReason?: string;
  aiSummary: {
    status: 'OPTIMAL' | 'ATTENTION_NEEDED' | 'CRITICAL_MISMATCH';
    summary: string;
    detectedIssues: string[];
    suggestedAction: string;
    confidenceScore: number;
    disclaimer: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogRecord {
  id: string;
  applicationId?: string;
  timestamp: string;
  actor: {
    id: string;
    name: string;
    role: 'CITIZEN' | 'OFFICER' | 'ADMIN' | 'SYSTEM_WORKFLOW' | 'CONNECTOR_JOB';
  };
  action: string;
  stage?: ApplicationStage | string;
  source: string;
  target: string;
  purpose: string;
  consentToken?: string;
  result: 'SUCCESS' | 'WARNING' | 'FAILURE';
  details: string;
  requestId: string;
  tamperHash?: string;
}

export interface ConnectorRequestRecord {
  id: string;
  systemName: string;
  systemKey: 'identity' | 'document' | 'pan_core' | 'printing' | 'dispatch';
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  endpoint: string;
  method: 'POST' | 'GET';
  latencyMs: number;
  statusCode: number;
  applicationId?: string;
  requestPayloadSummary: string;
  responseSummary: string;
  timestamp: string;
  retryCount: number;
}

export interface ExceptionRecord {
  id: string;
  severity: 'CRITICAL' | 'MANUAL_REVIEW' | 'DELAYED' | 'HIGH';
  title: string;
  applicationId: string;
  systemName: string;
  timestamp: string;
  whatHappened: string;
  whyItHappened: string;
  currentState: string;
  autoRetry: boolean;
  retryAttempts: number;
  humanActionRequired: string;
  isResolved: boolean;
  resolved?: boolean;
  resolvedAt?: string;
  applicantName?: string;
  exceptionType?: string;
  systemSource?: string;
  description?: string;
  retryCount?: number;
  resolutionNote?: string;
}

export interface SystemMonitoringStats {
  runningWorkflows: number;
  completedWorkflows: number;
  pendingWorkflows: number;
  failedWorkflows: number;
  manualReviewWorkflows: number;
  averageVerificationSec: number;
  averageOfficerReviewMin: number;
  apiSuccessRatePercent: number;
  connectors: {
    key: string;
    name: string;
    status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
    latencyMs: number;
    uptimePercent: number;
    requestsToday: number;
  }[];
}

export interface ConnectedSystemInfo {
  key: "identity" | "document" | "pan_core" | "printing" | "dispatch";
  name: string;
  agency: string;
  endpoint: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  latencyMs: number;
  uptimePercent: number;
  requestsToday: number;
  lastPing: string;
}

