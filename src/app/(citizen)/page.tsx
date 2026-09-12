"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  Clock,
  FolderOpen,
  Search,
  ChevronDown,
  Sparkles,
  X,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { IndiaMonumentsBanner } from "@/components/ui/IndiaMonumentsBanner";
import { StatCard } from "@/components/ui/StatCard";
import { CitizenApplicationTrackerCard } from "@/components/dashboard/CitizenApplicationTrackerCard";
import { YourProfileCard } from "@/components/dashboard/YourProfileCard";
import { YourTasksRemindersCard } from "@/components/dashboard/YourTasksRemindersCard";
import { RecommendedSchemes } from "@/components/dashboard/RecommendedSchemes";
import { DocumentVaultCard } from "@/components/dashboard/DocumentVaultCard";
import { NeedHelpCard } from "@/components/dashboard/NeedHelpCard";
import { BottomBanner } from "@/components/dashboard/BottomBanner";
import { CITIZEN_APPLICATIONS, CitizenTrackedApplication } from "@/lib/mock-data/citizen-applications";
import { cn } from "@/lib/utils";

export default function CitizenDashboardPage() {
  const { user, stats, documents } = useSevaSaarthi();
  const [activeTab, setActiveTab] = useState<"APPLICATIONS" | "HISTORY">("APPLICATIONS");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_PROGRESS" | "ACTION_REQUIRED" | "COMPLETED" | "DRAFTS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("ALL");

  // Determine user first name & time-of-day greeting
  const fullName = user?.name || "Chiluveri Varshith";
  const firstName = fullName.split(" ")[0] || "Varshith";

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const applications = CITIZEN_APPLICATIONS;

  // Filter applications based on tab, status, service, and search
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      // If History tab, only show COMPLETED
      if (activeTab === "HISTORY") {
        if (app.statusCategory !== "COMPLETED") return false;
      } else {
        // In Applications tab, filter by status pills
        if (statusFilter === "IN_PROGRESS" && app.statusCategory !== "IN_PROGRESS") return false;
        if (statusFilter === "ACTION_REQUIRED" && app.statusCategory !== "ACTION_REQUIRED") return false;
        if (statusFilter === "COMPLETED" && app.statusCategory !== "COMPLETED") return false;
        if (statusFilter === "DRAFTS" && app.statusCategory !== "DRAFTS") return false;
      }

      // Service filter
      if (serviceFilter !== "ALL" && app.serviceId !== serviceFilter) return false;

      // Search query
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
  }, [applications, activeTab, statusFilter, serviceFilter, searchQuery]);

  const inProgressCount = applications.filter((a) => a.statusCategory === "IN_PROGRESS").length;
  const actionRequiredCount = applications.filter((a) => a.statusCategory === "ACTION_REQUIRED").length;
  const completedCount = applications.filter((a) => a.statusCategory === "COMPLETED").length;
  const docsCount = documents && documents.length > 0 ? documents.length : 12;

  return (
    <div className="space-y-6 pb-12 w-full min-w-0">
      {/* 1. Welcome Greeting Banner with Monuments Silhouette */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>🇮🇳 Official Citizen Portal</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Locker Verified</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {greeting}, {firstName}! <span className="inline-block animate-bounce">👋</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            Welcome to your unified citizen locker. Track your active applications, verify documents, and apply for government benefits in one click.
          </p>
        </div>

        {/* National Monuments Silhouette Banner */}
        <IndiaMonumentsBanner className="md:w-80 shrink-0" />
      </div>

      {/* 2. Large, Accessible "What would you like to do?" Primary Action Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Quick Actions & Services
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Action 1: Discover & Apply */}
          <Link
            href="/discover"
            className="group bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 hover:to-blue-100/50 rounded-3xl border border-blue-200/80 p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 mb-3 group-hover:scale-105 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                Apply for Schemes
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Explore 50+ central & state schemes matched to your profile.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-100/80 flex items-center justify-between text-xs font-bold text-blue-700">
              <span>Explore Schemes</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Action 2: Track Applications */}
          <Link
            href="/applications"
            className="group bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 hover:to-emerald-100/50 rounded-3xl border border-emerald-200/80 p-5 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Track Applications
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {inProgressCount + actionRequiredCount} Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Check live government processing status for PAN & Scholarship.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-100/80 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>View Progress</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Action 3: Document Locker */}
          <Link
            href="/vault"
            className="group bg-gradient-to-br from-purple-50/80 via-white to-purple-50/30 hover:to-purple-100/50 rounded-3xl border border-purple-200/80 p-5 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 mb-3 group-hover:scale-105 transition-transform">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Document Locker
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  {docsCount} Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Aadhaar, PAN & Certificates stored securely with OCR verification.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-100/80 flex items-center justify-between text-xs font-bold text-purple-700">
              <span>Open Locker</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Action 4: Tasks & Reminders */}
          <Link
            href="/tasks"
            className="group bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 hover:to-amber-100/50 rounded-3xl border border-amber-200/80 p-5 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 mb-3 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  Action Items
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {actionRequiredCount > 0 ? "1 Action Needed" : "All Clear"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {actionRequiredCount > 0
                  ? "Upload Income Certificate before 31st October deadline."
                  : "All your tasks and document requirements are up to date."}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-100/80 flex items-center justify-between text-xs font-bold text-amber-700">
              <span>{actionRequiredCount > 0 ? "Complete Task" : "View Reminders"}</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 3. Main Dashboard 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Applications Tracker, Recommended Schemes & Bottom Banner */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          {/* Applications Card Container */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            {/* Clean Section Header with Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Your Active Applications</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    {filteredApps.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time government processing status and action alerts.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                  "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
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
                  "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
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
                  "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
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
                  "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
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

        {/* Right Column (4 cols): Profile Summary & Need Help / Saarthi AI */}
        <div className="lg:col-span-4 space-y-6 min-w-0">
          {/* User Profile Card */}
          <YourProfileCard />

          {/* Need Help Card / Saarthi AI */}
          <NeedHelpCard />
        </div>
      </div>
    </div>
  );
}
