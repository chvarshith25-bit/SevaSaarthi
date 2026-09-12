"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  CheckCircle2,
  Clock,
  FolderOpen,
  Search,
  Sparkles,
  X,
  Mic,
  ArrowRight,
  AlertTriangle,
  Compass,
  FilePlus2,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { IndiaMonumentsBanner } from "@/components/ui/IndiaMonumentsBanner";
import { CitizenApplicationTrackerCard } from "@/components/dashboard/CitizenApplicationTrackerCard";
import { YourProfileCard } from "@/components/dashboard/YourProfileCard";
import { RecommendedSchemes } from "@/components/dashboard/RecommendedSchemes";
import { NeedHelpCard } from "@/components/dashboard/NeedHelpCard";
import { BottomBanner } from "@/components/dashboard/BottomBanner";
import { SaarthiVoiceAssistantModal } from "@/components/assistant/SaarthiVoiceAssistantModal";
import { CITIZEN_APPLICATIONS } from "@/lib/mock-data/citizen-applications";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CitizenDashboardPage() {
  const router = useRouter();
  const { user, documents, easyMode, t } = useSevaSaarthi();
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_PROGRESS" | "ACTION_REQUIRED" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceInitialPrompt, setVoiceInitialPrompt] = useState("");

  const fullName = user?.name || "Chiluveri Varshith";
  const firstName = fullName.split(" ")[0] || "Varshith";

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t("good_morning");
    if (hour < 17) return t("good_afternoon");
    return t("good_evening");
  }, [t]);

  const applications = CITIZEN_APPLICATIONS;

  // Filter applications based on status and search query
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter === "IN_PROGRESS" && app.statusCategory !== "IN_PROGRESS") return false;
      if (statusFilter === "ACTION_REQUIRED" && app.statusCategory !== "ACTION_REQUIRED") return false;
      if (statusFilter === "COMPLETED" && app.statusCategory !== "COMPLETED") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          app.id.toLowerCase().includes(q) ||
          app.title.toLowerCase().includes(q) ||
          app.department.toLowerCase().includes(q) ||
          app.statusText.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [applications, statusFilter, searchQuery]);

  const inProgressCount = applications.filter((a) => a.statusCategory === "IN_PROGRESS").length;
  const actionRequiredCount = applications.filter((a) => a.statusCategory === "ACTION_REQUIRED").length;
  const completedCount = applications.filter((a) => a.statusCategory === "COMPLETED").length;
  const docsCount = documents && documents.length > 0 ? documents.length : 12;

  // Urgent action item if any
  const urgentApp = applications.find((a) => a.statusCategory === "ACTION_REQUIRED");

  const handleVoiceChip = (promptText: string) => {
    if (promptText === "Track My Scholarship") {
      router.push("/track/NSP-2026-8812");
    } else if (promptText === "Apply for PM Kisan") {
      router.push("/checklist?service=s004");
    } else if (promptText === "My Aadhaar Card") {
      router.push("/vault");
    } else if (promptText === "Get Help") {
      router.push("/help");
    } else {
      setVoiceInitialPrompt(promptText);
      setIsVoiceModalOpen(true);
    }
  };

  const handleOpenVoiceModal = () => {
    setVoiceInitialPrompt("");
    setIsVoiceModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12 w-full min-w-0">
      {/* 1. Welcoming Citizen Hero Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>🇮🇳 {t("app_title")} Official Portal</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t("verified")}</span>
            </span>
          </div>

          <h1 className={cn("font-black text-slate-900 tracking-tight", easyMode ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl")}>
            {greeting}, {firstName}! <span className="inline-block animate-bounce">👋</span>
          </h1>

          <p className={cn("text-slate-600 font-medium leading-relaxed", easyMode ? "text-base sm:text-lg" : "text-xs sm:text-sm")}>
            {t("app_subtitle")} — Track your active government applications, manage verified documents, and apply for central & state schemes in one place.
          </p>
        </div>

        {/* National Monuments Silhouette Banner */}
        <IndiaMonumentsBanner className="md:w-80 shrink-0" />
      </div>

      {/* 2. Prominent Voice Assistant Prompt Card */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-5 sm:p-6 text-white shadow-lg shadow-blue-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div
          onClick={handleOpenVoiceModal}
          className="flex items-center gap-4 cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleOpenVoiceModal()}
        >
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0 ring-2 ring-white/20 group-hover:scale-105 group-hover:bg-white/25 transition-all">
            <Mic className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-sm sm:text-base flex items-center gap-2 group-hover:text-blue-100 transition-colors">
              <span>Tell Seva Saarthi what you need</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">Tap to Speak 🎙️</span>
            </div>
            <p className="text-xs text-blue-100 mt-0.5">
              Speak or tap any prompt to check status, upload documents, or find benefits.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {[
            "Track My Scholarship",
            "Apply for PM Kisan",
            "My Aadhaar Card",
            "Get Help",
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleVoiceChip(prompt)}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 hover:scale-105 cursor-pointer min-h-[38px] flex items-center gap-1.5"
            >
              <span>🎙️</span>
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Urgent Action Callout (if action is required) */}
      {urgentApp && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-700">Action Required</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800">Application #{urgentApp.id}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                {urgentApp.title} needs your attention
              </h3>
              <p className="text-xs text-rose-800 font-medium">
                {urgentApp.pendingAction?.description || urgentApp.remarks || "Income Certificate must be uploaded to continue government verification."}
              </p>
            </div>
          </div>

          <Link
            href={`/track/${urgentApp.id}`}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 min-h-[48px] shrink-0 transition-all"
          >
            <span>Resolve Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 4. Large, Accessible Primary Action Hub (5 Citizen Tiles) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className={cn("font-bold uppercase tracking-wider text-slate-500", easyMode ? "text-sm" : "text-xs")}>
            {t("what_help_needed")}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Tile 1: Find a Service */}
          <Link
            href="/discover"
            className="group bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 hover:to-blue-100/50 rounded-3xl border border-blue-200 p-5 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between min-h-[160px]"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 mb-3 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className={cn("font-bold text-slate-900 group-hover:text-blue-700 transition-colors", easyMode ? "text-base" : "text-sm")}>
                {t("discover_services")}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Find scholarships, farming grants & health schemes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between text-xs font-bold text-blue-700">
              <span>Find Services</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Tile 2: Apply for a Service */}
          <Link
            href="/checklist"
            className="group bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/30 hover:to-indigo-100/50 rounded-3xl border border-indigo-200 p-5 shadow-2xs hover:shadow-md hover:border-indigo-400 transition-all flex flex-col justify-between min-h-[160px]"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 mb-3 group-hover:scale-105 transition-transform">
                <FilePlus2 className="w-6 h-6" />
              </div>
              <h3 className={cn("font-bold text-slate-900 group-hover:text-indigo-700 transition-colors", easyMode ? "text-base" : "text-sm")}>
                {t("apply_for_service")}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Check required documents & 1-click apply.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center justify-between text-xs font-bold text-indigo-700">
              <span>Apply Now</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Tile 3: Check My Application */}
          <Link
            href="/applications"
            className="group bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 hover:to-emerald-100/50 rounded-3xl border border-emerald-200 p-5 shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between min-h-[160px]"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className={cn("font-bold text-slate-900 group-hover:text-emerald-700 transition-colors", easyMode ? "text-base" : "text-sm")}>
                  {t("my_applications")}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {inProgressCount + actionRequiredCount} Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Live government progress and tracking.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>View Status</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Tile 4: Documents Locker */}
          <Link
            href="/vault"
            className="group bg-gradient-to-br from-purple-50/80 via-white to-purple-50/30 hover:to-purple-100/50 rounded-3xl border border-purple-200 p-5 shadow-2xs hover:shadow-md hover:border-purple-400 transition-all flex flex-col justify-between min-h-[160px]"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 mb-3 group-hover:scale-105 transition-transform">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className={cn("font-bold text-slate-900 group-hover:text-purple-700 transition-colors", easyMode ? "text-base" : "text-sm")}>
                  {t("documents")}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  {docsCount} Stored
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Aadhaar, PAN & marksheet securely saved.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between text-xs font-bold text-purple-700">
              <span>Open Locker</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Tile 5: Get Help / Saarthi AI */}
          <Link
            href="/help"
            className="group bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 hover:to-amber-100/50 rounded-3xl border border-amber-200 p-5 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between min-h-[160px]"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 mb-3 group-hover:scale-105 transition-transform">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className={cn("font-bold text-slate-900 group-hover:text-amber-700 transition-colors", easyMode ? "text-base" : "text-sm")}>
                {t("help_support")}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                24/7 AI citizen support in your language.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-xs font-bold text-amber-700">
              <span>Ask a Question</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 5. Main Dashboard 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Applications Tracker, Recommended Schemes & Bottom Banner */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          {/* Applications Card Container */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            {/* Clean Section Header with Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{t("my_applications")}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    {filteredApps.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live government processing status, verification checkpoints, and action alerts.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium min-h-[40px]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Simple Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[40px]",
                  statusFilter === "ALL"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                All Applications ({applications.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("IN_PROGRESS")}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[40px]",
                  statusFilter === "IN_PROGRESS"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                In Progress ({inProgressCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ACTION_REQUIRED")}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 min-h-[40px]",
                  statusFilter === "ACTION_REQUIRED"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                )}
              >
                <span>Action Needed</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                  statusFilter === "ACTION_REQUIRED" ? "bg-white/20 text-white" : "bg-rose-200 text-rose-800"
                )}>
                  {actionRequiredCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("COMPLETED")}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[40px]",
                  statusFilter === "COMPLETED"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                Completed ({completedCount})
              </button>
            </div>

            {/* List of Applications */}
            <div className="space-y-4">
              {filteredApps.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No applications found matching the selected filter.
                </div>
              ) : (
                filteredApps.map((app) => (
                  <CitizenApplicationTrackerCard key={app.id} app={app} />
                ))
              )}
            </div>
          </div>

          {/* Recommended Schemes */}
          <RecommendedSchemes />

          {/* Bottom Banner */}
          <BottomBanner />
        </div>

        {/* Right Column (4 cols): Profile Summary & Need Help */}
        <div className="lg:col-span-4 space-y-6 min-w-0">
          {/* User Profile Card */}
          <YourProfileCard />

          {/* Need Help Card / Saarthi AI */}
          <NeedHelpCard />
        </div>
      </div>

      {/* Interactive Saarthi Voice Assistant Modal */}
      <SaarthiVoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        initialPrompt={voiceInitialPrompt}
      />
    </div>
  );
}
