"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  FilePlus2,
  FileText,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Mic,
  HelpCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { CITIZEN_APPLICATIONS } from "@/lib/mock-data/citizen-applications";
import { SaarthiVoiceAssistantModal } from "@/components/assistant/SaarthiVoiceAssistantModal";
import { cn } from "@/lib/utils";

export default function CitizenDashboardPage() {
  const router = useRouter();
  const { user, documents, easyMode, t } = useSevaSaarthi();
  const [isVoiceModalOpen, setIsVoiceModalOpen] = React.useState(false);

  const fullName = user?.name || "Chiluveri Varshith";
  const firstName = fullName.split(" ")[0] || "Varshith";

  const applications = CITIZEN_APPLICATIONS;
  const inProgressApps = applications.filter((a) => a.statusCategory === "IN_PROGRESS");
  const actionRequiredApp = applications.find((a) => a.statusCategory === "ACTION_REQUIRED");
  const docsCount = documents && documents.length > 0 ? documents.length : 12;

  // Latest application to show as simple summary
  const primaryApp = actionRequiredApp || inProgressApps[0] || applications[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 w-full select-none">
      {/* 1. Clean Citizen Welcome Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>DigiLocker Verified Citizen</span>
            </span>
          </div>
          <h1 className={cn("font-black text-slate-900 tracking-tight", easyMode ? "text-3xl" : "text-2xl sm:text-3xl")}>
            Welcome, {firstName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {applications.length} applications on record • {docsCount} verified documents saved
          </p>
        </div>

        {/* Quick Voice Assistant Button */}
        <button
          type="button"
          onClick={() => setIsVoiceModalOpen(true)}
          className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer min-h-[48px] shrink-0"
        >
          <Mic className="w-4 h-4 animate-pulse" />
          <span>Ask Voice Saarthi</span>
        </button>
      </div>

      {/* Primary Citizen Action Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Discover Schemes */}
        <Link
          href="/discover"
          className="group bg-white hover:bg-blue-50/40 rounded-3xl border border-slate-200/90 hover:border-blue-300 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[190px]"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 mb-4 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h2 className={cn("font-bold text-slate-900 group-hover:text-blue-700 transition-colors", easyMode ? "text-lg" : "text-base")}>
              Find Schemes
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Explore 50+ scholarships, farming, housing & welfare schemes.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
            <span>Explore All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Tile 2: Apply for a Service */}
        <Link
          href="/checklist"
          className="group bg-white hover:bg-indigo-50/40 rounded-3xl border border-slate-200/90 hover:border-indigo-300 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[190px]"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 mb-4 group-hover:scale-105 transition-transform">
              <FilePlus2 className="w-6 h-6" />
            </div>
            <h2 className={cn("font-bold text-slate-900 group-hover:text-indigo-700 transition-colors", easyMode ? "text-lg" : "text-base")}>
              Apply for a Service
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Check required documents and apply with 1-click autofill.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
            <span>Start Application</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Tile 3: My Applications */}
        <Link
          href="/applications"
          className="group bg-white hover:bg-emerald-50/40 rounded-3xl border border-slate-200/90 hover:border-emerald-300 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[190px]"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 mb-4 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h2 className={cn("font-bold text-slate-900 group-hover:text-emerald-700 transition-colors", easyMode ? "text-lg" : "text-base")}>
                My Applications
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {applications.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Track live government processing milestones and approval stages.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
            <span>Track Status</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Tile 4: Document Vault */}
        <Link
          href="/vault"
          className="group bg-white hover:bg-purple-50/40 rounded-3xl border border-slate-200/90 hover:border-purple-300 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[190px]"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 mb-4 group-hover:scale-105 transition-transform">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h2 className={cn("font-bold text-slate-900 group-hover:text-purple-700 transition-colors", easyMode ? "text-lg" : "text-base")}>
                My Documents
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                {docsCount} Stored
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Aadhaar, PAN, Marksheets & Income certificates stored securely.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
            <span>Open Vault</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* 4. Simple, Clean Active Application Spotlight (Only 1 clean card instead of crowded mess) */}
      {primaryApp && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Application Status
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                {primaryApp.title}
              </h2>
              <p className="text-xs text-slate-500">
                {primaryApp.department} • Application ID: <span className="font-mono font-bold text-slate-700">#{primaryApp.id}</span>
              </p>
            </div>

            <span className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold border self-start sm:self-auto flex items-center gap-1.5",
              primaryApp.statusCategory === "ACTION_REQUIRED"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : primaryApp.statusCategory === "COMPLETED"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            )}>
              <span className={cn(
                "w-2 h-2 rounded-full",
                primaryApp.statusCategory === "ACTION_REQUIRED" ? "bg-rose-600 animate-pulse" : "bg-blue-600"
              )} />
              <span>{primaryApp.statusText}</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Applied on: <strong>{primaryApp.appliedDate}</strong></span>
            </div>

            <Link
              href={`/track/${primaryApp.id}`}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all min-h-[44px]"
            >
              <span>View Full Tracking Details</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 5. Minimal Help & Support Strip */}
      <div className="bg-gradient-to-r from-slate-100 via-blue-50/50 to-slate-100 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">Need help with an application or missing document?</h4>
            <p className="text-[11px] text-slate-500">Free citizen support helpline & AI guidance available 24/7.</p>
          </div>
        </div>
        <Link
          href="/help"
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs transition-all shrink-0 flex items-center justify-center gap-1.5 min-h-[40px]"
        >
          <span>Get Help</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Interactive Saarthi Voice Assistant Modal */}
      <SaarthiVoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}
