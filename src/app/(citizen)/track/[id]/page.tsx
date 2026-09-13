"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Check,
  Clock,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Shield,
  Truck,
  FileText,
  CreditCard,
  RefreshCw,
  Send,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Copy,
  MapPin,
  Calendar,
  User,
  Info,
  GraduationCap,
  Home,
  Award,
  Landmark,
  Building2,
} from "lucide-react";
import { PanApplicationRecord, ApplicationStage, ApplicationStatus } from "@/types/government";
import { toast } from "sonner";

export default function PanTrackerPage() {
  const params = useParams();
  const router = useRouter();
  const appId = (params?.id as string) || "PAN-2026-0001";

  const [application, setApplication] = useState<PanApplicationRecord | null>(null);
  const [aiAssistance, setAiAssistance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [correctionInput, setCorrectionInput] = useState("");
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);
  const [isRetryingGateway, setIsRetryingGateway] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchApplication = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch(`/api/track/${appId}`);
      const data = await res.json();
      if (data.success && data.application) {
        setApplication(data.application);
        setAiAssistance(data.aiAssistance);
      } else {
        toast.error(data.error || "Application not found");
      }
    } catch (err: any) {
      console.error("Error fetching tracker application:", err);
      toast.error("Failed to load live tracking state");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplication();
    // Auto-poll every 3.5 seconds for live synchronized government status transitions
    const interval = setInterval(() => {
      fetchApplication(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [appId]);

  const handleCopyId = () => {
    if (application?.id) {
      navigator.clipboard.writeText(application.id);
      setCopied(true);
      toast.success("Application ID copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionInput.trim()) {
      toast.error("Please provide updated address or document details");
      return;
    }

    setIsSubmittingCorrection(true);
    try {
      const res = await fetch(`/api/track/${appId}/resubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updatedFields: {
            address: correctionInput.trim(),
            updatedDocumentNote: "High-resolution address proof re-uploaded by citizen.",
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Correction submitted successfully! Case sent back to Government Officer.");
        setApplication(data.application);
        setCorrectionInput("");
      } else {
        toast.error(data.error || "Failed to resubmit correction");
      }
    } catch (err) {
      toast.error("Error submitting correction");
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const handleRetryGateway = async (reset = false) => {
    setIsRetryingGateway(true);
    try {
      const res = await fetch(`/api/track/${appId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset }),
      });
      const data = await res.json();
      if (data.success && data.application) {
        setApplication(data.application);
        toast.success(data.message || (reset ? "Reset to timeout state" : "Gateway reconnected successfully!"));
      } else {
        toast.error(data.error || "Retry failed");
      }
    } catch (err) {
      console.error("Error retrying gateway connection:", err);
      toast.error("Failed to contact gateway retry service");
    } finally {
      setIsRetryingGateway(false);
    }
  };

  // Stage sequence index helper
  const stageOrder: ApplicationStage[] = [
    "DRAFT",
    "SUBMITTED",
    "VALIDATING",
    "VERIFICATION_IN_PROGRESS",
    "VERIFIED",
    "GOVERNMENT_PROCESSING",
    "OFFICER_ASSIGNED",
    "OFFICER_REVIEW",
    "APPROVED",
    "PAN_GENERATION",
    "CARD_PRINTING",
    "DISPATCHED",
    "DELIVERED",
  ];

  const currentStageIdx = application ? stageOrder.indexOf(application.stage) : -1;

  // Determine stage status
  const isSubmittedDone = currentStageIdx >= stageOrder.indexOf("SUBMITTED");
  const isVerificationDone = currentStageIdx >= stageOrder.indexOf("VERIFIED");
  const isGovProcessingActive = currentStageIdx >= stageOrder.indexOf("GOVERNMENT_PROCESSING");
  const isOfficerReviewDone = currentStageIdx > stageOrder.indexOf("OFFICER_REVIEW");
  const isOfficerReviewCurrent = application?.stage === "OFFICER_REVIEW" || application?.stage === "OFFICER_ASSIGNED";
  const isPanGeneratedDone = currentStageIdx >= stageOrder.indexOf("PAN_GENERATION");
  const isCardPrintingDone = currentStageIdx >= stageOrder.indexOf("CARD_PRINTING");
  const isDispatchedDone = currentStageIdx >= stageOrder.indexOf("DISPATCHED");
  const isDeliveredDone = currentStageIdx >= stageOrder.indexOf("DELIVERED");

  if (loading && !application) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Connecting to Government Tracking Pipeline...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Application Not Found</h2>
          <p className="text-xs text-slate-500">
            No application with ID <span className="font-mono font-bold text-slate-800">{appId}</span> was found in the government registry.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700"
            >
              Go to Home
            </Link>
            <button
              onClick={() => router.push("/applications/PAN-2026-0001/status")}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200"
            >
              Demo PAN-0001
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Format timestamp
  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const isScholarship =
    application?.serviceId === "srv_scholarship_merit" ||
    application?.serviceId === "s001" ||
    application?.id.startsWith("SCH-") ||
    application?.id.startsWith("NSP-") ||
    application?.serviceName?.toLowerCase().includes("scholarship");

  const isHousing =
    application?.serviceId === "srv_pmay_housing" ||
    application?.id.startsWith("HOU-") ||
    application?.serviceName?.toLowerCase().includes("housing");

  const isIncomeCert =
    application?.serviceId === "s006" ||
    application?.id.startsWith("INC-") ||
    application?.serviceName?.toLowerCase().includes("income");

  const isCasteCert =
    application?.id.startsWith("CST-") ||
    application?.serviceName?.toLowerCase().includes("caste");

  const isPanService =
    !isScholarship &&
    !isHousing &&
    !isIncomeCert &&
    !isCasteCert &&
    (application?.serviceId === "srv_pan_new" || application?.id.startsWith("PAN-") || true);

  const serviceTrackerTitle = isScholarship
    ? "SCHOLARSHIP APPLICATION TRACKER"
    : isHousing
    ? "HOUSING SUBSIDY APPLICATION TRACKER"
    : isIncomeCert
    ? "INCOME CERTIFICATE TRACKER"
    : isCasteCert
    ? "CASTE CERTIFICATE TRACKER"
    : isPanService
    ? "PAN APPLICATION TRACKER"
    : `${(application?.serviceName || "SERVICE").toUpperCase()} TRACKER`;

  const departmentTitle = isScholarship
    ? "Department of Higher Education • Ministry of Education (NSP)"
    : isHousing
    ? "Ministry of Housing and Urban Affairs • PMAY Urban"
    : isIncomeCert
    ? "Revenue Department • e-District Service Cell"
    : isCasteCert
    ? "Revenue & Welfare Department • e-District Portal"
    : isPanService
    ? "National e-Governance Division • Income Tax Department (CBDT)"
    : (application?.department || "National e-Governance Division");

  const stage1Description = isScholarship
    ? "National Scholarship Portal (NSP) Common Application intake validated with academic records and digital consent under Section 6 of DPDP Act 2023."
    : isHousing
    ? "PMAY Urban intake validated with citizen digital consent token and housing registry under Section 6 of DPDP Act 2023."
    : isIncomeCert
    ? "Revenue Department Form-1 intake validated with citizen digital consent token under Section 6 of DPDP Act 2023."
    : isCasteCert
    ? "Caste verification application intake validated with citizen digital consent token under Section 6 of DPDP Act 2023."
    : "Form 49A intake validated with citizen digital consent token under Section 6 of DPDP Act 2023.";

  const stage2Description = isScholarship
    ? "Identity verified via UIDAI Aadhaar; college affiliation verified via AISHE database; annual family income verified via State MeeSeva e-District."
    : isHousing
    ? "Identity verified via UIDAI Aadhaar; land record & title verified via Dharani/Meebhoomi registry; family income verified via State e-District."
    : isIncomeCert
    ? "Identity verified via UIDAI Aadhaar; ration card and family income validated with State Civil Supplies database."
    : isCasteCert
    ? "Identity verified via UIDAI Aadhaar; lineage/caste record cross-matched with State Social Welfare registry."
    : "Identity verified against UIDAI Aadhaar Gateway; educational DOB proof verified via DigiLocker (Simulated Sandbox Connectors).";

  const stage3Jurisdiction = isScholarship
    ? (application?.office || "State Scholarship Sanction Cell (Hyderabad)")
    : isHousing
    ? (application?.office || "PMAY Urban Mission Cell (Hyderabad)")
    : isIncomeCert || isCasteCert
    ? (application?.office || "Mandal Revenue Office (MRO)")
    : (application?.office || "Regional Processing Cell (Hyderabad)");

  const getSubStages = () => {
    if (isScholarship) {
      return [
        {
          id: 1,
          title: "Institutional Verification",
          sla: "SLA: 24h",
          icon: GraduationCap,
          isDone: isOfficerReviewDone,
          isCurrent: isOfficerReviewCurrent,
          statusLabel: isOfficerReviewDone
            ? "Institution Approved ✓"
            : isOfficerReviewCurrent
            ? application?.status === "RETURNED_FOR_CORRECTION"
              ? "Action Required"
              : application?.status === "VERIFICATION_CONFLICT"
              ? "AISHE Scrutiny"
              : "Institutional Review"
            : "Pending",
          subtext: isOfficerReviewDone
            ? "Bonafide & Enrollment verified with AISHE portal"
            : "Owner: College Nodal Officer (AISHE Portal)",
        },
        {
          id: 2,
          title: "State Officer Merit Sanction",
          sla: "SLA: 48h",
          icon: Shield,
          isDone: isPanGeneratedDone,
          isCurrent: currentStageIdx === stageOrder.indexOf("APPROVED"),
          statusLabel: isPanGeneratedDone ? "Sanctioned ✓" : "SLA: 48h",
          subtext: isPanGeneratedDone
            ? "Merit quota approved by State Sanction Cell"
            : `Owner: ${application?.assignedOfficerName || "State Nodal Officer (DHE)"}`,
        },
        {
          id: 3,
          title: "PFMS Sanction Token",
          sla: "SLA: 24h",
          icon: FileText,
          isDone: isCardPrintingDone,
          isCurrent: application?.stage === "CARD_PRINTING",
          statusLabel: isCardPrintingDone ? "Token Generated ✓" : "SLA: 24h",
          subtext: "Owner: Public Financial Management System (PFMS)",
        },
        {
          id: 4,
          title: "DBT Treasury Release",
          sla: "SLA: 24h",
          icon: Send,
          isDone: isDispatchedDone,
          isCurrent: application?.stage === "DISPATCHED",
          statusLabel: isDispatchedDone ? "Treasury Released ✓" : "SLA: 24h",
          subtext: "Owner: State Finance Dept & NPCI APBS",
        },
        {
          id: 5,
          title: "Account Credited (DBT)",
          sla: "Direct Credit",
          icon: Landmark,
          isDone: isDeliveredDone,
          isCurrent: false,
          statusLabel: isDeliveredDone ? "Amount Credited ✓" : "Direct Benefit Transfer",
          subtext: "Owner: Aadhaar Payment Bridge System (APBS)",
        },
      ];
    }

    if (isHousing) {
      return [
        {
          id: 1,
          title: "Field Survey & Geo-tagging",
          sla: "SLA: 48h",
          icon: Home,
          isDone: isOfficerReviewDone,
          isCurrent: isOfficerReviewCurrent,
          statusLabel: isOfficerReviewDone
            ? "Geo-tagged ✓"
            : isOfficerReviewCurrent
            ? application?.status === "RETURNED_FOR_CORRECTION"
              ? "Action Required"
              : application?.status === "VERIFICATION_CONFLICT"
              ? "Survey Dispute"
              : "Survey Active"
            : "Pending",
          subtext: isOfficerReviewDone
            ? "Site inspection and Bhuvan geo-tagging verified"
            : "Owner: Municipal Town Planning Surveyor",
        },
        {
          id: 2,
          title: "ULB Scrutiny & Approval",
          sla: "SLA: 72h",
          icon: Building2,
          isDone: isPanGeneratedDone,
          isCurrent: currentStageIdx === stageOrder.indexOf("APPROVED"),
          statusLabel: isPanGeneratedDone ? "Approved ✓" : "SLA: 72h",
          subtext: isPanGeneratedDone
            ? "Approved by ULB Project Cell"
            : `Owner: ${application?.assignedOfficerName || "ULB Commissioner"}`,
        },
        {
          id: 3,
          title: "Central CSMC Quota Sanction",
          sla: "SLA: 48h",
          icon: FileText,
          isDone: isCardPrintingDone,
          isCurrent: application?.stage === "CARD_PRINTING",
          statusLabel: isCardPrintingDone ? "Quota Allocated ✓" : "SLA: 48h",
          subtext: "Owner: MoHUA PMAY Directorate",
        },
        {
          id: 4,
          title: "CNA Bank Subsidy Credit",
          sla: "SLA: 72h",
          icon: Send,
          isDone: isDispatchedDone,
          isCurrent: application?.stage === "DISPATCHED",
          statusLabel: isDispatchedDone ? "Subsidy Credited ✓" : "SLA: 72h",
          subtext: "Owner: CNA Banking Channel",
        },
        {
          id: 5,
          title: "Beneficiary Certificate",
          sla: "Fulfilled",
          icon: CheckCircle2,
          isDone: isDeliveredDone,
          isCurrent: false,
          statusLabel: isDeliveredDone ? "Certificate Issued ✓" : "Final Delivery",
          subtext: "Owner: Citizen Home Loan Account Adjusted",
        },
      ];
    }

    if (isIncomeCert || isCasteCert) {
      return [
        {
          id: 1,
          title: "Field & Revenue Scrutiny",
          sla: "SLA: 24h",
          icon: User,
          isDone: isOfficerReviewDone,
          isCurrent: isOfficerReviewCurrent,
          statusLabel: isOfficerReviewDone
            ? "Field Verified ✓"
            : isOfficerReviewCurrent
            ? application?.status === "RETURNED_FOR_CORRECTION"
              ? "Action Required"
              : application?.status === "VERIFICATION_CONFLICT"
              ? "Conflict Review"
              : "Under Review"
            : "Pending",
          subtext: isOfficerReviewDone
            ? `Verified by ${application?.assignedOfficerName || "Revenue Inspector"}`
            : `Owner: ${application?.assignedOfficerName || "Revenue Inspector"} (SLA: 24h)`,
        },
        {
          id: 2,
          title: "Tahsildar Digital Sign & Approval",
          sla: "SLA: 24h",
          icon: Shield,
          isDone: isPanGeneratedDone,
          isCurrent: currentStageIdx === stageOrder.indexOf("APPROVED"),
          statusLabel: isPanGeneratedDone ? "Approved & Signed ✓" : "SLA: 24h",
          subtext: "Owner: Tahsildar Digital Signature Cell",
        },
        {
          id: 3,
          title: "Digital Certificate Generation",
          sla: "SLA: 1h",
          icon: FileText,
          isDone: isCardPrintingDone,
          isCurrent: application?.stage === "CARD_PRINTING",
          statusLabel: isCardPrintingDone ? "Generated ✓" : "SLA: 1h",
          subtext: "Owner: e-District Certificate Generator",
        },
        {
          id: 4,
          title: "DigiLocker Push & Sync",
          sla: "SLA: 15m",
          icon: Send,
          isDone: isDispatchedDone,
          isCurrent: application?.stage === "DISPATCHED",
          statusLabel: isDispatchedDone ? "Synced ✓" : "SLA: 15m",
          subtext: "Owner: National DigiLocker Gateway",
        },
        {
          id: 5,
          title: "Available in Vault & Download",
          sla: "Instant Download",
          icon: Award,
          isDone: isDeliveredDone,
          isCurrent: false,
          statusLabel: isDeliveredDone ? "Available in Vault ✓" : "Ready to Download",
          subtext: "Owner: Seva Saarthi Citizen Vault",
        },
      ];
    }

    // Default: PAN
    return [
      {
        id: 1,
        title: "Officer Review",
        sla: "SLA: 4h",
        icon: User,
        isDone: isOfficerReviewDone,
        isCurrent: isOfficerReviewCurrent,
        statusLabel: isOfficerReviewDone
          ? "Approved ✓"
          : isOfficerReviewCurrent
          ? application?.status === "RETURNED_FOR_CORRECTION"
            ? "Action Required"
            : application?.status === "VERIFICATION_CONFLICT"
            ? "Conflict Review"
            : "Under Review"
          : "Pending",
        subtext: isOfficerReviewDone
          ? `Approved by ${application?.assignedOfficerName || "Department Officer"}`
          : `Owner: ${application?.assignedOfficerName || "Department Officer"} (SLA: 4h)`,
      },
      {
        id: 2,
        title: "PAN Generated",
        sla: "SLA: 15m",
        icon: CreditCard,
        isDone: isPanGeneratedDone,
        isCurrent: currentStageIdx === stageOrder.indexOf("APPROVED"),
        statusLabel: isPanGeneratedDone ? "Allocated ✓" : "SLA: 15m",
        subtext: application?.physicalCard?.panNumber ? (
          <span className="font-mono font-bold text-indigo-700">
            PAN: {application.physicalCard.panNumber}
          </span>
        ) : (
          "Owner: CBDT PAN Core Engine"
        ),
      },
      {
        id: 3,
        title: "Card Printing",
        sla: "SLA: 24h",
        icon: FileText,
        isDone: isCardPrintingDone,
        isCurrent: application?.stage === "CARD_PRINTING",
        statusLabel: isCardPrintingDone ? "Printed ✓" : "SLA: 24h",
        subtext: "Owner: India Security Press (SPMCIL), Nashik",
      },
      {
        id: 4,
        title: "Dispatched",
        sla: "SLA: 48h",
        icon: Truck,
        isDone: isDispatchedDone,
        isCurrent: application?.stage === "DISPATCHED",
        statusLabel: isDispatchedDone ? "Dispatched ✓" : "SLA: 48h",
        subtext: application?.physicalCard?.trackingNumber ? (
          <span className="font-mono font-bold text-indigo-700">
            Speed Post: {application.physicalCard.trackingNumber}
          </span>
        ) : (
          "Owner: India Post Speed Post Logistics"
        ),
      },
      {
        id: 5,
        title: "Delivered",
        sla: "Final Delivery",
        icon: MapPin,
        isDone: isDeliveredDone,
        isCurrent: false,
        statusLabel: isDeliveredDone ? "Delivered ✓" : "Final Delivery",
        subtext: "Owner: Local Post Office Delivery Division",
      },
    ];
  };

  const getCurrentStatusText = () => {
    if (!application) return "";

    if (application.stage === "SUBMITTED") {
      return isScholarship
        ? "Scholarship application received. Initiating automated academic eligibility validation."
        : isHousing
        ? "PMAY housing subsidy application received. Commencing automated registry validation."
        : isIncomeCert || isCasteCert
        ? "Certificate application received. Commencing automated civil supplies verification."
        : "Application received. Commencing automated verification.";
    }

    if (application.stage === "VALIDATING") {
      return "Pre-flight verification in progress.";
    }

    if (application.stage === "VERIFICATION_IN_PROGRESS") {
      if (application.status === "API_UNAVAILABLE") {
        return "Downstream government API timed out. Background retry queue active.";
      }
      return isScholarship
        ? "Verifying college bonafide with AISHE portal and family income via State MeeSeva e-District."
        : isHousing
        ? "Verifying beneficiary identity and property classification against land revenue records."
        : isIncomeCert || isCasteCert
        ? "Checking identity and civil supplies family registry via MeeSeva e-District."
        : "Checking identity credentials with UIDAI and DigiLocker registries.";
    }

    if (application.stage === "VERIFIED") {
      return isScholarship
        ? "Automated checks passed. Routing to Institutional and State Sanction Cell."
        : isHousing
        ? "Automated checks passed. Routing to Municipal Town Planning Cell for geo-tagging."
        : isIncomeCert || isCasteCert
        ? "Automated checks passed. Forwarded to Village Revenue Officer (VRO) for field scrutiny."
        : "Automated checks passed. Routing to Regional Processing Cell.";
    }

    if (application.stage === "GOVERNMENT_PROCESSING") {
      if (application.status === "VERIFICATION_CONFLICT") {
        return isScholarship
          ? "Income threshold or academic record discrepancy detected. Assigned to Nodal Officer for manual review."
          : "DOB conflict detected across source registries. Manual officer review in progress.";
      }
      return isScholarship
        ? "Institutional verification cleared. State Scholarship Cell processing merit allocation."
        : isHousing
        ? "Municipal Urban Local Body processing field inspection and subsidy eligibility."
        : isIncomeCert || isCasteCert
        ? "Mandal Revenue Office processing digital certificate issuance."
        : "Government processing your application";
    }

    if (application.stage === "OFFICER_ASSIGNED") {
      return isScholarship
        ? `Assigned to ${application.assignedOfficerName || "State Nodal Officer"} for merit sanction.`
        : isHousing
        ? `Assigned to ${application.assignedOfficerName || "Town Planning Officer"} for inspection scrutiny.`
        : isIncomeCert || isCasteCert
        ? `Assigned to ${application.assignedOfficerName || "Tahsildar / MRO"} for statutory approval.`
        : "Assigned to authorized Department Officer for statutory review.";
    }

    if (application.stage === "OFFICER_REVIEW") {
      if (application.status === "RETURNED_FOR_CORRECTION") {
        return "Application returned by officer for document correction.";
      }
      if (application.status === "REJECTED") {
        return "Application closed by officer.";
      }
      return isScholarship
        ? `Under statutory review with ${application.assignedOfficerName || "State Nodal Officer"}.`
        : isHousing
        ? `Under review by ${application.assignedOfficerName || "Municipal Officer"}.`
        : isIncomeCert || isCasteCert
        ? `Under review by ${application.assignedOfficerName || "Mandal Revenue Officer"}.`
        : "Government processing your application";
    }

    if (application.stage === "APPROVED") {
      return isScholarship
        ? "Scholarship approved! Generating PFMS DBT disbursement sanction token."
        : isHousing
        ? "Housing subsidy approved! MoHUA CNA subsidy sanction order generated."
        : isIncomeCert || isCasteCert
        ? "Certificate approved and digitally signed by Tahsildar!"
        : "Officer Approved! Triggering automated PAN issuance.";
    }

    if (application.stage === "PAN_GENERATION") {
      return isScholarship
        ? "PFMS Sanction Token active. Ready for State Treasury release."
        : isHousing
        ? "Sanction order registered with Central Nodal Agency."
        : isIncomeCert || isCasteCert
        ? "Digital certificate PDF compiled and signed via e-Sign DSC."
        : `Permanent Account Number allocated: ${application.physicalCard?.panNumber || "Generating..."}`;
    }

    if (application.stage === "CARD_PRINTING") {
      return isScholarship
        ? "DBT fund release authorized by State Treasury."
        : isHousing
        ? "Subsidy amount queued for credit with lending bank."
        : isIncomeCert || isCasteCert
        ? "Certificate published and push initiated to National DigiLocker."
        : "Physical card currently in high-security print run at ISP Nashik.";
    }

    if (application.stage === "DISPATCHED") {
      return isScholarship
        ? "Scholarship funds transmitted via NPCI Aadhaar Payment Bridge (APBS)."
        : isHousing
        ? "Interest subsidy credited to Home Loan account!"
        : isIncomeCert || isCasteCert
        ? "Certificate successfully synced to your Document Vault."
        : `Dispatched via India Post Speed Post (${application.physicalCard?.trackingNumber || "Assigned"})`;
    }

    if (application.stage === "DELIVERED") {
      return isScholarship
        ? "Scholarship amount successfully credited to your Aadhaar-seeded bank account!"
        : isHousing
        ? "PMAY Subsidy successfully credited to your loan account. Beneficiary certificate generated."
        : isIncomeCert || isCasteCert
        ? "Certificate issued and verified. Available in Vault for instant download."
        : "Physical PAN card successfully delivered!";
    }

    return "Application status updated.";
  };

  const getCurrentStageOwner = () => {
    if (application?.stage === "OFFICER_REVIEW" || application?.stage === "OFFICER_ASSIGNED") {
      return application.assignedOfficerName || (isScholarship ? "Officer M. K. Rao (State Nodal Cell)" : "Officer Sai Sankeerth (RPC Hyderabad)");
    }
    if (isScholarship) {
      if (application?.stage === "PAN_GENERATION") return "Public Financial Management System (PFMS)";
      if (application?.stage === "CARD_PRINTING") return "State Treasury / Directorate of Higher Education";
      if (application?.stage === "DISPATCHED") return "NPCI Aadhaar Payment Bridge System (APBS)";
      if (application?.stage === "DELIVERED") return "Aadhaar-Seeded Bank Account (DBT Credited)";
      return "State Scholarship Sanction Cell";
    }
    if (isHousing) {
      if (application?.stage === "PAN_GENERATION") return "MoHUA Central Sanctioning Committee";
      if (application?.stage === "CARD_PRINTING") return "Central Nodal Agency (HUDCO/NHB)";
      if (application?.stage === "DISPATCHED") return "Lending Financial Institution / Bank";
      if (application?.stage === "DELIVERED") return "PMAY Urban Beneficiary Registry";
      return "PMAY Mission Directorate";
    }
    if (isIncomeCert || isCasteCert) {
      if (application?.stage === "PAN_GENERATION") return "e-District Digital Signature Gateway";
      if (application?.stage === "CARD_PRINTING") return "National DigiLocker Repository";
      if (application?.stage === "DISPATCHED") return "State e-District Portal";
      if (application?.stage === "DELIVERED") return "Seva Saarthi Citizen Vault";
      return "Revenue Department";
    }
    // PAN default
    if (application?.stage === "PAN_GENERATION") return "CBDT PAN Core Engine";
    if (application?.stage === "CARD_PRINTING") return "India Security Press, Nashik";
    if (application?.stage === "DISPATCHED") return "India Post Speed Post Division";
    if (application?.stage === "DELIVERED") return "Local Post Office Delivery Division";
    return "Formly Orchestration Hub";
  };

  const getCurrentSla = () => {
    if (application?.stage === "OFFICER_REVIEW") {
      return isScholarship ? "48 Hours Target Window" : isHousing ? "72 Hours Target Window" : "4 Hours Target Window";
    }
    if (application?.stage === "PAN_GENERATION") return isScholarship ? "24 Hours (PFMS Batch)" : "15 Minutes";
    if (application?.stage === "CARD_PRINTING") return "24 Hours";
    if (application?.stage === "DISPATCHED") return isScholarship ? "24 Hours (APBS Batch)" : "48 Hours";
    if (application?.stage === "DELIVERED") return "Fulfilled";
    return "Automated (Instant)";
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 pb-16">
      {/* Top Utility Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Track Demo Case:</span>
              <select
                value={appId}
                onChange={(e) => router.push(`/track/${e.target.value}`)}
                className="text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="HOU-2026-7781">HOU-2026-7781 (PM Housing Subsidy - Action Required)</option>
                <option value="NSP-2026-8812">NSP-2026-8812 (Post-Matric Scholarship - In Progress)</option>
                <option value="INC-2026-3021">INC-2026-3021 (Income Certificate - Delivered)</option>
                <option value="CST-2026-1190">CST-2026-1190 (Caste Certificate - Delivered)</option>
                <option value="PAN-2026-0001">PAN-2026-0001 (PAN Card - Officer Review)</option>
                <option value="PAN-2026-0002">PAN-2026-0002 (PAN Card - Gateway Delay / Auto-Retry Demo)</option>
                <option value="PAN-2026-0003">PAN-2026-0003 (PAN Card - DOB Conflict)</option>
                <option value="PAN-2026-0004">PAN-2026-0004 (PAN Card - Returned for Fix)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchApplication(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg transition-colors"
              title="Refresh live status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
              <span className="hidden md:inline">Sync Status</span>
            </button>
            <Link
              href="/applications"
              className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-all"
            >
              <span>All Applications</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Tracker Card matching User's ASCII Diagram */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Card Title Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-6 sm:px-8 text-center relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Demonstration State Machine Engine (SIH Prototype)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase">
              {serviceTrackerTitle}
            </h1>
            <p className="text-xs text-indigo-200/80 mt-1">
              {departmentTitle}
            </p>
          </div>

          {/* Meta Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Application ID</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-slate-900 text-sm">{application.id}</span>
                <button
                  onClick={handleCopyId}
                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                  title="Copy Application ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Applicant</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{application.applicantName}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Service</div>
              <div className="font-bold text-indigo-700 text-sm mt-0.5">
                {application.serviceName || (isPanService ? "PAN Card (Form 49A)" : "Government Service")}
              </div>
            </div>
          </div>

          {/* Stage Diagram: Horizontal Top Stages & Vertical Government Flow */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Column 1: Application Submitted */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">STAGE 1</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      SLA: 60s (Instant)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs transition-all ${
                        isSubmittedDone
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-50"
                          : "bg-slate-100 text-slate-400 border border-slate-300"
                      }`}
                    >
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        APPLICATION SUBMITTED
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-600">Completeness Verified ✓</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {stage1Description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                  Owner: <span className="font-bold text-slate-700">Formly Intake Engine</span>
                </div>
              </div>

              {/* Column 2: Verification Completed */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">STAGE 2</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      SLA: 5m (Automated)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs transition-all ${
                        isVerificationDone
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-50"
                          : isSubmittedDone
                          ? "bg-indigo-600 text-white ring-4 ring-indigo-50 animate-pulse"
                          : "bg-slate-100 text-slate-400 border border-slate-300"
                      }`}
                    >
                      {isVerificationDone ? (
                        <Check className="w-5 h-5 stroke-[3]" />
                      ) : (
                        <span className="text-xs font-bold">2</span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        VERIFICATION COMPLETED
                      </div>
                      <div
                        className={`text-[11px] font-semibold ${
                          isVerificationDone ? "text-emerald-600" : "text-indigo-600"
                        }`}
                      >
                        {isVerificationDone ? "Registry Cross-Match ✓" : "In Progress"}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {stage2Description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                  Owner: <span className="font-bold text-slate-700">Interoperability Gateway Mesh</span>
                </div>
              </div>

              {/* Column 3: Government Processing & Downstream Vertical Sub-Stages */}
              <div className="space-y-4">
                {/* Government Processing Head Card */}
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-3xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">STAGE 3</span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-full border border-blue-200">
                      SLA: 4h - 48h
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs transition-all ${
                        isDeliveredDone
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-50"
                          : isGovProcessingActive
                          ? "bg-blue-600 text-white ring-4 ring-blue-100"
                          : "bg-slate-100 text-slate-400 border border-slate-300"
                      }`}
                    >
                      {isDeliveredDone ? (
                        <Check className="w-5 h-5 stroke-[3]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-white animate-ping" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        GOVERNMENT PROCESSING
                      </div>
                      <div
                        className={`text-[11px] font-semibold ${
                          isDeliveredDone ? "text-emerald-600" : "text-blue-600 font-bold"
                        }`}
                      >
                        {isDeliveredDone ? "Fulfilled ✓" : "Active Pipeline"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-indigo-100/80 text-[11px] text-indigo-900/80">
                    Jurisdiction: <span className="font-bold text-slate-900">{stage3Jurisdiction}</span>
                  </div>
                </div>

                {/* Vertical Stem Connecting to Sub-Stages */}
                <div className="flex items-center justify-center -my-2">
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-4 bg-indigo-300" />
                    <ChevronDown className="w-4 h-4 text-indigo-500 -mt-1" />
                  </div>
                </div>

                {/* Vertical Sub-Stages Pipeline */}
                <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 relative overflow-hidden">
                  <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200 -z-0" />

                  {getSubStages().map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <div key={sub.id} className="flex items-start gap-3 relative z-10">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 transition-all ${
                            sub.isDone
                              ? "bg-emerald-500 text-white shadow-xs"
                              : sub.isCurrent
                              ? application.status === "RETURNED_FOR_CORRECTION"
                                ? "bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse"
                                : application.status === "VERIFICATION_CONFLICT"
                                ? "bg-rose-500 text-white ring-4 ring-rose-100 animate-pulse"
                                : "bg-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse"
                              : "bg-slate-100 text-slate-400 border border-slate-200"
                          }`}
                        >
                          {sub.isDone ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <SubIcon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-xs text-slate-900">{sub.title}</div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                sub.isDone
                                  ? "bg-emerald-50 text-emerald-700"
                                  : sub.isCurrent
                                  ? application.status === "RETURNED_FOR_CORRECTION"
                                    ? "bg-amber-100 text-amber-800"
                                    : application.status === "VERIFICATION_CONFLICT"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-indigo-50 text-indigo-700 font-bold"
                                  : "text-slate-400"
                              }`}
                            >
                              {sub.statusLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {sub.subtext}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* CURRENT STATUS Box matching prompt design */}
          <div className="border-t border-slate-200 bg-slate-50 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                CURRENT STATUS
              </div>
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Last updated: {formatTimestamp(application.updatedAt)}</span>
              </div>
            </div>

            <div className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {getCurrentStatusText()}
            </div>

            {/* Sub-status explanation banner */}
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-600 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-semibold">
                <span>Stage Owner:</span>
                <span className="text-slate-900 font-bold">
                  {getCurrentStageOwner()}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-semibold">
                <span>Statutory SLA:</span>
                <span className="text-indigo-700 font-bold">
                  {getCurrentSla()}
                </span>
              </span>
            </div>

            {/* Explanation / Exceptional States Banner */}
            {application.status === "RETURNED_FOR_CORRECTION" && (
              <div className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-amber-900">
                      Action Required: Officer Returned for Correction
                    </h4>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      {application.correctionReason ||
                        "Please update your address proof document with an uncropped legible copy."}
                    </p>

                    {/* Interactive Citizen Correction Form */}
                    <form onSubmit={handleResubmitCorrection} className="mt-4 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">
                          Corrected Residential Address / Clarification Note
                        </label>
                        <input
                          type="text"
                          value={correctionInput}
                          onChange={(e) => setCorrectionInput(e.target.value)}
                          placeholder="e.g. H.No 4-12/A, Flat 301, Gandhi Nagar, Gachibowli, Hyderabad - 500081"
                          className="w-full px-3.5 py-2 text-xs bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmittingCorrection}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors"
                      >
                        {isSubmittingCorrection ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Resubmit Application to Officer</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {application.status === "VERIFICATION_CONFLICT" && (
              <div className="mt-5 bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-rose-900">
                      Discrepancy Flagged for Manual Officer Review
                    </h4>
                    <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                      {isScholarship
                        ? "A discrepancy was detected between application details and external academic/income registries. Formly has placed your case with a senior Scholarship Nodal Officer for manual review. No further citizen action is required at this time."
                        : isHousing
                        ? "A property or address discrepancy was flagged during registry cross-verification. Placed with Municipal Town Planning Officer for manual review."
                        : isIncomeCert || isCasteCert
                        ? "A record discrepancy was detected in the civil supplies/revenue registry. Placed with Tahsildar for manual verification."
                        : "A discrepancy was detected between external registry databases (Application states DOB 1999-05-14 vs Aadhaar Registry 2000-05-14). Rather than making an automated assumption, Formly has placed your case with a senior CBDT officer for manual evidence review. No further citizen action is required at this time."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {application.status === "API_UNAVAILABLE" && (
              <div className="mt-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 sm:p-6 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <RefreshCw className={`w-5 h-5 ${isRetryingGateway ? "animate-spin text-blue-700" : ""}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-blue-950">
                        External Gateway Connectivity Delay (Resiliency Queue)
                      </h4>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded-full">
                        Auto-Retry Active • Zero Data Loss
                      </span>
                    </div>

                    <p className="text-xs text-blue-900/90 mt-2 leading-relaxed">
                      The external downstream verification gateway experienced a temporary timeout (504 Gateway Delay). Rather than failing or dropping your application, Seva Saarthi's fault-tolerant engine safely persisted your submission in state and has placed it in an automatic retry queue.
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-[11px] text-blue-800 font-medium">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                      <span>Automated background retry active: re-querying every 15s with exponential backoff.</span>
                    </div>

                    {/* Interactive Citizen/Evaluator Action */}
                    <div className="mt-4 pt-3 border-t border-blue-200/80 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleRetryGateway(false)}
                        disabled={isRetryingGateway}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRetryingGateway ? "animate-spin" : ""}`} />
                        <span>{isRetryingGateway ? "Reconnecting Gateway..." : "Reconnect Gateway & Verify Now"}</span>
                      </button>

                      <span className="text-[11px] text-slate-500">
                        Simulate the external gateway recovering and passing verification.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {appId === "PAN-2026-0002" && application.status !== "API_UNAVAILABLE" && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Gateway Resiliency Succeeded: External connector recovered and case routed to Officer Review.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRetryGateway(true)}
                  disabled={isRetryingGateway}
                  className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs transition-colors shrink-0 cursor-pointer"
                >
                  Reset Case to Gateway Delay
                </button>
              </div>
            )}

            {application.status === "REJECTED" && (
              <div className="mt-5 bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-rose-900">Application Rejected</h4>
                    <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                      Reason: {application.rejectionReason || (isScholarship ? "Eligibility criteria or merit quota threshold not met." : "Statutory grounds under Section 139A.")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {aiAssistance && (
              <div className="mt-6 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                  <Sparkles className="w-6 h-6 text-indigo-300/50" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-indigo-900 uppercase tracking-wide">
                    AI Application Assistant
                  </h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed mb-4 font-medium italic">
                  "{aiAssistance.explanation}"
                </p>
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Recommended Next Steps:</div>
                  <div className="grid grid-cols-1 gap-2">
                    {JSON.parse(aiAssistance.recommended_actions || "[]").map((action: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 bg-white border border-indigo-50 p-2 rounded-xl shadow-xs">
                        <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                          {idx + 1}
                        </div>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Dynamic Card / Benefit / Certificate Details Accordion */}
        {isScholarship && (
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>DBT Scholarship Sanction Record</span>
                </div>
                <div className="font-mono text-xl sm:text-2xl font-black text-white">
                  ₹25,000 / Year • Direct Benefit Transfer
                </div>
                <p className="text-xs text-slate-300 mt-2">
                  Beneficiary: <span className="font-semibold text-white">{application.applicantName}</span> • Father: {application.data?.fatherName || "Suresh Kumar"}
                </p>
                <p className="text-[11px] text-emerald-400 mt-1">
                  Disbursement Mode: NPCI Aadhaar Payment Bridge (Aadhaar Seeded Account Ending in ...9012)
                </p>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 border border-white/10 shrink-0">
                <div className="text-[10px] font-bold text-slate-300 uppercase">PFMS Sanction Token</div>
                <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                  PFMS-2026-NSP-8812
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Status: Verified & Sanctioned
                </div>
              </div>
            </div>
          </div>
        )}

        {isHousing && (
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <Home className="w-3.5 h-3.5 text-purple-400" />
                  <span>PMAY-Urban Subsidy Sanction</span>
                </div>
                <div className="font-mono text-xl sm:text-2xl font-black text-white">
                  Up to ₹2,67,000 • Interest Subsidy (EWS/LIG)
                </div>
                <p className="text-xs text-slate-300 mt-2">
                  Applicant: <span className="font-semibold text-white">{application.applicantName}</span> • ULB: Municipal Project Cell
                </p>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 border border-white/10 shrink-0">
                <div className="text-[10px] font-bold text-slate-300 uppercase">PMAY Registration ID</div>
                <div className="font-mono font-bold text-purple-400 text-sm mt-0.5">
                  {application.id}
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Channel: MoHUA CNA Portal
                </div>
              </div>
            </div>
          </div>
        )}

        {(isIncomeCert || isCasteCert) && (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <Award className="w-3.5 h-3.5 text-blue-400" />
                  <span>Digital Certificate Record</span>
                </div>
                <div className="font-mono text-xl sm:text-2xl font-black text-white">
                  {isIncomeCert ? "TS-INC-2026-3021" : "TS-CST-2026-1190"}
                </div>
                <p className="text-xs text-slate-300 mt-2">
                  Issued to: <span className="font-semibold text-white">{application.applicantName}</span> • Signed by: Tahsildar & Executive Magistrate
                </p>
                <p className="text-[11px] text-blue-300 mt-1">
                  Digital Signature: SHA-256 e-Sign Verified • Tamper Proof
                </p>
              </div>

              <Link
                href="/vault"
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-4 py-3 font-bold text-xs flex items-center gap-2 shrink-0 transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>View in Document Vault</span>
              </Link>
            </div>
          </div>
        )}

        {isPanService && application.physicalCard?.panNumber && (
          <div className="bg-gradient-to-r from-emerald-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Permanent Account Number
                </span>
                <div className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-white mt-1">
                  {application.physicalCard.panNumber}
                </div>
                <p className="text-xs text-slate-300 mt-2">
                  Issued to: <span className="font-semibold text-white">{application.applicantName}</span> • Father: {application.data.fatherName}
                </p>
              </div>

              {application.physicalCard.trackingNumber && (
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 shrink-0">
                  <div className="text-[10px] font-bold text-slate-300 uppercase">Speed Post Consignment</div>
                  <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                    {application.physicalCard.trackingNumber}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">
                    Partner: {application.physicalCard.dispatchPartner}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verification Transparency Section */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Verification & Consent Transparency</h3>
                <p className="text-[11px] text-slate-500">
                  Digital consent recorded under DPDP Act 2023 Section 6
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              Consent Valid
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Consent Purpose</div>
              <div className="text-xs font-semibold text-slate-800 mt-1">{application.consent?.purpose}</div>
              <div className="text-[10px] text-slate-500 mt-1">Token: {application.consent?.consentId}</div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Identity Checks</div>
              <div className="text-xs font-semibold text-slate-800 mt-1">
                {application.verifications.filter((v) => v.status === "VERIFIED").length} of {application.verifications.length} verified via Interoperability Hub
              </div>
              <div className="text-[10px] text-slate-500 mt-1">UIDAI Aadhaar 2.5 API • DigiLocker e-Vault</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
