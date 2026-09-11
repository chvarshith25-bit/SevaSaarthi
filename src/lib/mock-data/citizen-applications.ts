import { LucideIcon } from "lucide-react";

export interface ApplicationTimelineStep {
  label: string;
  date?: string;
  status: "COMPLETED" | "ACTIVE" | "ALERT" | "PENDING";
}

export interface CitizenTrackedApplication {
  id: string;
  title: string;
  serviceId: string;
  department: string;
  appliedDate: string;
  statusText: string;
  statusType: "GOV_PROCESSING" | "VERIFICATION" | "ACTION_REQUIRED" | "COMPLETED" | "DRAFT";
  statusCategory: "IN_PROGRESS" | "ACTION_REQUIRED" | "COMPLETED" | "DRAFTS";
  badgeBg: string;
  badgeText: string;
  iconType: "pan" | "scholarship" | "housing" | "income" | "caste";
  steps: ApplicationTimelineStep[];
  trackingUrl: string;
  remarks?: string;
  pendingAction?: {
    title: string;
    description: string;
    deadline?: string;
    actionUrl?: string;
    actionLabel?: string;
  };
}

export const CITIZEN_APPLICATIONS: CitizenTrackedApplication[] = [
  {
    id: "PAN-2026-0001",
    title: "PAN Card (Form 49A)",
    serviceId: "s003",
    department: "Income Tax Department",
    appliedDate: "10 Sept 2026",
    statusText: "Government Processing",
    statusType: "GOV_PROCESSING",
    statusCategory: "IN_PROGRESS",
    badgeBg: "bg-blue-50 border-blue-200/80",
    badgeText: "text-blue-700",
    iconType: "pan",
    trackingUrl: "/applications/PAN-2026-0001/status",
    steps: [
      { label: "Submitted", date: "10 Sept", status: "COMPLETED" },
      { label: "Verified", date: "10 Sept", status: "COMPLETED" },
      { label: "Government Processing", date: "12 Sept", status: "ACTIVE" },
      { label: "Officer Review", status: "PENDING" },
      { label: "PAN Generation", status: "PENDING" },
      { label: "Completed", status: "PENDING" },
    ],
  },
  {
    id: "SCH-2026-2345",
    title: "Post-Matric Scholarship",
    serviceId: "s001",
    department: "Department of Higher Education",
    appliedDate: "5 Sept 2026",
    statusText: "Verification in Progress",
    statusType: "VERIFICATION",
    statusCategory: "IN_PROGRESS",
    badgeBg: "bg-amber-50 border-amber-200/80",
    badgeText: "text-amber-700",
    iconType: "scholarship",
    trackingUrl: "/applications/SCH-2026-2345/status",
    steps: [
      { label: "Submitted", date: "5 Sept", status: "COMPLETED" },
      { label: "Initial Check", date: "6 Sept", status: "COMPLETED" },
      { label: "Verification In Progress", status: "ACTIVE" },
      { label: "Approval", status: "PENDING" },
      { label: "Disbursal", status: "PENDING" },
      { label: "Completed", status: "PENDING" },
    ],
  },
  {
    id: "HOU-2026-7781",
    title: "Housing Subsidy Scheme",
    serviceId: "s002",
    department: "Ministry of Housing and Urban Affairs",
    appliedDate: "1 Sept 2026",
    statusText: "Action Required",
    statusType: "ACTION_REQUIRED",
    statusCategory: "ACTION_REQUIRED",
    badgeBg: "bg-rose-50 border-rose-200/80",
    badgeText: "text-rose-700",
    iconType: "housing",
    trackingUrl: "/applications/HOU-2026-7781/status",
    remarks: "Utility address bill is blurry and unreadable. Please re-upload latest electricity or gas bill.",
    pendingAction: {
      title: "Re-upload Address Proof",
      description: "TSSPDCL electricity bill within last 3 months with clear address visible.",
      deadline: "Due in 2 days",
      actionUrl: "/vault",
      actionLabel: "Upload Document",
    },
    steps: [
      { label: "Submitted", date: "1 Sept", status: "COMPLETED" },
      { label: "Document Check", date: "3 Sept", status: "COMPLETED" },
      { label: "Action Required", status: "ALERT" },
      { label: "Verification", status: "PENDING" },
      { label: "Approval", status: "PENDING" },
      { label: "Completed", status: "PENDING" },
    ],
  },
  {
    id: "INC-2026-9012",
    title: "State Income Certificate",
    serviceId: "s004",
    department: "Revenue Department, Telangana",
    appliedDate: "28 Aug 2026",
    statusText: "Delivered & Issued",
    statusType: "COMPLETED",
    statusCategory: "COMPLETED",
    badgeBg: "bg-emerald-50 border-emerald-200/80",
    badgeText: "text-emerald-700",
    iconType: "income",
    trackingUrl: "/applications/INC-2026-9012/status",
    steps: [
      { label: "Submitted", date: "28 Aug", status: "COMPLETED" },
      { label: "MRO Verification", date: "29 Aug", status: "COMPLETED" },
      { label: "Tahsildar Sanction", date: "30 Aug", status: "COMPLETED" },
      { label: "Digitally Signed", date: "31 Aug", status: "COMPLETED" },
      { label: "Completed", date: "31 Aug", status: "COMPLETED" },
    ],
  },
  {
    id: "CST-2026-4411",
    title: "OBC Community & Domicile Certificate",
    serviceId: "s005",
    department: "Backward Classes Welfare Department",
    appliedDate: "15 Aug 2026",
    statusText: "Completed & Archived",
    statusType: "COMPLETED",
    statusCategory: "COMPLETED",
    badgeBg: "bg-emerald-50 border-emerald-200/80",
    badgeText: "text-emerald-700",
    iconType: "caste",
    trackingUrl: "/applications/CST-2026-4411/status",
    steps: [
      { label: "Submitted", date: "15 Aug", status: "COMPLETED" },
      { label: "VRO Field Check", date: "18 Aug", status: "COMPLETED" },
      { label: "Documents Verified", date: "20 Aug", status: "COMPLETED" },
      { label: "RDO Sanction", date: "22 Aug", status: "COMPLETED" },
      { label: "Completed", date: "23 Aug", status: "COMPLETED" },
    ],
  },
];
