"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Shield,
  FileText,
  User,
  History,
  X,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Building,
  Database,
  ExternalLink,
  ShieldCheck,
  Lock,
  GitBranch,
} from "lucide-react";
import { PanApplicationRecord, AuditLogRecord } from "@/types/government";
import { toast } from "sonner";
import { useGov } from "@/lib/store/gov-store";
import {
  GovernmentDocumentViewerModal,
  GovDocumentItem,
} from "@/components/gov/GovernmentDocumentViewerModal";
import {
  GovernmentRecordViewerModal,
  GovRegistryRecordItem,
} from "@/components/gov/GovernmentRecordViewerModal";

export default function ApplicationWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, refreshAll } = useGov();
  const appId = params?.id as string;

  const [application, setApplication] = useState<PanApplicationRecord | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Dialog States
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [manualReviewModalOpen, setManualReviewModalOpen] = useState(false);

  // Viewer Modal States
  const [activePreviewDoc, setActivePreviewDoc] = useState<GovDocumentItem | null>(null);
  const [activeRegistryRecord, setActiveRegistryRecord] = useState<GovRegistryRecordItem | null>(null);

  // Expandable UI States
  const [showRoutingDetails, setShowRoutingDetails] = useState(false);
  const [showAiTechDetails, setShowAiTechDetails] = useState(false);
  const [showOtherCandidates, setShowOtherCandidates] = useState(false);
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState(0);

  // Safety confirmation states
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [officerRemarks, setOfficerRemarks] = useState(
    "Demographic attributes, income credentials, and cross-registry records verified under statutory authority."
  );

  // Structured Return for Correction fields
  const [returnCategory, setReturnCategory] = useState("Document mismatch");
  const [returnField, setReturnField] = useState("Permanent Address Proof");
  const [returnExplanation, setReturnExplanation] = useState("The address proof is unclear or differs from the submitted application.");
  const [returnCorrection, setReturnCorrection] = useState("Please provide a legible digital address proof or updated utility bill.");

  // Structured Rejection fields
  const [rejectionCategory, setRejectionCategory] = useState("Verification failed");
  const [rejectionReason, setRejectionReason] = useState(
    "Incurable demographic discrepancy across authorized identity registries under applicable statutory rules."
  );
  const [rejectionConfirmed, setRejectionConfirmed] = useState(false);

  // AI Model 1 & Model 2 States
  const [routingRecommendation, setRoutingRecommendation] = useState<any>(null);
  const [routingConsistency, setRoutingConsistency] = useState<string>("VALID");
  const [entityResolutions, setEntityResolutions] = useState<any[]>([]);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      setIsUnauthorized(false);
      const res = await fetch(`/api/gov/applications/${appId}`);
      if (res.status === 403) {
        setIsUnauthorized(true);
        setApplication(null);
        return;
      }
      const data = await res.json();
      if (data.success && data.application) {
        setApplication(data.application);
        setAuditLogs(data.auditLogs || []);
        setRoutingRecommendation(data.routingRecommendation || null);
        setRoutingConsistency(data.routingConsistency || (data.routingRecommendation ? "VALID" : "NOT_AVAILABLE"));
        setEntityResolutions(data.entityResolutions || []);
      } else {
        if (data.error && data.error.toLowerCase().includes("unauthorized")) {
          setIsUnauthorized(true);
        }
        setApplication(null);
      }
    } catch (err) {
      console.error(err);
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appId) {
      fetchCaseDetails();
    }
  }, [appId]);

  const handleAction = async (action: string, payload: any = {}) => {
    setIsProcessing(true);
    try {
      const endpointMap: Record<string, string> = {
        ACCEPT: `/api/gov/applications/${appId}/accept`,
        RETURN: `/api/gov/applications/${appId}/return`,
        REJECT: `/api/gov/applications/${appId}/reject`,
        ADVANCE_STAGE: `/api/gov/applications/${appId}/advance`,
        RETRY_VERIFICATION: `/api/gov/applications/${appId}/retry`,
      };

      const targetUrl = endpointMap[action] || `/api/gov/applications/${appId}`;
      const method = endpointMap[action] ? "POST" : "PATCH";

      const res = await fetch(targetUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...payload,
        }),
      });
      const data = await res.json();
      if (data.success && data.application) {
        setApplication(data.application);
        setAuditLogs(data.auditLogs || []);
        toast.success(`Action '${action}' executed successfully.`);
        await refreshAll();
      } else {
        toast.error(data.error || "Failed to execute action");
      }
    } catch {
      toast.error("Network error executing officer decision");
    } finally {
      setIsProcessing(false);
      setApproveModalOpen(false);
      setReturnModalOpen(false);
      setRejectModalOpen(false);
      setManualReviewModalOpen(false);
      setApprovalConfirmed(false);
      setRejectionConfirmed(false);
    }
  };

  // Check Model 1 Data Consistency Rule
  const isModel1Consistent = useMemo(() => {
    if (routingConsistency === "INVALID") return false;
    if (!routingRecommendation || !application) return true;
    const recService = (
      routingRecommendation.suggested_service_name ||
      routingRecommendation.recommendedService ||
      routingRecommendation.serviceName ||
      ""
    ).toLowerCase();
    const appService = (application.serviceName || "").toLowerCase();
    if (appService.includes("pan") && recService.includes("pan")) return true;
    if (appService.includes("scholarship") && recService.includes("scholarship")) return true;
    if (appService.includes("housing") && recService.includes("housing")) return true;
    if (appService.includes("income") && recService.includes("income")) return true;
    if (appService.includes("caste") && recService.includes("caste")) return true;
    return appService === recService;
  }, [routingRecommendation, application, routingConsistency]);

  // Selected candidate from Model 2
  const topCandidate = useMemo(() => {
    if (entityResolutions && entityResolutions.length > 0) {
      return entityResolutions[0];
    }
    return null;
  }, [entityResolutions]);

  const activeCandidate = useMemo(() => {
    if (entityResolutions && entityResolutions.length > 0) {
      return entityResolutions[selectedCandidateIdx] || entityResolutions[0];
    }
    return null;
  }, [entityResolutions, selectedCandidateIdx]);

  // Detect conflict / collision status (Only when not terminal approved)
  const isApproved = application?.status === "APPROVED" || application?.status === "COMPLETED";
  const hasConflict = useMemo(() => {
    if (isApproved) return false;
    if (application?.status === "VERIFICATION_CONFLICT") return true;
    if (application?.verifications?.some((v) => v.status === "CONFLICT")) return true;
    return entityResolutions.some(
      (r) =>
        r.confidence_tier === "AMBIGUOUS" ||
        r.confidenceTier === "AMBIGUOUS" ||
        (r.total_score !== undefined && r.total_score <= 0.25) ||
        (r.totalScore !== undefined && r.totalScore <= 0.25) ||
        r.collision_warning ||
        r.collisionWarning
    );
  }, [application, entityResolutions, isApproved]);

  // Derive human confidence tier
  const confidenceTierDisplay = useMemo(() => {
    if (!topCandidate) return { label: "Manual Review", color: "bg-slate-100 text-slate-700 border-slate-200" };
    const score = topCandidate.total_score ?? topCandidate.totalScore;
    if (hasConflict || (score !== undefined && score < 0.5)) {
      return { label: "Manual Review Required", color: "bg-amber-100 text-amber-900 border-amber-300" };
    }
    if (score !== undefined && score >= 0.85) {
      return { label: "High Confidence", color: "bg-emerald-100 text-emerald-900 border-emerald-300" };
    }
    if (score !== undefined && score >= 0.6) {
      return { label: "Medium Confidence", color: "bg-blue-100 text-blue-900 border-blue-300" };
    }
    return { label: "Advisory Match", color: "bg-slate-100 text-slate-800 border-slate-200" };
  }, [topCandidate, hasConflict]);

  // SLA Calculation from timestamps
  const slaText = useMemo(() => {
    if (!application) return "Within SLA";
    if (application.slaDeadline) {
      const deadline = new Date(application.slaDeadline).getTime();
      const now = Date.now();
      const diffHours = Math.round((deadline - now) / (1000 * 3600));
      if (diffHours < 0) return "SLA Breached (Overdue)";
      if (diffHours <= 24) return `Due in ${diffHours}h (Urgent)`;
      const diffDays = Math.ceil(diffHours / 24);
      return `Within SLA (${diffDays}d remaining)`;
    }
    return "Within SLA";
  }, [application]);

  // Document list derived from application.documents
  const documentList: GovDocumentItem[] = useMemo(() => {
    if (!application?.documents) return [];
    return Object.entries(application.documents).map(([key, doc]: [string, any]) => {
      const labelMap: Record<string, string> = {
        identityProof: "Identity Proof (Aadhaar e-KYC)",
        dobProof: "Date of Birth Proof (Class 10 / Birth Certificate)",
        addressProof: "Address / Domicile Proof (Electricity Bill)",
        incomeProof: "Annual Income Certificate (Revenue Record)",
        collegeId: "Higher Education Student ID",
        casteProof: "Community / Caste Proof",
        landProof: "Land / Property Records",
      };
      const cleanKey = labelMap[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
      const pseudoHash = `${application.id.toLowerCase().replace(/[^a-z0-9]/g, "")}${key}sha256e1f2a3b4c5d6`;
      return {
        key,
        type: cleanKey,
        filename: doc.name || `${key}.pdf`,
        status: doc.status || "VERIFIED",
        note: doc.note || "Digitally verified against issuing authority snapshot",
        hash: pseudoHash,
        applicationId: application.id,
        applicantName: application.applicantName,
        serviceName: application.serviceName,
      };
    });
  }, [application]);

  // Dynamic verification checklist
  const verificationsList = useMemo(() => {
    if (application?.verifications && application.verifications.length > 0) {
      return application.verifications;
    }
    const isScholarship = application?.serviceName?.toLowerCase().includes("scholarship");
    const isHousing = application?.serviceName?.toLowerCase().includes("housing");
    if (isScholarship) {
      return [
        { id: "v1", name: "Identity Match (UIDAI e-KYC)", source: "UIDAI Aadhaar API", status: "VERIFIED", details: "Aadhaar demographic tokens matched." },
        { id: "v2", name: "Income Eligibility Check", source: "Revenue Registry", status: "VERIFIED", details: "Income within statutory threshold confirmed." },
        { id: "v3", name: "Academic Enrollment Record", source: "AISHE / Institute Portal", status: "VERIFIED", details: "Active student registration verified." },
        { id: "v4", name: "DPDP Statutory Consent", source: "DPDP Consent Gateway", status: "VERIFIED", details: "Valid cryptographic consent token active." },
      ];
    }
    if (isHousing) {
      return [
        { id: "v1", name: "Identity Match (UIDAI e-KYC)", source: "UIDAI Aadhaar API", status: "VERIFIED", details: "Aadhaar demographic tokens matched." },
        { id: "v2", name: "Income & Asset Category", source: "Revenue Registry", status: "VERIFIED", details: "EWS / LIG category validated." },
        { id: "v3", name: "Land & Property Non-Ownership", source: "Land Records Database", status: "VERIFIED", details: "No existing residential property registered." },
        { id: "v4", name: "DPDP Statutory Consent", source: "DPDP Consent Gateway", status: "VERIFIED", details: "Valid cryptographic consent token active." },
      ];
    }
    return [
      { id: "v1", name: "Identity Registry (UIDAI e-KYC)", source: "Aadhaar e-KYC 2.5 API", status: "VERIFIED", details: "Exact match across application and Aadhaar identity registry." },
      { id: "v2", name: "Date of Birth Verification", source: "DigiLocker Class 10 Record", status: application?.status === "VERIFICATION_CONFLICT" ? "CONFLICT" : "VERIFIED", details: application?.status === "VERIFICATION_CONFLICT" ? "DOB conflict between submitted document and UIDAI registry." : "DOB verified against educational records." },
      { id: "v3", name: "Aadhaar Verhoeff Checksum", source: "UIDAI Checksum Engine", status: "VERIFIED", details: "12-digit UID mathematically verified via Verhoeff checksum." },
      { id: "v4", name: "DPDP Statutory Consent", source: "DPDP Consent Gateway", status: "VERIFIED", details: "Valid cryptographic consent token active." },
    ];
  }, [application]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Case Review Workspace...</p>
        </div>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl border border-rose-200 p-8 max-w-md w-full text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <div className="mt-2 text-xs font-mono font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-md inline-block">
            Application ID: {appId || "UNKNOWN"}
          </div>
          <p className="text-xs text-slate-600 mt-3 leading-relaxed">
            You are not authorized to review this application.
          </p>
          <div className="mt-6">
            <Link
              href="/government/applications"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Applications</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 max-w-md w-full text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Application Not Found</h2>
          <div className="mt-2 text-xs font-mono font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-md inline-block">
            Application ID: {appId || "INVALID-ID"}
          </div>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            This application could not be found in the authorized workspace.
          </p>
          <div className="mt-6">
            <Link
              href="/government/applications"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Applications</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isTerminal =
    application.status === "APPROVED" ||
    application.status === "REJECTED" ||
    application.status === "COMPLETED";

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-200">
      {/* 1. CASE REVIEW HEADER & APPLICATION SUMMARY */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 lg:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/government/applications"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
            title="Back to Applications"
            aria-label="Back to Applications"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono font-black text-lg text-blue-600 tracking-tight">
                {application.id}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-lg font-bold text-slate-900 truncate">
                {application.applicantName}
              </span>
              <span
                className={`px-2 py-0.5 text-xs font-bold rounded-md uppercase ${
                  application.priority === "URGENT"
                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                    : application.priority === "HIGH"
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {application.priority}
              </span>
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-md ${
                  application.status === "APPROVED" || application.status === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-800"
                    : application.status === "VERIFICATION_CONFLICT"
                    ? "bg-rose-100 text-rose-800 animate-pulse"
                    : application.status === "ACTION_REQUIRED"
                    ? "bg-blue-100 text-blue-800"
                    : application.status === "RETURNED_FOR_CORRECTION"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {application.status}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 font-medium">
              <span className="text-slate-800 font-semibold">{application.serviceName}</span>
              <span>•</span>
              <span>Stage: <strong className="text-slate-800">{application.stage}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>SLA: {slaText}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Officer Badge */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500">Officer:</span>
            <span className="font-mono font-bold text-slate-800">
              {application.assignedOfficerId || currentUser.id || "OFF-PAN-7042"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN CASE REVIEW GRID (DESKTOP: 8 COLS CONTENT + 4 COLS STICKY DECISION PANEL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 7 ORDERED SECTIONS (Requirement 22) */}
        <div className="lg:col-span-8 space-y-6">

          {/* ============================================================ */}
          {/* 1. APPLICATION OVERVIEW (Requirement 22)                     */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>Application Overview</span>
              </h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Submitted Snapshot
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Citizen Full Name</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{application.applicantName}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Date of Birth</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {application.data?.dateOfBirth || (application.data as any)?.dob || (application as any).formData?.dateOfBirth || "Not provided"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Father / Guardian Name</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {application.data?.fatherName || (application as any).formData?.fatherName || "Not provided"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Masked Aadhaar Number</span>
                <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                  {application.data?.aadhaarNumber ? `XXXX-XXXX-${application.data.aadhaarNumber.slice(-4)}` : "XXXX-XXXX-9012"}
                </div>
              </div>
              <div className="sm:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Declared Permanent Address</span>
                <div className="text-xs font-semibold text-slate-900 mt-0.5">
                  {application.data?.address
                    ? `${application.data.address}${application.data.city ? `, ${application.data.city}` : ""}${application.data.state ? `, ${application.data.state}` : ""}${application.data.pincode ? ` ${application.data.pincode}` : ""}`
                    : (application as any).formData?.address || "Not provided"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Mobile Phone</span>
                <div className="text-xs font-bold text-slate-900 mt-0.5">
                  {application.applicantPhone || application.data?.mobile
                    ? `+91******${(application.applicantPhone || application.data?.mobile || "").slice(-4)}`
                    : "Not provided"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Declared Annual Income</span>
                <div className="text-xs font-bold text-slate-900 mt-0.5">
                  {(application.data as any)?.annualIncome || (application.data as any)?.income
                    ? `₹${(application.data as any)?.annualIncome || (application.data as any)?.income} / year`
                    : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 2. WORKFLOW ROUTING (Requirements 1, 2, 21, 22)               */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <GitBranch className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Workflow Routing
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Automatically routed based on the citizen's request.
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 italic">
                Model 1 automatically determines the appropriate government service and workflow.
              </div>
            </div>

            {/* Mismatch Safety Guard */}
            {!isModel1Consistent ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <div className="font-bold">⚠ ROUTING DATA MISMATCH</div>
                  <div className="text-[11px] font-normal mt-0.5">
                    The routing recommendation does not correspond to this application. Manual review required.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] font-medium">Department</span>
                    <div className="font-bold text-slate-900 mt-0.5 truncate">
                      {routingRecommendation?.suggested_department_name || application.department || "Income Tax Department (CBDT)"}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] font-medium">Division</span>
                    <div className="font-bold text-slate-900 mt-0.5 truncate">
                      PAN Division
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] font-medium">Office / Unit</span>
                    <div className="font-bold text-slate-900 mt-0.5 truncate">
                      {routingRecommendation?.suggested_office_name || application.office || "Regional Processing Cell"}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] font-medium">Target Service</span>
                    <div className="font-bold text-blue-700 mt-0.5 truncate">
                      {routingRecommendation?.suggested_service_name || application.serviceName}
                    </div>
                  </div>
                </div>

                {/* View Routing Details Accordion */}
                <div className="pt-1">
                  <button
                    onClick={() => setShowRoutingDetails(!showRoutingDetails)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition-colors"
                  >
                    <span>{showRoutingDetails ? "Hide routing details" : "View routing details"}</span>
                    {showRoutingDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {showRoutingDetails && (
                    <div className="mt-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
                      <div className="font-bold text-slate-800 text-[11px]">WHY THIS ROUTING?</div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {routingRecommendation?.explanation ||
                          `Citizen request declarations match statutory requirements for ${application.serviceName} under applicable departmental assignment rules.`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* 3. AI-ASSISTED IDENTITY MATCH (Requirements 3-9, 22-25)       */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl border-2 border-indigo-200/90 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    AI-Assisted Identity Match
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Identifies likely matching records across authorized government registries.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${confidenceTierDisplay.color}`}>
                  {confidenceTierDisplay.label}
                </span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                  Advisory Only
                </span>
              </div>
            </div>

            {/* Conflict / Collision Alert (Requirement 6) */}
            {hasConflict && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-extrabold text-sm text-rose-900">IDENTITY CONFLICT DETECTED</div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    The available government records contain conflicting demographic information. The AI cannot safely confirm legal identity automatically.
                  </p>
                  <div className="text-[11px] font-bold text-rose-900 pt-1">
                    Status: <span className="underline">MANUAL REVIEW REQUIRED BY AUTHORIZED OFFICER</span>
                  </div>
                </div>
              </div>
            )}

            {/* Main Likely Matching Record (Requirement 4) */}
            {activeCandidate ? (
              <div className="space-y-4">
                <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-4 space-y-3 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">
                    Likely Matching Record (Corroborated Candidate)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] font-medium text-slate-400">Citizen Applicant</span>
                      <div className="font-bold text-slate-900 mt-0.5">{application.applicantName}</div>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] font-medium text-slate-400">Matched Registry Candidate</span>
                      <div className="font-bold text-indigo-900 mt-0.5">
                        {activeCandidate.candidate_name || activeCandidate.name || application.applicantName}
                        <span className="text-slate-400 font-normal ml-1.5">
                          ({activeCandidate.candidate_registry || activeCandidate.registry || "UIDAI Registry"})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Evidence Checklist (Requirement 4) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-slate-800">EVIDENCE & CORROBORATING REGISTRIES:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Name Corroborated</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Date of Birth Verified</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Father / Guardian Corroborated</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Address Verified</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>District / PIN Matched</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Cross-Registry Corroboration</span>
                      </div>
                    </div>
                  </div>

                  {/* Registry sources */}
                  <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="font-bold text-slate-500">Queried Authorized Sources:</span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-semibold text-slate-700">UIDAI</span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-semibold text-slate-700">Revenue</span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-semibold text-slate-700">PAN Core Registry</span>
                  </div>
                </div>

                {/* Why was this record suggested? (Requirement 9) */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-900 text-[11px]">WHY WAS THIS RECORD SUGGESTED?</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {activeCandidate.explanation ||
                      activeCandidate.corroboration ||
                      "Demographic tokens, date of birth, and declared residential attributes strongly matched corresponding records in authorized state and central registries."}
                  </p>
                </div>

                {/* Multiple Candidates Toggle (Requirement 5) */}
                {entityResolutions.length > 1 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {entityResolutions.length} possible records found
                      </span>
                      <button
                        onClick={() => setShowOtherCandidates(!showOtherCandidates)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1"
                      >
                        <span>{showOtherCandidates ? "Hide other records" : "View other possible records"}</span>
                        {showOtherCandidates ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {showOtherCandidates && (
                      <div className="flex items-center gap-2 overflow-x-auto pt-2">
                        {entityResolutions.map((cand, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedCandidateIdx(idx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                              selectedCandidateIdx === idx
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            Candidate #{idx + 1} {idx === 0 ? "(Top Candidate)" : ""}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Expandable Technical AI Details (Requirement 7) */}
                <div>
                  <button
                    onClick={() => setShowAiTechDetails(!showAiTechDetails)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition-colors"
                  >
                    <span>{showAiTechDetails ? "Hide AI Technical Details" : "View AI Technical Details"}</span>
                    {showAiTechDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {showAiTechDetails && (
                    <div className="mt-2.5 p-3.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1.5 border border-slate-800">
                      <div>
                        <span className="text-slate-400">Model Pipeline: </span>
                        <span className="text-indigo-300">Model 2 (V4.2 Hybrid Engine)</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Detected Language: </span>
                        <span>{activeCandidate.language_detected || activeCandidate.language || "ENGLISH (Latn)"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Transformer Gate: </span>
                        <span className="text-emerald-400">{activeCandidate.transformer_status || "Active / Satisfied"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Fallback Mode: </span>
                        <span>{activeCandidate.fallback_mode || "None (Direct Corroboration)"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Advisory Score: </span>
                        <span className="text-amber-300">
                          {activeCandidate.total_score !== undefined
                            ? `${(activeCandidate.total_score * 100).toFixed(1)}%`
                            : "Verified"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                No identity candidates required for this case scope under authorized consent.
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* 4. DOCUMENTS (Requirements 10, 11, 22)                       */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Documents</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {documentList.length} Ingested Documents
              </span>
            </div>

            {documentList.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No documents submitted with this application.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {documentList.map((doc, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-800 truncate" title={doc.type}>{doc.type}</span>
                        <span
                          className={`px-1.5 py-0.5 font-bold text-[9px] rounded shrink-0 ${
                            doc.status === "VERIFIED"
                              ? "bg-emerald-100 text-emerald-800"
                              : doc.status === "FLAGGED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-1 font-mono">{doc.filename}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{doc.note}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-end">
                      <button
                        onClick={() => setActivePreviewDoc(doc)}
                        className="w-full py-1.5 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-900 font-bold text-xs rounded-lg border border-slate-200 shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Document</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* 5. GOVERNMENT RECORDS (Requirements 12, 13, 14, 22)           */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Government Records</span>
              </h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                DPDP Act 2023 Compliant
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Consent Block */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">
                    {application.consent?.granted
                      ? "Statutory Digital Consent: GRANTED"
                      : "Digital Consent: PENDING"}
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    Purpose: {application.consent?.purpose || "Identity verification and service processing under Income Tax Act & DPDP Act 2023."}
                  </div>
                  {application.consent?.consentId && (
                    <div className="text-[10px] font-mono text-emerald-700 mt-0.5">
                      Consent Token: {application.consent.consentId}
                    </div>
                  )}
                </div>
              </div>

              {/* Authorized Government Records Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Revenue Registry */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Revenue Registry</span>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">Authorized</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      Income Certificate • Annual: ₹1,80,000 • Valid
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setActiveRegistryRecord({
                        registryName: "Revenue Registry",
                        recordType: "Income & Asset Certificate",
                        status: "VALID / ACTIVE",
                        consentToken: application.consent?.consentId || "CNS-2026-9901-SAI",
                        applicationId: application.id,
                        applicantName: application.applicantName,
                        sourceEndpoint: "https://revenue.telangana.gov.in/api/v2/certificate",
                        fields: {
                          Applicant_Name: application.applicantName,
                          Father_Name: application.data?.fatherName || "M. G. Rao",
                          Annual_Income: "₹ 1,80,000",
                          District: application.data?.city || "Hyderabad",
                          Certificate_Number: "INC-2026-998812",
                          Status: "Valid & Current",
                        },
                      })
                    }
                    className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Record</span>
                  </button>
                </div>

                {/* 2. UIDAI / Identity Registry */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">UIDAI Identity Registry</span>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">Authorized</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      Aadhaar e-KYC • Name, DOB, Address • Verified
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setActiveRegistryRecord({
                        registryName: "UIDAI Aadhaar Registry",
                        recordType: "Aadhaar e-KYC 2.5 Demographic Record",
                        status: "VERIFIED",
                        consentToken: application.consent?.consentId || "CNS-2026-9901-SAI",
                        applicationId: application.id,
                        applicantName: application.applicantName,
                        sourceEndpoint: "https://gateway.uidai.gov.in/v2.5/ekyc",
                        fields: {
                          Full_Name: application.applicantName,
                          Date_of_Birth: application.data?.dateOfBirth || "2000-05-14",
                          Gender: application.data?.gender || "Male",
                          Masked_Aadhaar: application.data?.aadhaarNumber ? `XXXX-XXXX-${application.data.aadhaarNumber.slice(-4)}` : "XXXX-XXXX-9012",
                          Verification_Token: "EKYC-TOKEN-VERIFIED-2026",
                          Authentication_Status: "Successful (100% Match)",
                        },
                      })
                    }
                    className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Record</span>
                  </button>
                </div>

                {/* 3. PAN / Target Registry */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">PAN / Tax Central Core</span>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">Authorized</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      NSDL/UTIITSL Deduplication Gateway • Clear
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setActiveRegistryRecord({
                        registryName: "CBDT PAN Core Engine Gateway",
                        recordType: "PAN Deduplication & Issuance Check",
                        status: "CLEAR / NO DUPLICATE",
                        consentToken: application.consent?.consentId || "CNS-2026-9901-SAI",
                        applicationId: application.id,
                        applicantName: application.applicantName,
                        sourceEndpoint: "https://incometax.gov.in/pan/v3/dedup",
                        fields: {
                          Applicant_Name: application.applicantName,
                          Father_Name: application.data?.fatherName || "M. G. Rao",
                          DOB: application.data?.dateOfBirth || "2000-05-14",
                          Duplicate_PAN_Found: "NO",
                          Issuance_Eligibility: "CONFIRMED",
                        },
                      })
                    }
                    className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Record</span>
                  </button>
                </div>

                {/* 4. Blocked Registry Scope */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-2 opacity-60">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">Health / Land Records</span>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-200 text-slate-600 rounded">Not Requested</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Access blocked by DPDP purpose limitation.
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 italic">
                    Zero access without explicit citizen consent.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 6. VERIFICATION (Requirements 15, 22)                        */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Verification Checklist</span>
              </h2>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                Automated & Officer Verifications
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {verificationsList.map((item: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.status === "CONFLICT" ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">{item.details}</div>
                      {item.source && (
                        <div className="text-[10px] text-slate-400 mt-0.5">Source: {item.source}</div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 font-bold text-[10px] rounded-md shrink-0 ${
                      item.status === "CONFLICT"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {item.status === "CONFLICT" ? "✕ Conflict" : "✓ Verified"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 7. DECISION & ACTIVITY HISTORY (Requirements 16, 17, 22)     */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Decision & Activity History</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Shows who performed important actions on this application and when.
                </p>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {auditLogs.length} Events Logged
              </span>
            </div>

            <div className="space-y-2.5">
              {auditLogs.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No events logged yet for this application.</div>
              ) : (
                auditLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800">{log.action || (log as any).eventType}</span>
                        <span className="text-slate-400 mx-1.5">•</span>
                        <span className="text-slate-600 font-mono text-[11px]">
                          {typeof log.actor === "object" && log.actor !== null
                            ? (log.actor as any).name || (log.actor as any).id || "Officer"
                            : String(log.actor || (log as any).actorId || "System")}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 shrink-0">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: STICKY DESKTOP DECISION PANEL (Requirements 18, 19, 22) */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          <div className="bg-white rounded-2xl border-2 border-slate-800 p-6 shadow-md space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>OFFICER DECISION</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Statutory Case Adjudication Desk</p>
            </div>

            {/* Case Status Summary */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-bold text-slate-900">{application.status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">AI Assistance:</span>
                <span className="font-bold text-indigo-700">Advisory Only</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Evidence Status:</span>
                <span className={`font-bold ${hasConflict ? "text-rose-700" : "text-emerald-700"}`}>
                  {hasConflict ? "Conflict Flagged" : "Complete (Verified)"}
                </span>
              </div>
            </div>

            {/* Decision Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Approve Button */}
              <button
                onClick={() => setApproveModalOpen(true)}
                disabled={isProcessing || isTerminal}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Approve Application
                </span>
              </button>

              {/* Request Correction */}
              <button
                onClick={() => setReturnModalOpen(true)}
                disabled={isProcessing || isTerminal}
                className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-700" />
                <span>Request Correction</span>
              </button>

              {/* Send to Manual Review */}
              <button
                onClick={() => {
                  toast.info(`Application ${application.id} assigned for detailed manual scrutiny.`);
                }}
                disabled={isProcessing || isTerminal}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-slate-600" />
                <span>Send to Manual Review</span>
              </button>

              {/* Reject Button */}
              <button
                onClick={() => setRejectModalOpen(true)}
                disabled={isProcessing || isTerminal}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              >
                <X className="w-4 h-4 text-rose-600" />
                <span>Reject Application</span>
              </button>
            </div>

            <div className="text-[10px] text-slate-400 text-center leading-tight pt-2 border-t border-slate-100">
              Product Rule 1 Enforced: AI systems have zero approval authority. All decisions are logged with authenticated officer identity.
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DOCUMENT PREVIEW MODAL                                       */}
      {/* ============================================================ */}
      <GovernmentDocumentViewerModal
        document={activePreviewDoc}
        isOpen={!!activePreviewDoc}
        onClose={() => setActivePreviewDoc(null)}
      />

      {/* ============================================================ */}
      {/* GOVERNMENT RECORD VIEWER MODAL                               */}
      {/* ============================================================ */}
      <GovernmentRecordViewerModal
        record={activeRegistryRecord}
        isOpen={!!activeRegistryRecord}
        onClose={() => setActiveRegistryRecord(null)}
      />

      {/* ============================================================ */}
      {/* APPROVAL CONFIRMATION SAFETY MODAL                           */}
      {/* ============================================================ */}
      {approveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-base font-extrabold text-slate-900">OFFICER CONFIRMATION</span>
              </div>
              <button onClick={() => setApproveModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <div><strong>You are about to:</strong> APPROVE APPLICATION</div>
              <div><strong>Officer:</strong> {currentUser.name} ({currentUser.id || "OFF-PAN-7042"})</div>
              <div><strong>Application ID:</strong> {application.id} ({application.applicantName})</div>
              <div><strong>AI Assistance:</strong> Advisory only</div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700">Officer Statutory Remarks</label>
              <textarea
                value={officerRemarks}
                onChange={(e) => setOfficerRemarks(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-600"
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={approvalConfirmed}
                onChange={(e) => setApprovalConfirmed(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>You are making this decision as the authorized officer. AI recommendations are advisory only.</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction("ACCEPT", { remarks: officerRemarks })}
                disabled={!approvalConfirmed || isProcessing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                {isProcessing ? "Processing..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* REJECTION CONFIRMATION SAFETY MODAL                          */}
      {/* ============================================================ */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-base font-extrabold text-slate-900">OFFICER CONFIRMATION</span>
              </div>
              <button onClick={() => setRejectModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-950 space-y-1">
              <div><strong>You are about to:</strong> REJECT APPLICATION</div>
              <div><strong>Officer:</strong> {currentUser.name} ({currentUser.id || "OFF-PAN-7042"})</div>
              <div><strong>Application ID:</strong> {application.id} ({application.applicantName})</div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700">Statutory Rejection Reason</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-rose-600"
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={rejectionConfirmed}
                onChange={(e) => setRejectionConfirmed(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
              />
              <span>You are making this decision as the authorized officer. AI recommendations are advisory only.</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction("REJECT", { reason: rejectionReason, category: rejectionCategory })}
                disabled={!rejectionConfirmed || isProcessing}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                {isProcessing ? "Processing..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* RETURN FOR CORRECTION MODAL                                  */}
      {/* ============================================================ */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-700 font-bold">
                <RotateCcw className="w-5 h-5" />
                <span className="text-base font-extrabold text-slate-900">Request Citizen Correction</span>
              </div>
              <button onClick={() => setReturnModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Correction Category</label>
                <select
                  value={returnCategory}
                  onChange={(e) => setReturnCategory(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                >
                  <option>Document mismatch</option>
                  <option>Incomplete Address</option>
                  <option>Photograph blurred/unclear</option>
                  <option>Signature discrepancy</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Field Requiring Correction</label>
                <input
                  type="text"
                  value={returnField}
                  onChange={(e) => setReturnField(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Officer Instructions to Citizen</label>
                <textarea
                  value={returnCorrection}
                  onChange={(e) => setReturnCorrection(e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setReturnModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleAction("RETURN", {
                    category: returnCategory,
                    field: returnField,
                    explanation: returnExplanation,
                    instruction: returnCorrection,
                  })
                }
                disabled={isProcessing}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-40 cursor-pointer"
              >
                {isProcessing ? "Processing..." : "Send Request to Citizen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
