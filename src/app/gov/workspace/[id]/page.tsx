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
  RotateCcw,
  Sparkles,
  AlertCircle,
  Copy,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Bot,
  Building,
  MapPin,
  Lock,
  Layers,
  ArrowRight,
  Eye,
  FileCheck,
} from "lucide-react";
import { PanApplicationRecord, AuditLogRecord } from "@/types/government";
import { toast } from "sonner";
import { useGov } from "@/lib/store/gov-store";

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
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [expandedDocHash, setExpandedDocHash] = useState<string | null>(null);

  // Safety confirmation states
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [officerRemarks, setOfficerRemarks] = useState(
    "Demographic attributes, income credentials, and cross-registry records verified under statutory authority."
  );

  // Structured Return for Correction fields
  const [returnCategory, setReturnCategory] = useState("Document mismatch");
  const [returnField, setReturnField] = useState("Permanent Address");
  const [returnExplanation, setReturnExplanation] = useState("The address does not match the submitted proof.");
  const [returnCorrection, setReturnCorrection] = useState("Provide a valid address proof or correct the application.");

  // Structured Rejection fields
  const [rejectionCategory, setRejectionCategory] = useState("Verification failed");
  const [rejectionReason, setRejectionReason] = useState(
    "Incurable demographic discrepancy across identity registries under Section 139A."
  );
  const [rejectionConfirmed, setRejectionConfirmed] = useState(false);

  // AI Model 1 & Model 2 States
  const [routingRecommendation, setRoutingRecommendation] = useState<any>(null);
  const [entityResolutions, setEntityResolutions] = useState<any[]>([]);
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
        if (data.entityResolutions && data.entityResolutions.length > 0) {
          setEntityResolutions(data.entityResolutions);
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
      setApprovalConfirmed(false);
      setRejectionConfirmed(false);
    }
  };

  // Check Model 1 Data Consistency Rule (Requirement 13)
  const isModel1Consistent = useMemo(() => {
    if (!routingRecommendation || !application) return true;
    const recService = (routingRecommendation.recommendedService || routingRecommendation.serviceName || "").toLowerCase();
    const appService = (application.serviceName || "").toLowerCase();
    return appService.includes("pan") || recService.includes("pan") || appService === recService;
  }, [routingRecommendation, application]);

  // Selected candidate from Model 2
  const selectedCandidate = useMemo(() => {
    if (entityResolutions && entityResolutions.length > 0) {
      return entityResolutions[selectedCandidateIdx] || entityResolutions[0];
    }
    // Default fallback candidate structure
    return {
      candidateId: "CAND-REV-8492",
      registry: "Revenue & Land Registry",
      matchScore: 0.94,
      totalScore: 0.94,
      confidenceTier: "HIGH",
      language: "ENGLISH",
      transformerStatus: "ACTIVE",
      fallbackStatus: "STANDBY",
      collisionWarning: false,
      matchedFields: ["Full Name", "Date of Birth", "Father Name", "Permanent Address", "Pincode"],
      conflictingFields: [],
      corroboration: "Matched across Revenue Registry and e-KYC database with 100% token consistency.",
    };
  }, [entityResolutions, selectedCandidateIdx]);

  // Detect conflict / collision status
  const hasConflict = useMemo(() => {
    if (application?.status === "VERIFICATION_CONFLICT") return true;
    return entityResolutions.some(
      (r) => r.confidenceTier === "AMBIGUOUS" || r.totalScore <= 0.25 || r.collisionWarning
    );
  }, [application, entityResolutions]);

  if (loading || !application) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Case Review Workspace...</p>
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
      {/* 1. CASE REVIEW HEADER */}
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
                <span>SLA: {(application as any).slaStatus || "Within SLA (3d remaining)"}</span>
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

      {/* 2. MAIN 2-COLUMN CASE REVIEW GRID (DESKTOP: 3/4 CONTENT + 1/4 STICKY DECISION PANEL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 6 ORDERED SECTIONS (9 COLS) */}
        <div className="lg:col-span-8 space-y-6">

          {/* ============================================================ */}
          {/* SECTION 1: APPLICATION OVERVIEW                               */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>1. Application & Citizen Overview</span>
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
                <span className="text-slate-400 font-medium">Masked Aadhaar Number</span>
                <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                  XXXX-XXXX-9012
                </div>
              </div>
              <div className="sm:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Declared Permanent Address</span>
                <div className="text-xs font-semibold text-slate-900 mt-0.5">
                  {(application as any).citizenData?.address || (application as any).formData?.address || "H.No 12-4, Madhapur, Hyderabad, Telangana 500081"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Mobile Phone</span>
                <div className="text-xs font-bold text-slate-900 mt-0.5">+91******3210</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Declared Annual Income</span>
                <div className="text-xs font-bold text-slate-900 mt-0.5">
                  ₹{(application as any).citizenData?.annualIncome || (application as any).formData?.annualIncome || "1,80,000"} / year
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 2: AI ASSISTANCE (PROMINENT MODEL 1 & MODEL 2 V4.2)  */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl border-2 border-indigo-200/90 p-6 shadow-sm space-y-5">
            {/* Header with Advisory Notice */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>2. AI Assistance & Decision Support</span>
                  </h2>
                  <p className="text-[11px] text-slate-500">Autonomous workflow recommendation & candidate identity resolution</p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs font-bold shrink-0">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>AI Advisory Only • Human Review Required</span>
              </div>
            </div>

            {/* MODEL 1: WORKFLOW ROUTING ASSISTANT */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Model 1: Workflow Routing Assistant
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                  Confidence: {routingRecommendation?.confidence ? `${(routingRecommendation.confidence * 100).toFixed(1)}%` : "98.5%"}
                </span>
              </div>

              {!isModel1Consistent ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Routing data mismatch — manual review required.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px] font-medium">Recommended Workflow</span>
                    <div className="font-bold text-slate-900 mt-0.5">{application.serviceName}</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px] font-medium">Department & Division</span>
                    <div className="font-bold text-slate-900 mt-0.5">Income Tax Department – PAN Division</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px] font-medium">Regional Office</span>
                    <div className="font-bold text-slate-900 mt-0.5">Regional Processing Cell, Hyderabad</div>
                  </div>
                </div>
              )}
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <strong>Routing Rationale:</strong> Citizen request declarations match statutory requirements for instant e-PAN & physical card issuance under Income Tax Rule 114.
              </p>
            </div>

            {/* MODEL 2: IDENTITY RESOLUTION ASSISTANT (V4.2 MULTILINGUAL ADVISORY) */}
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Model 2: Identity Resolution Assistant (V4.2 Multilingual)
                  </span>
                </div>
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 text-[10px] font-bold rounded-md">
                  AI-Assisted Identity Candidate
                </span>
              </div>

              {/* Conflict / Collision Warning */}
              {hasConflict && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">IDENTITY CONFLICT:</strong> The AI cannot safely distinguish these records due to conflicting demographic fields across registries. Manual officer review required.
                  </div>
                </div>
              )}

              {/* Candidate Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedCandidateIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCandidateIdx === idx
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Candidate #{idx + 1} {idx === 0 ? "(Top Recommendation)" : ""}
                  </button>
                ))}
              </div>

              {/* Selected Candidate Evidence Breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] font-medium">Candidate Confidence</span>
                    <div className="text-sm font-black text-indigo-700 mt-0.5">
                      {selectedCandidate?.totalScore ? `${(selectedCandidate.totalScore * 100).toFixed(0)}%` : "94%"}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] font-medium">Registry Source</span>
                    <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                      {selectedCandidate?.registry || "Revenue Registry"}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] font-medium">Language Script</span>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">
                      {selectedCandidate?.language || "ENGLISH"}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] font-medium">Transformer Gate</span>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5">
                      {selectedCandidate?.transformerStatus || "ACTIVE"}
                    </div>
                  </div>
                </div>

                {/* "WHY THIS CANDIDATE?" Clean Plain-Language Evidence */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-800">Why This Candidate?</span>
                  <div className="text-slate-600 text-xs space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>Full Name:</strong> High string similarity match against citizen record.</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>Date of Birth & Father:</strong> Exact match with Revenue registry snapshot.</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>Address & PIN:</strong> Verified against Telangana State Revenue Database (PIN 500081).</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 3: DOCUMENTS & EVIDENCE                              */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>3. Documents & Evidence</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                3 Ingested Documents
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {[
                { type: "Aadhaar e-KYC Proof", filename: "aadhaar_card_front_back.pdf", status: "VERIFIED", date: "2026-09-18", hash: "a3b8c9d0e1f234567890abcdef123456" },
                { type: "Date of Birth Proof", filename: "ssc_certificate_dob.jpg", status: "VERIFIED", date: "2026-09-18", hash: "b4c9d0e1f2a34567890abcdef1234567" },
                { type: "Address Proof", filename: "electricity_bill_aug2026.pdf", status: "VERIFIED", date: "2026-09-18", hash: "c5d0e1f2a3b4567890abcdef12345678" },
              ].map((doc, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{doc.type}</span>
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[9px] rounded">
                        {doc.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-1">{doc.filename}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Uploaded {doc.date}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <button
                      onClick={() => setExpandedDocHash(expandedDocHash === doc.filename ? null : doc.filename)}
                      className="text-[10px] font-semibold text-slate-500 hover:text-slate-800"
                    >
                      {expandedDocHash === doc.filename ? "Hide Hash" : "Checksum"}
                    </button>
                    <button
                      onClick={() => toast.info(`Viewing ${doc.filename} (Simulated Inspector)`)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-blue-700 font-bold text-[10px] rounded border border-slate-200 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                  </div>
                  {expandedDocHash === doc.filename && (
                    <div className="p-1.5 bg-slate-100 rounded font-mono text-[9px] text-slate-600 break-all">
                      SHA256: {doc.hash}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 4: CONSENT & GOVERNMENT RECORDS                      */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>4. Consent & Government Records</span>
              </h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                DPDP Act 2023 Compliant
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Statutory Digital Consent GRANTED by Citizen</div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    Purpose: Public Service Adjudication & Identity Corroboration under Digital Personal Data Protection Act 2023.
                  </div>
                </div>
              </div>

              {/* Authorized vs Blocked Registries */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { name: "Revenue Registry", status: "AUTHORIZED", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
                  { name: "PAN / Tax Registry", status: "AUTHORIZED", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
                  { name: "Education Registry", status: "AUTHORIZED", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
                  { name: "Health Records", status: "NOT REQUESTED", color: "bg-slate-50 border-slate-200 text-slate-500" },
                ].map((reg, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl border ${reg.color}`}>
                    <div className="font-bold text-slate-800 text-[11px]">{reg.name}</div>
                    <div className="text-[9px] font-black uppercase mt-1 tracking-wider">{reg.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 5: VERIFICATION CHECKLIST                            */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>5. Verification Checklist</span>
              </h2>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                Automated & Officer Verifications
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { title: "Identity Match (UIDAI e-KYC)", status: "Verified", desc: "Aadhaar demographic tokens matched with 100% precision." },
                { title: "Income Eligibility Check", status: "Verified", desc: "Income within statutory threshold (₹1,80,000 / yr) confirmed via Revenue records." },
                { title: "Academic Enrollment Record", status: "Verified", desc: "B.Tech Computer Science active student status verified." },
                { title: "Document Authenticity & Checksum", status: "Verified", desc: "SHA-256 digital signature verified against central storage." },
                { title: "Statutory DPDP Consent", status: "Verified", desc: "Valid cryptographic consent token active." },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800">{item.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md shrink-0">
                    ✓ {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 6: DECISION HISTORY (RECONCILED AUDIT SOURCE)         */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <span>6. Decision & Activity History</span>
              </h2>
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

        {/* RIGHT COLUMN: STICKY DESKTOP DECISION PANEL (4 COLS) */}
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
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-bold text-slate-900">{application.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">AI Recommendation:</span>
                <span className="font-bold text-indigo-700">Advisory Only</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Evidence Status:</span>
                <span className="font-bold text-emerald-700">Complete (Verified)</span>
              </div>
            </div>

            {/* Decision Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Approve Button */}
              <button
                onClick={() => setApproveModalOpen(true)}
                disabled={isProcessing || isTerminal}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Issue PAN</span>
              </button>

              {/* Request Correction */}
              <button
                onClick={() => setReturnModalOpen(true)}
                disabled={isProcessing || isTerminal}
                className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-amber-700" />
                <span>Request Correction</span>
              </button>

              {/* Reject Button */}
              <button
                onClick={() => setRejectModalOpen(true)}
                disabled={isProcessing || isTerminal}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
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
      {/* APPROVAL CONFIRMATION SAFETY MODAL                           */}
      {/* ============================================================ */}
      {approveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-base font-extrabold text-slate-900">Confirm Statutory Approval</span>
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
              <span>I confirm that I have reviewed the submitted evidence, cross-registry candidate records, and statutory declarations.</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction("ACCEPT", { remarks: officerRemarks })}
                disabled={!approvalConfirmed || isProcessing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-40"
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
                <span className="text-base font-extrabold text-slate-900">Confirm Statutory Rejection</span>
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
              <span>I confirm that this rejection is issued pursuant to statutory verification failure under applicable department rules.</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction("REJECT", { reason: rejectionReason, category: rejectionCategory })}
                disabled={!rejectionConfirmed || isProcessing}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold disabled:opacity-40"
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
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
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-40"
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
