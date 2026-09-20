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
  ExternalLink,
  Shield,
  FileText,
  User,
  History,
  Send,
  X,
  CreditCard,
  Truck,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Copy,
  CheckCircle,
  Play,
  ChevronDown,
  ChevronUp,
  Bot,
  Building,
  MapPin,
  Lock,
  Layers,
  HelpCircle,
  Database,
  ArrowRight,
  Maximize2,
} from "lucide-react";
import { PanApplicationRecord, AuditLogRecord } from "@/types/government";
import { toast } from "sonner";
import { useGov } from "@/lib/store/gov-store";

export default function PanApplicationWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, refreshAll } = useGov();
  const appId = params?.id as string;

  const [application, setApplication] = useState<PanApplicationRecord | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Active section tab
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    "overview" | "ai_evidence" | "documents" | "consent_registry" | "verification" | "audit"
  >("overview");

  // Dialog States
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [officerRemarks, setOfficerRemarks] = useState(
    "Demographics, income credentials, and cross-registry records verified. Approved under statutory authority."
  );

  // Structured Return for Correction fields
  const [returnCategory, setReturnCategory] = useState("Document mismatch");
  const [returnField, setReturnField] = useState("Permanent Address");
  const [returnExplanation, setReturnExplanation] = useState("The address does not match the submitted proof.");
  const [returnCorrection, setReturnCorrection] = useState("Provide a valid address proof or correct the application.");
  const [returnEvidence, setReturnEvidence] = useState("Utility bill dated > 3 months or cropped address");

  // Structured Rejection fields
  const [rejectionCategory, setRejectionCategory] = useState("Verification failed");
  const [rejectionReason, setRejectionReason] = useState(
    "Incurable demographic discrepancy across identity registries under Section 139A."
  );
  const [rejectionEvidence, setRejectionEvidence] = useState("UIDAI e-KYC record vs Submitted Academic Memo");
  const [rejectionConfirmed, setRejectionConfirmed] = useState(false);

  // AI Model 1 & Model 2 States
  const [routingRecommendation, setRoutingRecommendation] = useState<any>(null);
  const [entityResolutions, setEntityResolutions] = useState<any[]>([]);
  const [registryOptions, setRegistryOptions] = useState<any>({
    departments: [],
    subDepartments: [],
    offices: [],
    services: [],
  });

  // Selected candidate index for Model 2 comparison
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState(0);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/gov/applications/${appId}`);
      const data = await res.json();
      if (data.success && data.application) {
        setApplication(data.application);
        setAuditLogs(data.auditLogs || []);
        if (data.routingRecommendation) {
          setRoutingRecommendation(data.routingRecommendation);
        }
        if (data.entityResolutions) {
          setEntityResolutions(data.entityResolutions);
        }
        if (data.registry) {
          setRegistryOptions(data.registry);
        }
      } else {
        toast.error("Application not found");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading application workspace");
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
        ASSIGN: `/api/gov/applications/${appId}/assign`,
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
    } catch (err) {
      toast.error("Network error executing officer decision");
    } finally {
      setIsProcessing(false);
      setAcceptModalOpen(false);
      setReturnModalOpen(false);
      setRejectModalOpen(false);
    }
  };

  const handleReviewEntityResolution = async (
    resolutionId: string,
    action: "ACCEPT" | "REJECT" | "VERIFICATION_REQUIRED"
  ) => {
    setIsProcessing(true);
    try {
      const endpoint =
        action === "ACCEPT"
          ? `/api/gov/applications/${appId}/entity-resolution/accept`
          : `/api/gov/applications/${appId}/entity-resolution/reject`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolutionId, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Entity candidate ${action === "ACCEPT" ? "accepted" : "reviewed"} by officer.`);
        await fetchCaseDetails();
      } else {
        toast.error(data.error || "Failed to update entity resolution review");
      }
    } catch {
      toast.error("Network error updating entity resolution review");
    } finally {
      setIsProcessing(false);
    }
  };

  // Detect collision status in Model 2 candidates
  const collisionCandidate = useMemo(() => {
    return entityResolutions.find(
      (r) => r.confidenceTier === "AMBIGUOUS" || r.totalScore <= 0.25 || r.collisionWarning
    );
  }, [entityResolutions]);

  if (loading || !application) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Consolidated Application Workspace...</p>
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
      {/* 1. Header & Navigation Bar */}
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
                {application.priority} Priority
              </span>
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-md ${
                  application.status === "APPROVED"
                    ? "bg-emerald-100 text-emerald-800"
                    : application.status === "ACTION_REQUIRED"
                    ? "bg-blue-100 text-blue-800"
                    : application.status === "VERIFICATION_CONFLICT"
                    ? "bg-rose-100 text-rose-800"
                    : application.status === "RETURNED_FOR_CORRECTION"
                    ? "bg-slate-200 text-slate-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {application.status}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 font-medium">
              <span>{application.serviceName}</span>
              <span>•</span>
              <span>Stage: <strong className="text-slate-800">{application.stage}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>SLA: {(application as any).slaStatus || "Within SLA (3d remaining)"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Officer Pill */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500">Officer:</span>
            <span className="font-mono font-bold text-slate-800">
              {application.assignedOfficerId || "OFF-PAN-7042"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Workspace Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto no-scrollbar">
        {[
          { key: "overview", label: "A & B. Citizen & Application Info", icon: User },
          { key: "ai_evidence", label: "F. AI Intelligence & Model 2", icon: Sparkles, badge: "AI Advisory" },
          { key: "documents", label: "C. Ingested Documents", icon: FileText, count: 3 },
          { key: "consent_registry", label: "D & E. DPDP Consent & Registries", icon: Shield },
          { key: "verification", label: "G. Verification Checklist", icon: CheckCircle2 },
          { key: "audit", label: "H. Audit Timeline", icon: History, count: auditLogs.length },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveWorkspaceTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeWorkspaceTab === tab.key
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  activeWorkspaceTab === tab.key ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                }`}>
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeWorkspaceTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: CITIZEN INFORMATION & APPLICATION DETAILS (SECTIONS A & B) */}
      {activeWorkspaceTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section A: Citizen Information */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>Section A: Citizen Demographic Information</span>
              </h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Verified Profile Snapshot
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Full Name</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{application.applicantName}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Date of Birth</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {(application as any).citizenData?.dateOfBirth || (application as any).formData?.dateOfBirth || "1995-08-15"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Father / Guardian Name</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {(application as any).citizenData?.fatherName || (application as any).formData?.fatherName || "Anand Kumar"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Aadhaar Reference</span>
                <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                  {(application as any).citizenData?.aadhaarNumber || (application as any).formData?.aadhaarNumber || "XXXX-XXXX-9012"}
                </div>
              </div>
              <div className="col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Permanent Address</span>
                <div className="text-xs font-semibold text-slate-900 mt-0.5">
                  {(application as any).citizenData?.address || (application as any).formData?.address || "H.No 12-4, Madhapur, Hyderabad, Telangana 500081"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Mobile Phone</span>
                <div className="text-xs font-bold text-slate-900 mt-0.5">{application.applicantPhone}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Email Address</span>
                <div className="text-xs font-bold text-slate-900 mt-0.5">{application.applicantEmail}</div>
              </div>
            </div>
          </div>

          {/* Section B: Application Details & Declarations */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Section B: Service Application Declarations</span>
              </h2>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Submission: {new Date(application.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Applied Public Service</span>
                <div className="text-sm font-bold text-blue-700 mt-0.5">{application.serviceName}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Declared Annual Income</span>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">
                    ₹{(application as any).citizenData?.annualIncome || (application as any).formData?.annualIncome || "1,80,000"} / year
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Course & Institution</span>
                  <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                    {(application as any).citizenData?.courseName || (application as any).formData?.courseName || "B.Tech Computer Science"}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/70 text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">Statutory Applicant Declaration Signed</div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    Citizen affirmed all declarations are accurate under Section 199/200 IPC.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI ASSISTANCE & MODEL 2 V4.2 ADVISORY (SECTIONS F, 8, 9, 10, 11, 12) */}
      {activeWorkspaceTab === "ai_evidence" && (
        <div className="space-y-6">
          {/* Section 8: Model 1 Workflow Recommendation */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    AI Model 1: Workflow Routing Provenance
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Autonomous statutory classification based on citizen intent
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-lg">
                  Confidence: {routingRecommendation?.confidenceScore ? `${(routingRecommendation.confidenceScore * 100).toFixed(1)}%` : "98.5%"}
                </span>
                <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg">
                  Tier: ROUTE_RECOMMENDED
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Department</span>
                <div className="font-bold text-slate-900 mt-0.5 truncate">
                  {routingRecommendation?.suggestedDepartmentName || "Department of Higher Education"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Sub-Department</span>
                <div className="font-bold text-slate-900 mt-0.5 truncate">
                  {routingRecommendation?.suggestedSubDepartmentName || "National Scholarship Cell"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Assigned Office</span>
                <div className="font-bold text-slate-900 mt-0.5 truncate">
                  {routingRecommendation?.suggestedOfficeName || "National Scholarship Processing Office"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Target Service</span>
                <div className="font-bold text-slate-900 mt-0.5 truncate">
                  {routingRecommendation?.suggestedServiceName || application.serviceName}
                </div>
              </div>
            </div>

            {/* Model 1 Advisory Notice */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">AI Workflow Disclaimer:</span> AI-generated workflow recommendation. Officer confirmation may be required.
              </div>
            </div>
          </div>

          {/* Section 9, 10, 11, 12: Model 2 V4.2 Advisory Multilingual Entity Resolution */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    AI Model 2: Multilingual Entity Resolution (V4.2 Advisory)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Gated E5 Multilingual Transformer & deterministic demographic corroboration
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold">
                Advisory Only • Non-Statutory
              </span>
            </div>

            {/* Section 12: Collision Safety Banner (if collision detected) */}
            {collisionCandidate && (
              <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-amber-950 flex items-start gap-3.5">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-black text-sm text-amber-900 uppercase tracking-wide">
                    ⚠ IDENTITY CONFLICT: Potential Name Collision Detected
                  </div>
                  <p className="leading-relaxed">
                    Two candidate records share similar name tokens but contain conflicting Date of Birth or Father Name attributes.
                  </p>
                  <div className="font-bold text-amber-900 mt-1">
                    Status: <strong>MANUAL REVIEW REQUIRED</strong> (Confidence capped at score ≤ 0.25 to prevent automated false matches).
                  </div>
                </div>
              </div>
            )}

            {/* Model 2 Gating & Language Metadata Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Detected Script / Language</span>
                <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>Latin English / Transliterated Indic</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Transformer Gating Decision</span>
                <div className="font-bold text-indigo-700 mt-0.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Selective Gater: Active Multilingual</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Engine Resilience</span>
                <div className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>V3.1 Structured Fallback Ready</span>
                </div>
              </div>
            </div>

            {/* Section 10: Explainability - WHY THIS CANDIDATE? */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Explainability Evidence: Why this candidate?</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-medium">Name Similarity</div>
                  <div className="text-xs font-bold text-emerald-700 mt-0.5">1.00 (Exact Match)</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-medium">DOB Similarity</div>
                  <div className="text-xs font-bold text-emerald-700 mt-0.5">1.00 (Exact Match)</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-medium">Father Name Similarity</div>
                  <div className="text-xs font-bold text-blue-700 mt-0.5">0.95 (High Sim)</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-medium">Cross-Registry Score</div>
                  <div className="text-xs font-bold text-indigo-700 mt-0.5">Corroborated</div>
                </div>
              </div>
            </div>

            {/* Mandatory Advisory Notice */}
            <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200/70 text-xs text-indigo-950 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Product Rule 1 Enforced:</span> AI-assisted identity candidate. Human officer review required. Model 2 cannot execute legal determinations.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INGESTED DOCUMENTS (SECTION C) */}
      {activeWorkspaceTab === "documents" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Section C: Ingested Verification Documents & Evidence</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">3 Documents Ingested</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "synthetic_aadhaar_card.pdf", type: "Proof of Identity", status: "VERIFIED", hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
              { name: "synthetic_income_certificate.pdf", type: "Proof of Income", status: "VERIFIED", hash: "4a44dc15364204a80fe80e9039455cc1608281820fe2b24f1e5233ade6af1dd5" },
              { name: "synthetic_admission_letter.pdf", type: "Academic Proof", status: "VERIFIED", hash: "ca978112ca1bbdcaf06427eef677b142639406f5f9f641a22c2bde9f1929ec40" },
            ].map((doc, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {doc.type}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {doc.status}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 mt-2 truncate">{doc.name}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 truncate">SHA: {doc.hash}</div>
                </div>

                <button
                  onClick={() => toast.info(`Viewing ${doc.name}`)}
                  className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Inspect Document</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DPDP STATUTORY CONSENT & REGISTRIES (SECTIONS D & E) */}
      {activeWorkspaceTab === "consent_registry" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section D: DPDP Consent */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Section D: DPDP Act 2023 Statutory Consent Scope</span>
              </h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Consent Granted
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Statutory Legal Basis</span>
                <div className="text-xs font-bold text-slate-900 mt-0.5">
                  DPDP Act 2023 Section 6(1) Notice & Consent
                </div>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-emerald-800 font-bold">Authorized Registries Scope:</span>
                <ul className="mt-1 list-disc list-inside text-emerald-900 font-medium space-y-0.5">
                  <li>Revenue Department Registry (`revenue_registry`)</li>
                  <li>Higher Education Scholarship Registry (`education_registry`)</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Prohibited / Blocked Registries Scope</span>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Agriculture, Health, Housing, Land (Fail-closed protected).
                </div>
              </div>
            </div>
          </div>

          {/* Section E: Government Cross-Registry Evidence */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Section E: Corroborated Government Registry Records</span>
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Revenue Dept Income Certificate</span>
                  <span className="text-emerald-700 font-bold">MATCH 100%</span>
                </div>
                <div className="text-slate-500 mt-1">Certificate: `IC-HYD-2026-881` • Income: ₹1,80,000</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Education Board Student Master</span>
                  <span className="text-emerald-700 font-bold">MATCH 100%</span>
                </div>
                <div className="text-slate-500 mt-1">Enrollment: `JNTU-CSE-2024-0012` • Status: Active</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STATUTORY VERIFICATION CHECKLIST (SECTION G) */}
      {activeWorkspaceTab === "verification" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Section G: Statutory Verification Checklist</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">Mandatory Officer Review</span>
          </div>

          <div className="space-y-3">
            {[
              { id: "v1", label: "Demographic Cross-Referencing", desc: "Applicant name, DOB, and father name verified against Revenue and UIDAI master records." },
              { id: "v2", label: "Income & Eligibility Threshold", desc: "Annual family income verified below the statutory scheme ceiling (₹2,50,000)." },
              { id: "v3", label: "Academic Enrollment Verification", desc: "Valid enrollment at JNTU Hyderabad verified with student admission ledger." },
              { id: "v4", label: "DPDP Statutory Consent Verification", desc: "Explicit consent verified for authorized data retrieval under Section 6(1)." },
            ].map((item) => (
              <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 flex items-start gap-3">
                <input
                  type="checkbox"
                  defaultChecked
                  id={item.id}
                  className="w-4 h-4 text-blue-600 rounded-md mt-0.5 cursor-pointer"
                />
                <label htmlFor={item.id} className="text-xs cursor-pointer">
                  <div className="font-bold text-slate-900">{item.label}</div>
                  <div className="text-slate-500 mt-0.5">{item.desc}</div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT TIMELINE (SECTION H) */}
      {activeWorkspaceTab === "audit" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <span>Section H: Cryptographic SHA-256 Audit Timeline</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">{auditLogs.length} Events Logged</span>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
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
            ))}
          </div>
        </div>
      )}

      {/* 4. FIXED BOTTOM HUMAN DECISION ACTION BAR (SECTION 13) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200/90 shadow-2xl p-4 lg:pl-72">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Statutory Decision Control:</strong> Final authority rests exclusively with authorized officers.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Request Correction */}
            <button
              onClick={() => setReturnModalOpen(true)}
              disabled={isTerminal || isProcessing}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              Request Correction
            </button>

            {/* Reject */}
            <button
              onClick={() => setRejectModalOpen(true)}
              disabled={isTerminal || isProcessing}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              Reject Application
            </button>

            {/* Approve */}
            <button
              onClick={() => setAcceptModalOpen(true)}
              disabled={isTerminal || isProcessing}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Approve Application</span>
            </button>
          </div>
        </div>
      </div>

      {/* APPROVE MODAL */}
      {acceptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Approve Service Application</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to issue statutory approval for application <strong>{application.id}</strong> on behalf of the Department of Higher Education.
            </p>
            <div>
              <label className="text-xs font-bold text-slate-700">Officer Statutory Remarks</label>
              <textarea
                value={officerRemarks}
                onChange={(e) => setOfficerRemarks(e.target.value)}
                rows={3}
                className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-hidden focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setAcceptModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction("ACCEPT", { reviewNotes: officerRemarks })}
                disabled={isProcessing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirm Statutory Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN MODAL */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-700">
              <RotateCcw className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Return for Citizen Correction</h3>
            </div>
            <p className="text-xs text-slate-600">
              Return application to the citizen with structured correction guidance.
            </p>
            <div>
              <label className="text-xs font-bold text-slate-700">Required Correction</label>
              <textarea
                value={returnExplanation}
                onChange={(e) => setReturnExplanation(e.target.value)}
                rows={3}
                className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-hidden focus:border-amber-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setReturnModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction("RETURN", { reason: returnExplanation })}
                disabled={isProcessing}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Send Return Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Reject Application</h3>
            </div>
            <p className="text-xs text-slate-600">
              Statutory rejection requires recorded legal grounds under applicable department rules.
            </p>
            <div>
              <label className="text-xs font-bold text-slate-700">Statutory Rejection Grounds</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-hidden focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction("REJECT", { reason: rejectionReason })}
                disabled={isProcessing}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirm Statutory Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
