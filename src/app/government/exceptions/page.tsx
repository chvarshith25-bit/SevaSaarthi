"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
  UserCheck,
  FileText,
  Server,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { useGov } from "@/lib/store/gov-store";
import { ExceptionRecord, PanApplicationRecord } from "@/types/government";
import { toast } from "sonner";

export type ExceptionCategory = "ALL" | "IDENTITY" | "DOCUMENTS" | "SYSTEM";

/**
 * Classifies exceptions into one of 3 simplified officer categories.
 */
export function getExceptionCategory(exc: ExceptionRecord): "IDENTITY" | "DOCUMENTS" | "SYSTEM" {
  const typeStr = ((exc as any).type || exc.exceptionType || "").toUpperCase();
  const titleStr = (exc.title || "").toLowerCase();
  const descStr = (exc.description || exc.whatHappened || "").toLowerCase();
  const whyStr = (exc.whyItHappened || "").toLowerCase();
  const actStr = (exc.humanActionRequired || "").toLowerCase();
  const appId = (exc.applicationId || "").toUpperCase();

  // 1. Documents & Corrections
  if (
    typeStr.includes("DOCUMENT") ||
    typeStr.includes("CORRECTION") ||
    titleStr.includes("document") ||
    titleStr.includes("correction") ||
    titleStr.includes("unclear") ||
    titleStr.includes("photo") ||
    titleStr.includes("proof") ||
    descStr.includes("document") ||
    descStr.includes("address proof") ||
    actStr.includes("document") ||
    actStr.includes("clarified") ||
    appId === "PAN-2026-0004"
  ) {
    return "DOCUMENTS";
  }

  // 2. Identity & Verification
  if (
    typeStr.includes("VERIFICATION_CONFLICT") ||
    typeStr.includes("IDENTITY") ||
    typeStr.includes("MISMATCH") ||
    typeStr.includes("MANUAL_REVIEW") ||
    titleStr.includes("conflict") ||
    titleStr.includes("identity") ||
    titleStr.includes("date of birth") ||
    titleStr.includes("dob") ||
    titleStr.includes("name") ||
    titleStr.includes("demographic") ||
    descStr.includes("dob") ||
    descStr.includes("date of birth") ||
    descStr.includes("demographic") ||
    descStr.includes("citizen entered") ||
    whyStr.includes("source government databases") ||
    actStr.includes("class 10") ||
    actStr.includes("adjudicate") ||
    appId === "PAN-2026-0003"
  ) {
    return "IDENTITY";
  }

  // 3. System & Registry (default fallback for timeouts, gateways, printing, api unavailable)
  return "SYSTEM";
}

interface SlaInfo {
  status: "WITHIN_SLA" | "DUE_SOON" | "OVERDUE";
  label: string;
  badgeClass: string;
  sortRank: number;
}

/**
 * Derives SLA state inline from application SLA deadline or exception urgency.
 */
export function getExceptionSla(exc: ExceptionRecord, app?: PanApplicationRecord): SlaInfo {
  const deadlineStr = app?.slaDeadline;
  if (deadlineStr) {
    const deadline = new Date(deadlineStr).getTime();
    const now = Date.now();
    const diffHours = (deadline - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
      const overdueHours = Math.max(1, Math.round(Math.abs(diffHours)));
      return {
        status: "OVERDUE",
        label: `Overdue by ${overdueHours}h`,
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        sortRank: 1,
      };
    } else if (diffHours <= 4) {
      const dueHours = Math.max(1, Math.round(diffHours));
      return {
        status: "DUE_SOON",
        label: `Due in ${dueHours}h`,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        sortRank: 2,
      };
    } else {
      const remaining = Math.round(diffHours);
      return {
        status: "WITHIN_SLA",
        label: `Within SLA (${remaining}h left)`,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        sortRank: 4,
      };
    }
  }

  // Fallback if no specific SLA deadline
  if (exc.severity === "CRITICAL") {
    return {
      status: "DUE_SOON",
      label: "Due Soon (Urgent)",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      sortRank: 2,
    };
  }
  return {
    status: "WITHIN_SLA",
    label: "Within SLA",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    sortRank: 4,
  };
}

/**
 * Translates raw technical telemetry into clean, human-readable officer descriptions.
 */
function getHumanizedExceptionDetails(exc: ExceptionRecord) {
  let whatHappened = exc.whatHappened || exc.description || exc.title;
  let whyItMatters = exc.whyItHappened || "Automated processing cannot proceed without officer investigation.";
  let officerAction = exc.humanActionRequired || "Review the application details and supporting evidence.";

  if (exc.id === "EXC-101" || exc.title.toLowerCase().includes("timeout") || exc.title.includes("504")) {
    whatHappened = "Government PAN verification service did not respond in time.";
    whyItMatters = "External registry verification is incomplete, preventing automated deduplication.";
    officerAction = "Trigger a gateway retry or inspect connected registry health.";
  } else if (exc.id === "EXC-102" || exc.title.toLowerCase().includes("date of birth") || exc.title.toLowerCase().includes("dob")) {
    whatHappened = "Date of birth differs between submitted application and authorized government registry.";
    whyItMatters = "Identity cannot be safely confirmed automatically without human adjudication.";
    officerAction = "Review original supporting documents (Class 10 memo / birth certificate) and verify valid legal date of birth.";
  } else if (exc.id === "EXC-103" || exc.title.toLowerCase().includes("printing") || exc.title.toLowerCase().includes("dispatch")) {
    whatHappened = "Physical card printing batch experienced dispatch queue delay.";
    whyItMatters = "Physical fulfillment timeline is delayed, but digital record is ready.";
    officerAction = "Monitor printing queue depth or acknowledge postal dispatch batch.";
  }

  return { whatHappened, whyItMatters, officerAction };
}

function GovernmentExceptionsContent() {
  const { exceptions, applications, refreshAll, isLoading } = useGov();
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get("category");

  // Map category query param
  const getInitialCategory = (): ExceptionCategory => {
    if (!initialCategoryParam) return "ALL";
    const cat = initialCategoryParam.toLowerCase();
    if (cat === "identity" || cat === "identity_verification") return "IDENTITY";
    if (cat === "documents" || cat === "documents_corrections") return "DOCUMENTS";
    if (cat === "system" || cat === "system_registry") return "SYSTEM";
    return "ALL";
  };

  const [activeCategory, setActiveCategory] = useState<ExceptionCategory>(getInitialCategory());
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [retryingAppId, setRetryingAppId] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync category when URL changes (e.g. clicking sidebar Exceptions resets to ALL)
  useEffect(() => {
    setActiveCategory(getInitialCategory());
  }, [initialCategoryParam]);

  // Lookup map for fast application metadata access
  const applicationsMap = useMemo(() => {
    const map = new Map<string, PanApplicationRecord>();
    applications.forEach((app) => map.set(app.id, app));
    return map;
  }, [applications]);

  // Handle Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAll();
      toast.success("Exceptions queue refreshed");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle Resolution
  const handleResolve = async (exceptionId: string) => {
    const resolution = prompt("Enter resolution notes for statutory audit trail:", "Reviewed and acknowledged by authorized officer.");
    if (!resolution) return;

    setResolvingId(exceptionId);
    try {
      const res = await fetch("/api/gov/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exceptionId, resolution }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Exception ${exceptionId} marked resolved.`);
        await refreshAll();
      } else {
        toast.error(data.error || "Failed to resolve exception");
      }
    } catch {
      toast.error("Error resolving exception");
    } finally {
      setResolvingId(null);
    }
  };

  // Handle Retry
  const handleRetryApp = async (applicationId: string) => {
    setRetryingAppId(applicationId);
    try {
      const res = await fetch(`/api/gov/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RETRY_VERIFICATION" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Retry successful for ${applicationId}! Moved to Officer Review queue.`);
        await refreshAll();
      } else {
        toast.error(data.error || "Retry failed");
      }
    } catch {
      toast.error("Network error during retry");
    } finally {
      setRetryingAppId(null);
    }
  };

  const toggleDetails = (id: string) => {
    setExpandedDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Compute dynamic counts from live backend data
  const counts = useMemo(() => {
    const all = exceptions.length;
    const activeTotal = exceptions.filter((e) => !(e.resolved ?? (e as any).isResolved)).length;
    let identityCount = 0;
    let documentsCount = 0;
    let systemCount = 0;
    let overdueOrDueSoonCount = 0;

    exceptions.forEach((exc) => {
      const isResolved = exc.resolved ?? (exc as any).isResolved;
      const cat = getExceptionCategory(exc);
      const app = applicationsMap.get(exc.applicationId);
      const sla = getExceptionSla(exc, app);

      if (cat === "IDENTITY") identityCount++;
      if (cat === "DOCUMENTS") documentsCount++;
      if (cat === "SYSTEM") systemCount++;

      if (!isResolved && (sla.status === "OVERDUE" || sla.status === "DUE_SOON")) {
        overdueOrDueSoonCount++;
      }
    });

    return {
      all,
      activeTotal,
      identityCount,
      documentsCount,
      systemCount,
      overdueOrDueSoonCount,
    };
  }, [exceptions, applicationsMap]);

  // Filter and sort exceptions
  const filteredAndSortedExceptions = useMemo(() => {
    const list = exceptions.filter((exc) => {
      if (activeCategory === "ALL") return true;
      return getExceptionCategory(exc) === activeCategory;
    });

    return list.sort((a, b) => {
      const aResolved = a.resolved ?? (a as any).isResolved ? 1 : 0;
      const bResolved = b.resolved ?? (b as any).isResolved ? 1 : 0;
      if (aResolved !== bResolved) return aResolved - bResolved; // Unresolved first

      // Severity ranking
      const sevOrder: Record<string, number> = {
        CRITICAL: 1,
        HIGH: 2,
        MANUAL_REVIEW: 2,
        MEDIUM: 3,
        DELAYED: 3,
        LOW: 4,
      };
      const aSev = sevOrder[a.severity] || 5;
      const bSev = sevOrder[b.severity] || 5;
      if (aSev !== bSev) return aSev - bSev;

      // SLA ranking
      const aApp = applicationsMap.get(a.applicationId);
      const bApp = applicationsMap.get(b.applicationId);
      const aSla = getExceptionSla(a, aApp);
      const bSla = getExceptionSla(b, bApp);
      if (aSla.sortRank !== bSla.sortRank) return aSla.sortRank - bSla.sortRank;

      // Timestamp descending
      const aTime = new Date(a.timestamp || (a as any).createdAt || 0).getTime();
      const bTime = new Date(b.timestamp || (b as any).createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [exceptions, activeCategory, applicationsMap]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header (Officer-focused terminology) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold mb-1.5 border border-amber-200/60">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Exceptions Requiring Attention</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Exceptions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Applications that need investigation, correction, or follow-up.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
            aria-label="Refresh exceptions queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Summary Strip (Single source of truth) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Needs Attention</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{counts.activeTotal}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active cases</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Identity Conflicts</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{counts.identityCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Demographic mismatches</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Documents / Corrections</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{counts.documentsCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Resubmissions & proof</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">System & Registry</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{counts.systemCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Gateway & dispatch issues</div>
        </div>

        <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SLA Pressure</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{counts.overdueOrDueSoonCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Due soon or overdue</div>
        </div>
      </div>

      {/* 3. Primary Filter Buttons with Inline Counts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Exception categories">
        {[
          { key: "ALL" as const, label: "All", count: counts.all },
          { key: "IDENTITY" as const, label: "Identity & Verification", count: counts.identityCount },
          { key: "DOCUMENTS" as const, label: "Documents & Corrections", count: counts.documentsCount },
          { key: "SYSTEM" as const, label: "System & Registry", count: counts.systemCount },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveCategory(item.key)}
            role="tab"
            aria-selected={activeCategory === item.key}
            aria-label={`${item.label} filter, ${item.count} exceptions`}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeCategory === item.key
                ? "bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-500/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span>{item.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeCategory === item.key
                  ? "bg-slate-950/15 text-slate-950"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {/* 4. Exception Cards Work Queue */}
      <div className="space-y-4">
        {filteredAndSortedExceptions.length === 0 ? (
          /* Structured Compact Empty State */
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-6 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {activeCategory === "IDENTITY"
                ? "✓ No active identity conflicts"
                : activeCategory === "DOCUMENTS"
                ? "✓ No active document issues"
                : activeCategory === "SYSTEM"
                ? "✓ No active system or registry exceptions"
                : "✓ All exception queues are clear"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Applications in this category are currently clear and operating normally.
            </p>
            {activeCategory !== "ALL" && (
              <button
                onClick={() => setActiveCategory("ALL")}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5"
              >
                <span>View All Exceptions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedExceptions.map((exc) => {
            const app = applicationsMap.get(exc.applicationId);
            const isResolved = exc.resolved ?? (exc as any).isResolved;
            const category = getExceptionCategory(exc);
            const sla = getExceptionSla(exc, app);
            const { whatHappened, whyItMatters, officerAction } = getHumanizedExceptionDetails(exc);
            const isExpanded = !!expandedDetails[exc.id];

            const citizenName =
              exc.applicantName ||
              app?.applicantName ||
              app?.data?.fullName ||
              (exc.applicationId ? "Citizen Applicant" : "System Component");

            const serviceName = app?.serviceName || "Statutory Public Service";

            // Category badge visuals
            const categoryMeta = {
              IDENTITY: {
                label: "Identity & Verification",
                icon: UserCheck,
                colorClass: "bg-amber-50 text-amber-800 border-amber-200",
              },
              DOCUMENTS: {
                label: "Documents & Corrections",
                icon: FileText,
                colorClass: "bg-blue-50 text-blue-800 border-blue-200",
              },
              SYSTEM: {
                label: "System & Registry",
                icon: Server,
                colorClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
              },
            }[category];

            const CategoryIcon = categoryMeta.icon;

            // Severity visuals
            const severityClass = {
              CRITICAL: "bg-rose-100 text-rose-900 border-rose-200 font-black",
              HIGH: "bg-amber-100 text-amber-900 border-amber-200 font-bold",
              MANUAL_REVIEW: "bg-amber-100 text-amber-900 border-amber-200 font-bold",
              DELAYED: "bg-indigo-100 text-indigo-900 border-indigo-200 font-bold",
              MEDIUM: "bg-blue-100 text-blue-900 border-blue-200 font-semibold",
              LOW: "bg-slate-100 text-slate-800 border-slate-200 font-medium",
            }[exc.severity] || "bg-slate-100 text-slate-800 border-slate-200";

            return (
              <div
                key={exc.id}
                className={`bg-white rounded-2xl border p-5 lg:p-6 shadow-xs transition-all space-y-4 ${
                  isResolved
                    ? "border-slate-200/70 bg-slate-50/40 opacity-80"
                    : "border-slate-200/90 hover:border-amber-400"
                }`}
              >
                {/* Card Top Strip: Category Badge, Severity, Inline SLA, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${categoryMeta.colorClass}`}
                    >
                      <CategoryIcon className="w-3.5 h-3.5" />
                      <span>{categoryMeta.label}</span>
                    </div>

                    {/* Severity */}
                    <span className={`px-2.5 py-1 text-xs rounded-lg border uppercase tracking-wider ${severityClass}`}>
                      {exc.severity}
                    </span>

                    {/* Inline SLA Status */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${sla.badgeClass}`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{sla.label}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-slate-100 text-slate-700 rounded-md">
                      {exc.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-extrabold rounded-md ${
                        isResolved ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {isResolved ? "RESOLVED" : "ACTION REQUIRED"}
                    </span>
                  </div>
                </div>

                {/* Application & Citizen Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Impacted Application</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-base font-extrabold text-slate-900">{citizenName}</span>
                      {exc.applicationId && (
                        <Link
                          href={`/government/applications/${exc.applicationId}/review`}
                          className="font-mono text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                        >
                          <span>{exc.applicationId}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service</div>
                    <div className="text-xs font-semibold text-slate-700 mt-0.5">{serviceName}</div>
                  </div>
                </div>

                {/* 3 Humanized Blocks: What Happened, Why It Matters, What Officer Needs To Do */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* What Happened */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      What Happened
                    </span>
                    <p className="font-semibold text-slate-800 leading-relaxed">{whatHappened}</p>
                  </div>

                  {/* Why It Matters */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Why It Matters
                    </span>
                    <p className="text-slate-700 leading-relaxed">{whyItMatters}</p>
                  </div>

                  {/* What You Need To Do */}
                  <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/60 flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1">
                      Officer Action Required
                    </span>
                    <p className="font-bold text-amber-950 leading-relaxed">{officerAction}</p>
                  </div>
                </div>

                {/* Expandable Technical Details (Kept hidden from normal officer glance) */}
                <div className="pt-1">
                  <button
                    onClick={() => toggleDetails(exc.id)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition-colors"
                  >
                    <span>{isExpanded ? "Hide Technical Details" : "Show Technical Details"}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 p-3.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1.5 border border-slate-800">
                      <div>
                        <span className="text-slate-400">System Source: </span>
                        <span>{exc.systemName || "Central Registry Gateway"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Current Lifecycle State: </span>
                        <span className="text-amber-300">{exc.currentState || "PROCESSING"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Logged At: </span>
                        <span>{new Date(exc.timestamp || (exc as any).createdAt || Date.now()).toISOString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Auto-Retry Supported: </span>
                        <span>{exc.autoRetry ? "YES" : "NO"}</span>
                        {exc.retryAttempts !== undefined && (
                          <span className="text-slate-400 ml-3">Attempts: {exc.retryAttempts}</span>
                        )}
                      </div>
                      {exc.whyItHappened && (
                        <div>
                          <span className="text-slate-400">Raw Root Cause: </span>
                          <span className="text-slate-300">{exc.whyItHappened}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">
                    {(exc.resolutionNote || (exc as any).resolutionNotes) && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolution: {exc.resolutionNote || (exc as any).resolutionNotes}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Action 1: Open Application */}
                    {exc.applicationId && (
                      <Link
                        href={`/government/applications/${exc.applicationId}/review`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                      >
                        <span>Open Application</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {/* Action 2: Retry Connector for System exceptions */}
                    {category === "SYSTEM" && exc.applicationId && (
                      <button
                        onClick={() => handleRetryApp(exc.applicationId)}
                        disabled={retryingAppId === exc.applicationId}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${retryingAppId === exc.applicationId ? "animate-spin" : ""}`} />
                        <span>{retryingAppId === exc.applicationId ? "Retrying..." : "Retry Connector"}</span>
                      </button>
                    )}

                    {/* Action 3: Mark Resolved */}
                    {!isResolved && (
                      <button
                        onClick={() => handleResolve(exc.id)}
                        disabled={resolvingId === exc.id}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {resolvingId === exc.id ? "Resolving..." : "Mark Resolved"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function GovernmentExceptionsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Loading Exceptions Queue...
        </div>
      }
    >
      <GovernmentExceptionsContent />
    </Suspense>
  );
}
