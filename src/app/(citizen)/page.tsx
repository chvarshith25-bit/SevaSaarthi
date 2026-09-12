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
  const { user } = useSevaSaarthi();
  const [activeTab, setActiveTab] = useState<"APPLICATIONS" | "HISTORY">("APPLICATIONS");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_PROGRESS" | "ACTION_REQUIRED" | "COMPLETED" | "DRAFTS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("ALL");

  // Determine user first name & time-of-day greeting
  const fullName = user?.name || "Sai Sankeerth";
  const firstName = fullName.split(" ")[0];

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

  return (
    <div className="space-y-6 pb-12 w-full min-w-0">
      {/* 1. Welcome Greeting Banner with Monuments Silhouette */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Your Trusted Government Services Companion</span>
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {greeting}, {firstName}! <span className="inline-block animate-bounce">👋</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Track, apply and manage all your government services in one place.
          </p>
        </div>

        {/* National Monuments Silhouette Banner */}
        <IndiaMonumentsBanner className="md:w-96 shrink-0" />
      </div>

      {/* 2. Top Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Live Applications"
          count={inProgressCount + actionRequiredCount}
          icon={FileText}
          href="/applications"
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Completed"
          count={completedCount}
          icon={CheckCircle2}
          href="/applications"
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Pending Tasks"
          count={5}
          icon={Clock}
          href="/tasks"
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Saved Documents"
          count={12}
          icon={FolderOpen}
          href="/vault"
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
        />
      </div>

      {/* 3. Main Dashboard 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Applications Tracker, Recommended Schemes & Bottom Banner */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          {/* Applications Card Container */}
          <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-6 shadow-xs space-y-5">
            {/* Tabs Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => setActiveTab("APPLICATIONS")}
                  className={cn(
                    "text-sm font-bold pb-2 relative transition-colors",
                    activeTab === "APPLICATIONS"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  My Applications
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("HISTORY")}
                  className={cn(
                    "text-sm font-bold pb-2 relative transition-colors",
                    activeTab === "HISTORY"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Application History
                </button>
              </div>

              {/* Search & Service Filter */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search your applications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="relative">
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value="ALL">All Services</option>
                    <option value="s003">PAN Card</option>
                    <option value="s001">Scholarship</option>
                    <option value="s002">Housing Subsidy</option>
                    <option value="s004">Income Certificate</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Status Filter Pills (Active in Applications Tab) */}
            {activeTab === "APPLICATIONS" && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                    statusFilter === "ALL"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  All ({applications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("IN_PROGRESS")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
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
                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                    statusFilter === "ACTION_REQUIRED"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  Action Required ({actionRequiredCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("COMPLETED")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                    statusFilter === "COMPLETED"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  Completed ({completedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("DRAFTS")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                    statusFilter === "DRAFTS"
                      ? "bg-slate-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  Drafts (0)
                </button>
              </div>
            )}

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

          {/* Recommended Schemes with PAN card & official redirect */}
          <RecommendedSchemes />

          {/* Bottom Banner */}
          <BottomBanner />
        </div>

        {/* Right Column (4 cols): Profile Summary, Tasks & Reminders, Document Vault, Need Help */}
        <div className="lg:col-span-4 space-y-6 min-w-0">
          {/* User Profile Card */}
          <YourProfileCard />

          {/* Tasks & Reminders Card */}
          <YourTasksRemindersCard />

          {/* Document Vault Card */}
          <DocumentVaultCard />

          {/* Need Help Card */}
          <NeedHelpCard />
        </div>
      </div>
    </div>
  );
}
