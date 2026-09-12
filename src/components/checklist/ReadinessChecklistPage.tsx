"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FileCheck2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  UploadCloud,
  CheckSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
  AlertCircle,
  Copy,
  Zap,
  Clock,
  Building2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Layers,
  GraduationCap,
  CreditCard,
  HeartPulse,
  Home,
  Briefcase,
  Car,
  FileBadge,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { ChecklistItemViewModel, ServiceRequirement, DocumentType } from "@/types";
import { cn } from "@/lib/utils";
import { ManualResolveModal } from "@/components/checklist/ManualResolveModal";
import { UploadDocumentModal } from "@/components/vault/UploadDocumentModal";
import { AutofillAssistant } from "@/components/assistant/AutofillAssistant";
import {
  DOCUMENT_PROCUREMENT_GUIDES,
  OFFICIAL_NSP_WORKFLOW,
} from "@/lib/knowledge/government-schemes-knowledge";
import { toast } from "sonner";

export function ReadinessChecklistPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    services,
    requirements,
    documents,
    profileFields,
    activeServiceId,
    setActiveServiceId,
    checklistSummary,
    unmarkRequirementResolved,
  } = useSevaSaarthi();

  const [selectedReqForResolve, setSelectedReqForResolve] = useState<ServiceRequirement | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<DocumentType | string>("AADHAAR");
  const [isAutofillAssistantOpen, setIsAutofillAssistantOpen] = useState(false);
  const [showProcessRoadmap, setShowProcessRoadmap] = useState(false);
  const [expandedGuidance, setExpandedGuidance] = useState<Record<string, boolean>>({});

  // Sync with URL query parameter ?service=s00X
  useEffect(() => {
    const serviceParam = searchParams.get("service");
    if (serviceParam && services.some((s) => s.id === serviceParam)) {
      if (serviceParam !== activeServiceId) {
        setActiveServiceId(serviceParam);
      }
    }
  }, [searchParams, services, activeServiceId, setActiveServiceId]);

  const handleSelectService = (id: string) => {
    setActiveServiceId(id);
    router.replace(`/checklist?service=${id}`, { scroll: false });
  };

  const toggleGuidance = (id: string) => {
    setExpandedGuidance((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenUploadForReq = (notes?: string | null) => {
    if (notes) {
      setUploadDocType(notes);
    } else {
      setUploadDocType("AADHAAR");
    }
    setIsUploadOpen(true);
  };

  const {
    service,
    totalRequirements,
    satisfiedCount,
    missingCount,
    manuallyResolvedCount,
    percentageComplete,
    items,
  } = checklistSummary;

  const satisfiedItems = items.filter((i) => i.status === "SATISFIED");
  const missingItems = items.filter((i) => i.status === "MISSING");
  const resolvedItems = items.filter((i) => i.status === "MANUALLY_RESOLVED");

  const isComplete = missingCount === 0 && totalRequirements > 0;

  // Calculate readiness percentages for all services for the switcher pills
  const serviceReadinessMap = useMemo(() => {
    const map: Record<string, { percent: number; total: number; satisfied: number }> = {};
    services.forEach((s) => {
      const sReqs = requirements.filter((r) => r.service_id === s.id && r.required);
      if (sReqs.length === 0) {
        map[s.id] = { percent: 100, total: 0, satisfied: 0 };
        return;
      }
      let satisfied = 0;
      sReqs.forEach((r) => {
        if (r.requirement_type === "PERSONAL_INFORMATION") {
          const match = profileFields.find(
            (pf) => pf.field_name === r.field_name && pf.verified && pf.value && pf.value.trim().length > 0
          );
          if (match) satisfied++;
        } else {
          const matchDoc = documents.find((d) => {
            if (d.is_superseded || (d.status !== "VERIFIED" && d.status !== "EXTRACTED")) return false;
            const docType = (d.document_type || "").toUpperCase();
            const note = (r.notes || "").toUpperCase();
            if (docType === note) return true;
            if (note === "MARKSHEET" && (docType === "PREVIOUS_MARKSHEET" || docType === "MARKSHEET")) return true;
            if (note === "BONAFIDE_CERTIFICATE" && (docType === "COLLEGE_ID" || docType === "BONAFIDE_CERTIFICATE")) return true;
            if (note === "COLLEGE_ID" && (docType === "COLLEGE_ID" || docType === "BONAFIDE_CERTIFICATE")) return true;
            if (note === "BANK_PASSBOOK" && docType === "BANK_PASSBOOK") return true;
            return false;
          });
          if (matchDoc) satisfied++;
        }
      });
      const percent = Math.round((satisfied / sReqs.length) * 100);
      map[s.id] = { percent, total: sReqs.length, satisfied };
    });
    return map;
  }, [services, requirements, documents, profileFields]);

  const copySummaryToClipboard = () => {
    const text =
      `Seva Saarthi Readiness Summary - ${service.name}\n` +
      `Progress: ${percentageComplete}% Complete (${satisfiedCount + manuallyResolvedCount}/${totalRequirements} items)\n\n` +
      `Satisfied Items:\n` +
      satisfiedItems.map((i) => `✓ ${i.requirement.label}`).join("\n") +
      `\n\nMissing Items:\n` +
      (missingItems.length > 0
        ? missingItems.map((i) => `✗ ${i.requirement.label} - ${i.requirement.guidance_text}`).join("\n")
        : "None! All requirements are ready.") +
      `\n\nOfficial Portal: ${service.official_url}`;

    navigator.clipboard.writeText(text);
    toast.success("Readiness checklist copied to clipboard!");
  };

  const getServiceIcon = (id: string) => {
    switch (id) {
      case "s001":
      case "s002":
        return <GraduationCap className="w-4 h-4" />;
      case "s003":
        return <CreditCard className="w-4 h-4" />;
      case "s004":
        return <HeartPulse className="w-4 h-4" />;
      case "s005":
        return <Home className="w-4 h-4" />;
      case "s006":
        return <Briefcase className="w-4 h-4" />;
      case "s007":
        return <Car className="w-4 h-4" />;
      case "s008":
      default:
        return <FileBadge className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header & Scheme Switcher */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <FileCheck2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Apply for a Service / Scheme
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select any government scheme below to see your required documents, what you already have, and what you still need to complete your application.
            </p>
          </div>

          {/* Quick Dropdown on Mobile / Small screens */}
          <div className="w-full md:w-72 shrink-0">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Select Scheme / Service:
            </label>
            <div className="relative">
              <select
                value={activeServiceId}
                onChange={(e) => handleSelectService(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                {services.map((s) => {
                  const r = serviceReadinessMap[s.id] || { percent: 0 };
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} ({r.percent}% Ready)
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Scrollable Scheme Selector Pill Cards */}
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Available Government Schemes & Certificates ({services.length})</span>
            <span className="text-[10px] text-indigo-600 font-semibold lowercase">Click any card to check eligibility</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {services.map((s) => {
              const isSelected = s.id === activeServiceId;
              const r = serviceReadinessMap[s.id] || { percent: 0, satisfied: 0, total: 0 };
              const isFull = r.percent === 100;

              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectService(s.id)}
                  className={cn(
                    "text-left p-3 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden group",
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 ring-2 ring-indigo-600/20"
                      : "bg-slate-50/70 hover:bg-slate-100 border-slate-200/80 text-slate-800"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={cn(
                        "p-1.5 rounded-lg shrink-0",
                        isSelected ? "bg-white/20 text-white" : "bg-white text-indigo-600 border border-slate-200"
                      )}
                    >
                      {getServiceIcon(s.id)}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                        isSelected
                          ? isFull
                            ? "bg-emerald-500 text-white border-emerald-400"
                            : "bg-white/20 text-white border-white/30"
                          : isFull
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}
                    >
                      {r.percent}% Ready
                    </span>
                  </div>

                  <div>
                    <h2
                      className={cn(
                        "text-xs font-bold leading-snug line-clamp-2",
                        isSelected ? "text-white" : "text-slate-900 group-hover:text-indigo-600"
                      )}
                    >
                      {s.name}
                    </h2>
                    <p
                      className={cn(
                        "text-[10px] mt-1 line-clamp-1",
                        isSelected ? "text-indigo-100" : "text-slate-500"
                      )}
                    >
                      {s.category}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Service Detail Banner */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                {service.category || "Government Scheme"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Verified Scheme
              </span>
            </div>

            {/* Title & Description */}
            <h2 className="text-xl font-black text-slate-900 leading-snug">{service.name}</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {service.description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 mt-4">
              <a
                href={service.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 px-4 py-2 rounded-xl shadow-sm shadow-indigo-200 transition-all hover:scale-102"
              >
                <span>Official Portal ({service.official_domain})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setIsAutofillAssistantOpen(true)}
                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl border border-indigo-200 transition-all"
              >
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>Autofill Assistant</span>
              </button>

              <button
                onClick={() => setShowProcessRoadmap((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>{showProcessRoadmap ? "Hide Process Guide" : "Application Process & Guidelines"}</span>
              </button>

              <button
                onClick={copySummaryToClipboard}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Summary</span>
              </button>
            </div>
          </div>

          {/* Readiness Meter Card */}
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-100 rounded-2xl p-5 min-w-[250px] text-center shrink-0">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Readiness Score
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {percentageComplete}%
            </div>
            <div className="text-xs font-medium text-slate-600 mt-0.5 mb-3">
              {satisfiedCount + manuallyResolvedCount} of {totalRequirements} requirements satisfied
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isComplete ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-blue-500"
                )}
                style={{ width: `${percentageComplete}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
              <span className="text-emerald-700 font-bold">{satisfiedCount} Satisfied</span>
              <span className="text-amber-700 font-bold">{missingCount} Missing</span>
              <span className="text-blue-700 font-bold">{manuallyResolvedCount} Resolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Process & Timeline Roadmap */}
      {showProcessRoadmap && (
        <div className="bg-white rounded-3xl border border-indigo-100 p-6 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-200 uppercase">
                  Official Government Lifecycle
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {service.name} — Process Workflow
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Official step-by-step verification lifecycle from application registration to benefit sanction / issuance.
              </p>
            </div>

            <a
              href={service.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl self-start sm:self-auto"
            >
              <span>{service.official_domain}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
            {OFFICIAL_NSP_WORKFLOW.stages.map((stage) => (
              <div
                key={stage.stageNumber}
                className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                      {stage.stageNumber}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {stage.timeline}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug mb-1">
                    {stage.stageName}
                  </h4>
                  <div className="text-[10px] font-semibold text-indigo-600 mb-2">
                    {stage.responsibleParty}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                    {stage.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Key Checklist:
                  </div>
                  <ul className="text-[10px] text-slate-600 space-y-1">
                    {stage.actionItems.slice(0, 2).map((action, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Grievance Redressal Banner */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <strong>Need Support or Facing Issues?</strong> Official Helpdesk Helpline:{" "}
                <span className="font-bold">1800-11-2001</span> | Email:{" "}
                <span className="font-bold">helpdesk@gov.in</span>
              </div>
            </div>
            <a
              href={service.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-800 hover:text-amber-950 font-bold underline shrink-0"
            >
              Open Official Portal
            </a>
          </div>
        </div>
      )}

      {/* Completion Banner */}
      {isComplete && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-950">
                You are 100% ready to apply for {service.name}! 🎉
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                All required documents and personal fields are verified. Use the Autofill Assistant to review your data package and apply directly on the official portal.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsAutofillAssistantOpen(true)}
              className="py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Autofill Assistant</span>
            </button>
            <a
              href={service.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 flex items-center gap-2 transition-all"
            >
              <span>{service.official_domain}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Missing Requirements ("What you still need") */}
      {missingItems.length > 0 && (
        <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                {missingItems.length}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Missing Requirements (What You Still Need)</h2>
                <p className="text-[11px] text-slate-500">Upload or confirm these {missingItems.length} items to achieve 100% readiness for this scheme</p>
              </div>
            </div>

            <button
              onClick={() => handleOpenUploadForReq(missingItems[0]?.requirement?.notes)}
              className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="space-y-3">
            {missingItems.map((item) => {
              const req = item.requirement;
              const isExpanded = expandedGuidance[req.id];
              const docGuide = req.notes ? DOCUMENT_PROCUREMENT_GUIDES[req.notes] : null;

              return (
                <div
                  key={req.id}
                  className="border border-amber-200/90 bg-amber-50/20 rounded-2xl p-4 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                        <XCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-slate-900">{req.label}</h3>
                          <span className="text-[10px] font-bold px-2 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 rounded-md">
                            Missing
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Type: {req.requirement_type.replace(/_/g, " ")} {req.notes ? `• Expected Document: ${req.notes}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => handleOpenUploadForReq(req.notes)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload</span>
                      </button>

                      <button
                        onClick={() => toggleGuidance(req.id)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>How to get</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      <button
                        onClick={() => setSelectedReqForResolve(req)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-amber-200/60 bg-white rounded-xl p-4 text-xs text-slate-700 animate-in fade-in space-y-3">
                      {docGuide ? (
                        <div className="space-y-3">
                          {/* Badges row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              <Building2 className="w-3 h-3" />
                              <span>Authority: {docGuide.issuingAuthority}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <Clock className="w-3 h-3" />
                              <span>Turnaround: {docGuide.typicalTurnaround}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <span>Validity: {docGuide.validityPeriod}</span>
                            </span>
                          </div>

                          {/* Mandatory Criteria */}
                          <div>
                            <div className="font-bold text-slate-900 mb-1.5 text-[11px] uppercase tracking-wider text-indigo-900">
                              Official Requirements & Criteria:
                            </div>
                            <ul className="space-y-1 text-[11px] text-slate-600">
                              {docGuide.mandatoryCriteria.map((crit, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{crit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Step-by-Step Procedure */}
                          <div>
                            <div className="font-bold text-slate-900 mb-1.5 text-[11px] uppercase tracking-wider text-indigo-900">
                              Step-by-Step Procurement Instructions:
                            </div>
                            <ol className="space-y-1 text-[11px] text-slate-600 list-decimal list-inside">
                              {docGuide.procurementSteps.map((step, idx) => (
                                <li key={idx} className="leading-relaxed">
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>

                          {/* Common Rejections Warning */}
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900 space-y-1">
                            <div className="font-bold flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Common Rejection Pitfalls to Avoid:</span>
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 pl-1 text-rose-800">
                              {docGuide.commonRejectionReasons.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Official Portal Link if available */}
                          {docGuide.portalUrl && (
                            <div className="pt-2">
                              <a
                                href={docGuide.portalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                              >
                                <span>Open Official Portal ({docGuide.portalUrl})</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Official Guidance:</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed text-[11px] whitespace-pre-line">
                            {req.guidance_text}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Satisfied Requirements ("What you already have") */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
            {satisfiedItems.length}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Satisfied Requirements (What You Already Have)</h2>
            <p className="text-[11px] text-slate-500">Verified and ready from your profile fields and vault documents</p>
          </div>
        </div>

        {satisfiedItems.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl text-center text-slate-500 text-xs">
            No satisfied requirements yet for this scheme. Upload your documents or complete your profile to satisfy them automatically.
          </div>
        ) : (
          <div className="space-y-2.5">
            {satisfiedItems.map((item) => {
              const req = item.requirement;
              return (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50/60 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{req.label}</h3>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                        {item.satisfiedByDocument && (
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-100">
                            Source Document: {item.satisfiedByDocument.original_filename || item.satisfiedByDocument.document_type}
                          </span>
                        )}
                        {item.satisfiedByProfileField && (
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded-md border border-indigo-100">
                            Source Profile: {item.satisfiedByProfileField.field_name} ({item.satisfiedByProfileField.value})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                    Satisfied ✓
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manually Resolved */}
      {resolvedItems.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              {resolvedItems.length}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Manually Resolved Requirements</h2>
              <p className="text-[11px] text-slate-500">Locked manual overrides with custom notes</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {resolvedItems.map((item) => {
              const req = item.requirement;
              return (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3.5 bg-blue-50/30 border border-blue-100 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{req.label}</h3>
                      {item.resolvedNote && (
                        <p className="text-[11px] text-slate-600 mt-0.5 italic">
                          Note: &ldquo;{item.resolvedNote}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => unmarkRequirementResolved(req.id)}
                    className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    Revert
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Resolve Dialog */}
      {selectedReqForResolve && (
        <ManualResolveModal
          requirement={selectedReqForResolve}
          isOpen={!!selectedReqForResolve}
          onClose={() => setSelectedReqForResolve(null)}
        />
      )}

      {/* Upload Modal with pre-selected doc type */}
      {isUploadOpen && (
        <UploadDocumentModal
          isOpen={isUploadOpen}
          initialType={uploadDocType}
          onClose={() => setIsUploadOpen(false)}
        />
      )}

      {/* Autofill Assistant In-App Drawer / Modal */}
      {isAutofillAssistantOpen && (
        <AutofillAssistant
          isOpen={isAutofillAssistantOpen}
          onClose={() => setIsAutofillAssistantOpen(false)}
        />
      )}
    </div>
  );
}

