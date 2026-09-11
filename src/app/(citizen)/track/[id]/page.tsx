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

  const isPanService = application?.serviceId === "srv_pan_new" || application?.id.startsWith("PAN-");
  const isScholarship = application?.serviceId === "srv_scholarship_merit" || application?.id.startsWith("SCH-");
  const isHousing = application?.serviceId === "srv_pmay_housing" || application?.id.startsWith("HOU-");

  const serviceTrackerTitle = isPanService
    ? "PAN APPLICATION TRACKER"
    : isScholarship
    ? "SCHOLARSHIP APPLICATION TRACKER"
    : isHousing
    ? "HOUSING SUBSIDY APPLICATION TRACKER"
    : `${(application?.serviceName || "SERVICE").toUpperCase()} TRACKER`;

  const departmentTitle = isPanService
    ? "National e-Governance Division • Income Tax Department (CBDT)"
    : isScholarship
    ? "Department of Higher Education • Ministry of Education"
    : isHousing
    ? "Ministry of Housing and Urban Affairs • PMAY Urban"
    : (application?.department || "National e-Governance Division");

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
                onChange={(e) => router.push(`/applications/${e.target.value}/status`)}
                className="text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="PAN-2026-0001">PAN-2026-0001 (Sai Sankeerth - Standard)</option>
                <option value="SCH-2026-2345">SCH-2026-2345 (Sai Sankeerth - Scholarship)</option>
                <option value="HOU-2026-7781">HOU-2026-7781 (Sai Sankeerth - PM Housing)</option>
                <option value="PAN-2026-0002">PAN-2026-0002 (Anjali - API Retry)</option>
                <option value="PAN-2026-0003">PAN-2026-0003 (Rahul - DOB Conflict)</option>
                <option value="PAN-2026-0004">PAN-2026-0004 (Priya - Returned for Fix)</option>
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
                    Form 49A intake validated with citizen digital consent token under Section 6 of DPDP Act 2023.
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
                    Identity verified against UIDAI Aadhaar Gateway; educational DOB proof verified via DigiLocker (Simulated Sandbox Connectors).
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
                    Jurisdiction: <span className="font-bold text-slate-900">Regional Processing Cell (Hyderabad)</span>
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

                  {/* Sub-stage 1: Officer Review */}
                  <div className="flex items-start gap-3 relative z-10">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 transition-all ${
                        isOfficerReviewDone
                          ? "bg-emerald-500 text-white shadow-xs"
                          : isOfficerReviewCurrent
                          ? application.status === "RETURNED_FOR_CORRECTION"
                            ? "bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse"
                            : application.status === "VERIFICATION_CONFLICT"
                            ? "bg-rose-500 text-white ring-4 ring-rose-100 animate-pulse"
                            : "bg-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {isOfficerReviewDone ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs text-slate-900">Officer Review</div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isOfficerReviewDone
                              ? "bg-emerald-50 text-emerald-700"
                              : isOfficerReviewCurrent
                              ? application.status === "RETURNED_FOR_CORRECTION"
                                ? "bg-amber-100 text-amber-800"
                                : application.status === "VERIFICATION_CONFLICT"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-indigo-50 text-indigo-700 font-bold"
                              : "text-slate-400"
                          }`}
                        >
                          {isOfficerReviewDone
                            ? "Approved ✓"
                            : isOfficerReviewCurrent
                            ? application.status === "RETURNED_FOR_CORRECTION"
                              ? "Action Required"
                              : application.status === "VERIFICATION_CONFLICT"
                              ? "Conflict Review"
                              : "Under Review"
                            : "Pending"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isOfficerReviewDone
                          ? `Approved by ${application.assignedOfficerName || "Department Officer"}`
                          : `Owner: ${application.assignedOfficerName || "Department Officer"} (SLA: 4h)`}
                      </p>
                    </div>
                  </div>

                  {/* Sub-stage 2: PAN Generated */}
                  <div className="flex items-start gap-3 relative z-10">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 transition-all ${
                        isPanGeneratedDone
                          ? "bg-emerald-500 text-white shadow-xs"
                          : currentStageIdx === stageOrder.indexOf("APPROVED")
                          ? "bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {isPanGeneratedDone ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs text-slate-900">PAN Generated</div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPanGeneratedDone
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-slate-400"
                          }`}
                        >
                          {isPanGeneratedDone ? "Allocated ✓" : "SLA: 15m"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {application.physicalCard?.panNumber ? (
                          <span className="font-mono font-bold text-indigo-700">
                            PAN: {application.physicalCard.panNumber}
                          </span>
                        ) : (
                          "Owner: CBDT PAN Core Engine"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Sub-stage 3: Card Printing */}
                  <div className="flex items-start gap-3 relative z-10">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 transition-all ${
                        isCardPrintingDone
                          ? "bg-emerald-500 text-white shadow-xs"
                          : application.stage === "CARD_PRINTING"
                          ? "bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {isCardPrintingDone ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs text-slate-900">Card Printing</div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCardPrintingDone
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-slate-400"
                          }`}
                        >
                          {isCardPrintingDone ? "Printed ✓" : "SLA: 24h"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Owner: India Security Press (SPMCIL), Nashik
                      </p>
                    </div>
                  </div>

                  {/* Sub-stage 4: Dispatched */}
                  <div className="flex items-start gap-3 relative z-10">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 transition-all ${
                        isDispatchedDone
                          ? "bg-emerald-500 text-white shadow-xs"
                          : application.stage === "DISPATCHED"
                          ? "bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {isDispatchedDone ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Truck className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs text-slate-900">Dispatched</div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isDispatchedDone
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-slate-400"
                          }`}
                        >
                          {isDispatchedDone ? "Dispatched ✓" : "SLA: 48h"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {application.physicalCard?.trackingNumber ? (
                          <span className="font-mono font-bold text-indigo-700">
                            Speed Post: {application.physicalCard.trackingNumber}
                          </span>
                        ) : (
                          "Owner: India Post Speed Post Logistics"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Sub-stage 5: Delivered */}
                  <div className="flex items-start gap-3 relative z-10">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 transition-all ${
                        isDeliveredDone
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {isDeliveredDone ? (
                        <Check className="w-5 h-5 stroke-[3]" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs text-slate-900">Delivered</div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isDeliveredDone
                              ? "bg-emerald-100 text-emerald-800 font-black"
                              : "text-slate-400"
                          }`}
                        >
                          {isDeliveredDone ? "Delivered ✓" : "Final Delivery"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Owner: Local Post Office Delivery Division
                      </p>
                    </div>
                  </div>
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
              {application.stage === "SUBMITTED" && "Application received. Commencing automated verification."}
              {application.stage === "VALIDATING" && "Pre-flight verification in progress."}
              {application.stage === "VERIFICATION_IN_PROGRESS" &&
                (application.status === "API_UNAVAILABLE"
                  ? "Downstream government API timed out. Background retry queue active."
                  : "Checking identity credentials with UIDAI and DigiLocker registries.")}
              {application.stage === "VERIFIED" && "Automated checks passed. Routing to Regional Processing Cell."}
              {application.stage === "GOVERNMENT_PROCESSING" &&
                (application.status === "VERIFICATION_CONFLICT"
                  ? "DOB conflict detected across source registries. Manual officer review in progress."
                  : "Government processing your application")}
              {application.stage === "OFFICER_ASSIGNED" && "Assigned to authorized Department Officer for statutory review."}
              {application.stage === "OFFICER_REVIEW" &&
                (application.status === "RETURNED_FOR_CORRECTION"
                  ? "Application returned by officer for document correction."
                  : application.status === "REJECTED"
                  ? "Application closed by officer."
                  : "Government processing your application")}
              {application.stage === "APPROVED" && "Officer Approved! Triggering automated PAN issuance."}
              {application.stage === "PAN_GENERATION" && `Permanent Account Number allocated: ${application.physicalCard?.panNumber || "Generating..."}`}
              {application.stage === "CARD_PRINTING" && "Physical card currently in high-security print run at ISP Nashik."}
              {application.stage === "DISPATCHED" && `Dispatched via India Post Speed Post (${application.physicalCard?.trackingNumber || "Assigned"})`}
              {application.stage === "DELIVERED" && "Physical PAN card successfully delivered!"}
            </div>

            {/* Sub-status explanation banner */}
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-600 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-semibold">
                <span>Stage Owner:</span>
                <span className="text-slate-900 font-bold">
                  {application.stage === "OFFICER_REVIEW" || application.stage === "OFFICER_ASSIGNED"
                    ? application.assignedOfficerName || "Officer Sai Sankeerth (RPC Hyderabad)"
                    : application.stage === "PAN_GENERATION"
                    ? "CBDT PAN Core Engine"
                    : application.stage === "CARD_PRINTING"
                    ? "India Security Press, Nashik"
                    : application.stage === "DISPATCHED"
                    ? "India Post Speed Post Division"
                    : application.stage === "DELIVERED"
                    ? "Local Post Office Delivery Division"
                    : "Formly Orchestration Hub"}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-semibold">
                <span>Statutory SLA:</span>
                <span className="text-indigo-700 font-bold">
                  {application.stage === "OFFICER_REVIEW"
                    ? "4 Hours Target Window"
                    : application.stage === "PAN_GENERATION"
                    ? "15 Minutes"
                    : application.stage === "CARD_PRINTING"
                    ? "24 Hours"
                    : application.stage === "DISPATCHED"
                    ? "48 Hours"
                    : application.stage === "DELIVERED"
                    ? "Fulfilled"
                    : "Automated (Instant)"}
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
                      A discrepancy was detected between external registry databases (Application states DOB 1999-05-14 vs Aadhaar Registry 2000-05-14). Rather than making an automated assumption, Formly has placed your case with a senior CBDT officer for manual evidence review. No further citizen action is required at this time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {application.status === "API_UNAVAILABLE" && (
              <div className="mt-5 bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <RefreshCw className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 animate-spin" />
                  <div>
                    <h4 className="font-bold text-sm text-blue-900">
                      External Registry Connectivity Delay
                    </h4>
                    <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                      The external PAN processing registry experienced a temporary timeout. Your application is safely persisted in state and our resiliency engine is automatically re-querying the gateway. You do not need to resubmit.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {application.status === "REJECTED" && (
              <div className="mt-5 bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-rose-900">Application Rejected</h4>
                    <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                      Reason: {application.rejectionReason || "Statutory grounds under Section 139A."}
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

        {/* Card Delivery Details Accordion if Approved/Dispatched/Delivered */}
        {application.physicalCard?.panNumber && (
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
