"use client";

import React, { useEffect, useState } from "react";
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

  // Dialog States
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [officerRemarks, setOfficerRemarks] = useState("All required credentials and source registries verified. Approved for PAN issuance.");

  // Structured Return for Correction fields (Section 16)
  const [returnCategory, setReturnCategory] = useState("Document mismatch");
  const [returnField, setReturnField] = useState("Permanent Address");
  const [returnExplanation, setReturnExplanation] = useState("The address does not match the submitted proof.");
  const [returnCorrection, setReturnCorrection] = useState("Provide a valid address proof or correct the application.");
  const [returnEvidence, setReturnEvidence] = useState("TSSPDCL utility bill dated > 3 months or cropped address");

  // Structured Rejection fields (Section 17)
  const [rejectionCategory, setRejectionCategory] = useState("Verification failed");
  const [rejectionReason, setRejectionReason] = useState("Incurable demographic discrepancy across identity registries under Section 139A.");
  const [rejectionEvidence, setRejectionEvidence] = useState("UIDAI e-KYC record vs Submitted CBSE Matriculation Memo");
  const [rejectionConfirmed, setRejectionConfirmed] = useState(false);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/gov/applications/${appId}`);
      const data = await res.json();
      if (data.success && data.application) {
        setApplication(data.application);
        setAuditLogs(data.auditLogs || []);
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

  if (loading || !application) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Consolidated Application Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Workspace Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/applications"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Back to queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-black text-lg sm:text-xl text-slate-900">
                {application.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  application.status === "ACTION_REQUIRED"
                    ? "bg-rose-100 text-rose-800"
                    : application.status === "VERIFICATION_CONFLICT"
                    ? "bg-rose-100 text-rose-800"
                    : application.status === "RETURNED_FOR_CORRECTION"
                    ? "bg-amber-100 text-amber-800"
                    : application.status === "API_UNAVAILABLE"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {application.status.replace(/_/g, " ")}
              </span>
              <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                {application.priority} PRIORITY
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
              <span>Applicant: <strong className="text-slate-800">{application.applicantName}</strong></span>
              <span>•</span>
              <span>Regional Cell: <strong className="text-slate-800">{application.office}</strong></span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                <span>Stage Owner:</span>
                <span className="text-indigo-700 font-bold">{application.assignedOfficerName || "Department Officer"}</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>Statutory SLA: 4 Hours (Within Window)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls in Top Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* If Approved or in pipeline, allow manual advance button & auto indicator */}
          {(application.stage === "APPROVED" ||
            application.stage === "PAN_GENERATION" ||
            application.stage === "CARD_PRINTING" ||
            application.stage === "DISPATCHED") && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>Auto-advancing in pipeline</span>
              </span>
              <button
                onClick={() => handleAction("ADVANCE_STAGE")}
                disabled={isProcessing}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                title="Immediately advance to next event"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Step Next Event</span>
              </button>
            </div>
          )}

          {/* If API unavailable, show Retry button */}
          {application.status === "API_UNAVAILABLE" && (
            <button
              onClick={() => handleAction("RETRY_VERIFICATION")}
              disabled={isProcessing}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              <span>Retry API Connector</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Workflow, Citizen Data, Documents, Verifications */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Workflow Pipeline Stage Progression */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                WORKFLOW PIPELINE PROGRESSION
              </h3>
              <span className="text-xs font-bold text-indigo-600">
                Stage: {application.stage.replace(/_/g, " ")}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-medium">
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span>1. Application Submitted</span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span>2. Data Validation</span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span>3. Identity Verification</span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span>4. Cross-System Validation</span>
              </div>

              {/* Sub-stages: Officer Decision -> Physical Card */}
              <div
                className={`p-3 rounded-2xl flex items-center gap-2 ${
                  application.stage === "OFFICER_REVIEW" || application.stage === "OFFICER_ASSIGNED"
                    ? "bg-indigo-600 text-white font-bold animate-pulse"
                    : application.stage === "APPROVED" ||
                      application.stage === "PAN_GENERATION" ||
                      application.stage === "CARD_PRINTING" ||
                      application.stage === "DISPATCHED" ||
                      application.stage === "DELIVERED"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <span>5. Officer Review</span>
              </div>

              <div
                className={`p-3 rounded-2xl flex items-center gap-2 ${
                  application.stage === "PAN_GENERATION"
                    ? "bg-blue-600 text-white font-bold animate-pulse"
                    : application.physicalCard?.panNumber
                    ? "bg-emerald-50 text-emerald-800 font-semibold"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <span>6. PAN Generation</span>
              </div>

              <div
                className={`p-3 rounded-2xl flex items-center gap-2 ${
                  application.stage === "CARD_PRINTING"
                    ? "bg-amber-600 text-white font-bold animate-pulse"
                    : application.physicalCard?.printedAt
                    ? "bg-emerald-50 text-emerald-800 font-semibold"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <span>7. Physical Card Print</span>
              </div>

              <div
                className={`p-3 rounded-2xl flex items-center gap-2 ${
                  application.stage === "DELIVERED"
                    ? "bg-emerald-600 text-white font-bold"
                    : application.stage === "DISPATCHED"
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <span>8. Dispatch & Delivery</span>
              </div>
            </div>
          </div>

          {/* 2. Automated Verification & Cross-System Comparison Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  AUTOMATED VERIFICATION & CROSS-SYSTEM COMPARISON
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                Rule Engine + Interoperability Mesh
              </span>
            </div>

            <div className="space-y-3">
              {application.verifications.map((v) => (
                <div
                  key={v.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    v.status === "VERIFIED"
                      ? "bg-emerald-50/40 border-emerald-100"
                      : v.status === "CONFLICT"
                      ? "bg-rose-50 border-rose-200"
                      : "bg-blue-50/50 border-blue-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {v.status === "VERIFIED" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span className="font-bold text-xs text-slate-900">{v.name}</span>
                      <span className="text-[10px] text-slate-500">({v.source})</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        v.status === "VERIFIED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800 font-black"
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                    {v.details}
                  </p>

                  {/* Comparison columns if values exist */}
                  {(v.applicationValue || v.registryValue) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-200/60 text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-semibold">Application Value:</span>
                        <span className="font-bold text-slate-800">{v.applicationValue}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Registry Value (UIDAI):</span>
                        <span className="font-bold text-slate-800">{v.registryValue}</span>
                      </div>
                      {v.documentValue && (
                        <div>
                          <span className="text-slate-400 block font-semibold">Document (DigiLocker):</span>
                          <span className="font-bold text-slate-800">{v.documentValue}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Citizen Data & Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Citizen Data */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>CITIZEN DATA (NORMALIZED)</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Full Name</span>
                  <span className="font-bold text-slate-900">{application.data.fullName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Father&apos;s Name</span>
                  <span className="font-bold text-slate-900">{application.data.fatherName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Date of Birth</span>
                  <span className="font-mono font-bold text-slate-900">{application.data.dateOfBirth}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Aadhaar UID</span>
                  <span className="font-mono font-bold text-slate-900">{application.data.aadhaarNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Contact Mobile</span>
                  <span className="font-bold text-slate-900">{application.data.mobile}</span>
                </div>
                <div className="py-1">
                  <span className="text-slate-400 block mb-0.5">Residential Delivery Address</span>
                  <span className="font-medium text-slate-800 text-xs leading-relaxed block">
                    {application.data.address}, {application.data.city}, {application.data.state} - {application.data.pincode}
                  </span>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>DOCUMENTS ATTACHED</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Identity Proof</div>
                    <div className="text-[11px] text-slate-500">{application.documents.identityProof.name}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {application.documents.identityProof.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">DOB Proof</div>
                    <div className="text-[11px] text-slate-500">{application.documents.dobProof.name}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      application.documents.dobProof.status === "VERIFIED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {application.documents.dobProof.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Address Proof</div>
                    <div className="text-[11px] text-slate-500">{application.documents.addressProof.name}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      application.documents.addressProof.status === "VERIFIED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {application.documents.addressProof.status}
                  </span>
                </div>

                {/* Statutory Citizen Consent Box */}
                <div className="pt-2">
                  <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Citizen Consent Validated</span>
                    </div>
                    <p className="text-[11px] text-indigo-800/80 mt-1 leading-relaxed">
                      Consent Token: <span className="font-mono">{application.consent.consentId}</span> under Section 6 of DPDP Act 2023.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): AI Assistant, Officer Decision Console, Audit Trail */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Case Summary Assistant */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">
                  AI ASSISTANT FOR OFFICERS
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                Assistive Only
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-200 leading-relaxed">
                {application.aiSummary.summary}
              </p>

              {application.aiSummary.detectedIssues.length > 0 ? (
                <div className="bg-rose-500/20 border border-rose-500/30 rounded-2xl p-3 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-rose-300">Detected Attention Items</div>
                  {application.aiSummary.detectedIssues.map((issue, idx) => (
                    <div key={idx} className="text-xs text-rose-200">
                      • {issue}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>No unresolved critical mismatch detected.</span>
                </div>
              )}

              <div className="bg-white/10 rounded-2xl p-3 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300 block mb-0.5">
                  Suggested Action
                </span>
                <span className="font-semibold text-amber-300">
                  {application.aiSummary.suggestedAction}
                </span>
              </div>

              {/* Explicit Legal Safeguard Disclaimer */}
              <div className="text-[10px] text-slate-400 border-t border-white/10 pt-3 leading-relaxed">
                <span className="font-bold text-slate-300 block mb-0.5">Statutory Safeguard:</span>
                AI CANNOT automatically approve, reject, or override officer discretion. Authorized government employee holds sole legal decision authority under Section 139A of Income Tax Act 1961.
              </div>
            </div>
          </div>

          {/* Officer Decision Console */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              OFFICER DECISION CONSOLE
            </h3>

            {/* If application is blocked by external conditions */}
            {application.status === "API_UNAVAILABLE" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800">
                <span className="font-bold block mb-0.5">Approval Blocked:</span>
                Downstream API connector is unavailable. Retry connector before approving case.
              </div>
            )}

            {application.status === "VERIFICATION_CONFLICT" && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
                <span className="font-bold block mb-0.5">Conflict Adjudication Required:</span>
                DOB source mismatch detected. You must verify physical document or return for correction.
              </div>
            )}

            <div className="space-y-2.5">
              <button
                onClick={() => setAcceptModalOpen(true)}
                disabled={
                  isProcessing ||
                  application.status === "REJECTED" ||
                  application.status === "COMPLETED" ||
                  application.stage === "DELIVERED" ||
                  application.status === "API_UNAVAILABLE"
                }
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-sm shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>ACCEPT APPLICATION</span>
              </button>

              <button
                onClick={() => setReturnModalOpen(true)}
                disabled={
                  isProcessing ||
                  application.status === "REJECTED" ||
                  application.status === "COMPLETED" ||
                  application.stage === "DELIVERED" ||
                  application.stage === "APPROVED"
                }
                className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>RETURN FOR CORRECTION</span>
              </button>

              <button
                onClick={() => setRejectModalOpen(true)}
                disabled={
                  isProcessing ||
                  application.status === "REJECTED" ||
                  application.status === "COMPLETED" ||
                  application.stage === "DELIVERED"
                }
                className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4 text-rose-600" />
                <span>REJECT APPLICATION</span>
              </button>
            </div>

            {application.officerRemarks && (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600">
                <span className="font-bold text-slate-800 block mb-0.5">Recorded Officer Remarks:</span>
                {application.officerRemarks}
              </div>
            )}
            {application.correctionReason && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
                <span className="font-bold text-amber-900 block mb-0.5">Return Reason Issued:</span>
                {application.correctionReason}
              </div>
            )}
            {application.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
                <span className="font-bold text-rose-900 block mb-0.5">Statutory Rejection Reason:</span>
                {application.rejectionReason}
              </div>
            )}
          </div>

          {/* Live Audit Log Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-blue-600" />
                <span>APPLICATION AUDIT LOG</span>
              </h3>
              <span className="text-[11px] font-bold text-blue-600">{auditLogs.length} events</span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="text-xs border-b border-slate-50 pb-2.5 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px]">{log.action.replace(/_/g, " ")}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{log.details}</div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                    Actor: {log.actor.name} ({log.actor.role})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Structured Accept Application Modal (Section 18) */}
      {acceptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Confirm Application Approval</span>
              </h3>
              <button
                onClick={() => setAcceptModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-750"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-medium">
              You are approving this application for statutory PAN issuance under Section 139A of the Income Tax Act 1961.
            </div>

            {/* Structured Approval Summary Details */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Application ID:</span>
                <span className="font-mono font-bold text-slate-900">{application.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Citizen:</span>
                <span className="font-bold text-slate-900">{application.applicantName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-900">{application.serviceName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Verification Status:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>All checks verified (UIDAI, DigiLocker, Deduplication)</span>
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Outstanding Issues:</span>
                <span className="font-semibold text-slate-700">None detected</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Consent Status:</span>
                <span className="font-semibold text-slate-700">Valid under DPDP Act 2023</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Officer Approval Remarks (Logged in Tamper-Proof Audit)
              </label>
              <textarea
                value={officerRemarks}
                onChange={(e) => setOfficerRemarks(e.target.value)}
                rows={2}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAcceptModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction("ACCEPT", { remarks: officerRemarks })}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Structured Return for Correction Modal (Section 16) */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Return Application for Correction</span>
              </h3>
              <button
                onClick={() => setReturnModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-750"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Error Category */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Error Category *
                </label>
                <select
                  value={returnCategory}
                  onChange={(e) => setReturnCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Document mismatch">Document mismatch</option>
                  <option value="Illegible / cropped upload">Illegible / cropped upload</option>
                  <option value="Permanent address mismatch">Permanent address mismatch</option>
                  <option value="Date of birth discrepancy">Date of birth discrepancy</option>
                  <option value="Missing mandatory evidence">Missing mandatory evidence</option>
                </select>
              </div>

              {/* Affected Field / Document */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Affected Field or Document *
                </label>
                <input
                  type="text"
                  value={returnField}
                  onChange={(e) => setReturnField(e.target.value)}
                  placeholder="e.g. Permanent Address"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Official Reason / Explanation */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Official Explanation *
                </label>
                <textarea
                  value={returnExplanation}
                  onChange={(e) => setReturnExplanation(e.target.value)}
                  placeholder="e.g. The address does not match the submitted proof."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-amber-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Required Correction */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Required Correction *
                </label>
                <textarea
                  value={returnCorrection}
                  onChange={(e) => setReturnCorrection(e.target.value)}
                  placeholder="e.g. Provide a valid address proof or correct the application."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-amber-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Evidence / Reference */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Evidence / Reference Note
                </label>
                <input
                  type="text"
                  value={returnEvidence}
                  onChange={(e) => setReturnEvidence(e.target.value)}
                  placeholder="e.g. Utility bill dated > 3 months"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const combinedReason = `${returnCategory} - ${returnField}: ${returnExplanation} (Action: ${returnCorrection})`;
                  handleAction("RETURN", { reason: combinedReason });
                }}
                disabled={isProcessing || !returnExplanation.trim() || !returnCorrection.trim()}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm disabled:opacity-50 transition-all"
              >
                RETURN TO CITIZEN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Structured Rejection Modal (Section 17) */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-rose-900 flex items-center gap-2">
                <X className="w-5 h-5 text-rose-600" />
                <span>Statutory Application Rejection</span>
              </h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-750"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 font-medium leading-relaxed">
              This action terminates the case under Section 139A of the Income Tax Act 1961. The system never allows AI to reject an application. You must explicitly adjudicate the evidence as an authorized officer.
            </div>

            <div className="space-y-3 text-xs">
              {/* Rejection Category */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Rejection Category *
                </label>
                <select
                  value={rejectionCategory}
                  onChange={(e) => setRejectionCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Verification failed">Verification failed</option>
                  <option value="Incurable demographic conflict">Incurable demographic conflict</option>
                  <option value="Identity impersonation detected">Identity impersonation detected</option>
                  <option value="Non-compliance with Section 139A">Non-compliance with Section 139A</option>
                </select>
              </div>

              {/* Official Reason */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Official Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-rose-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              {/* Evidence / Reference */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Evidence / Statutory Reference *
                </label>
                <input
                  type="text"
                  value={rejectionEvidence}
                  onChange={(e) => setRejectionEvidence(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              {/* Explicit Officer Confirmation Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rejectionConfirmed}
                    onChange={(e) => setRejectionConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-[11px] font-bold text-slate-800 leading-tight">
                    I explicitly confirm as an authorized Department Officer that I have independently reviewed the application evidence and am issuing a statutory rejection.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const combined = `${rejectionCategory}: ${rejectionReason} (Evidence: ${rejectionEvidence})`;
                  handleAction("REJECT", { reason: combined });
                }}
                disabled={isProcessing || !rejectionConfirmed || !rejectionReason.trim()}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm disabled:opacity-50 transition-all"
              >
                CONFIRM REJECTION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
