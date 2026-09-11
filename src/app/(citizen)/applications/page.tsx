"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  ChevronDown,
  FilePlus,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { CitizenApplicationTrackerCard } from "@/components/dashboard/CitizenApplicationTrackerCard";
import { CITIZEN_APPLICATIONS, CitizenTrackedApplication } from "@/lib/mock-data/citizen-applications";

export default function ApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "IN_PROGRESS" | "ACTION_REQUIRED" | "COMPLETED">("ALL");

  const applications = CITIZEN_APPLICATIONS;

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      // Status filter
      if (selectedStatus === "IN_PROGRESS" && app.statusCategory !== "IN_PROGRESS") return false;
      if (selectedStatus === "ACTION_REQUIRED" && app.statusCategory !== "ACTION_REQUIRED") return false;
      if (selectedStatus === "COMPLETED" && app.statusCategory !== "COMPLETED") return false;

      // Department filter
      if (selectedDept !== "ALL" && !app.department.toLowerCase().includes(selectedDept.toLowerCase())) return false;

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
  }, [applications, selectedStatus, selectedDept, searchQuery]);

  const inProgressCount = applications.filter((a) => a.statusCategory === "IN_PROGRESS").length;
  const actionRequiredCount = applications.filter((a) => a.statusCategory === "ACTION_REQUIRED").length;
  const completedCount = applications.filter((a) => a.statusCategory === "COMPLETED").length;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-blue-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Seva Saarthi Live Tracking Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            My Application Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
            Real-time lifecycle tracking, stage milestones, exception handling, and officer decisions for all government schemes submitted through Seva Saarthi.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/checklist"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4" />
              <span>Apply for New Service</span>
            </Link>
            <Link
              href="/applications/PAN-2026-0001/status"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Direct PAN Tracker</span>
            </Link>
          </div>
        </div>

        {/* Decorative background accent */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Applied</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-2">{applications.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all departments</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">In Progress</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-2">{inProgressCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Government processing</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Action Required</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-2">{actionRequiredCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Requires citizen fix</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Completed</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-2">{completedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Dispatched & issued</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedStatus("ALL")}
              className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 ${
                selectedStatus === "ALL"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Applications ({applications.length})
            </button>
            <button
              onClick={() => setSelectedStatus("IN_PROGRESS")}
              className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 ${
                selectedStatus === "IN_PROGRESS"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setSelectedStatus("ACTION_REQUIRED")}
              className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 ${
                selectedStatus === "ACTION_REQUIRED"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Action Required ({actionRequiredCount})
            </button>
            <button
              onClick={() => setSelectedStatus("COMPLETED")}
              className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 ${
                selectedStatus === "COMPLETED"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* Search & Department Filters */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by ID, name, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                <option value="Income Tax">Income Tax Department</option>
                <option value="Higher Education">Department of Higher Education</option>
                <option value="Housing">Ministry of Housing & Urban Affairs</option>
                <option value="Revenue">Revenue Department</option>
                <option value="Welfare">Backward Classes Welfare</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Applications Cards Feed */}
      <div className="space-y-4">
        {filteredApps.length > 0 ? (
          filteredApps.map((app) => (
            <CitizenApplicationTrackerCard key={app.id} app={app} />
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No applications found</h3>
            <p className="text-xs text-slate-400 mt-1">No submitted services match your active search filters.</p>
            <button
              onClick={() => {
                setSelectedStatus("ALL");
                setSelectedDept("ALL");
                setSearchQuery("");
              }}
              className="mt-3 px-4 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-100 transition-colors"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
