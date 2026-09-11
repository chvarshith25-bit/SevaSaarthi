"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Layers,
  ArrowRight,
  Clock,
  AlertTriangle,
  User,
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  MoreVertical,
} from "lucide-react";
import { useGov } from "@/lib/store/gov-store";

function QueueContent() {
  const { applications, currentUser } = useGov();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");

  const [filterMode, setFilterMode] = useState<
    "ALL" | "URGENT" | "ACTION_REQUIRED" | "VERIFICATION" | "MANUAL_REVIEW" | "DELAYED"
  >(
    initialTab === "my_assignments" || initialTab === "officer_review"
      ? "ACTION_REQUIRED"
      : "ALL"
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "PRIORITY" | "SLA">("PRIORITY");

  const filteredApplications = useMemo(() => {
    let list = applications.filter((app) => {
      // 1. Filter mode
      if (filterMode === "URGENT") {
        if (app.priority !== "URGENT") return false;
      } else if (filterMode === "ACTION_REQUIRED") {
        if (
          app.status !== "ACTION_REQUIRED" &&
          app.stage !== "OFFICER_REVIEW" &&
          app.status !== "VERIFICATION_CONFLICT"
        )
          return false;
      } else if (filterMode === "VERIFICATION") {
        if (app.stage !== "VERIFICATION_IN_PROGRESS" && app.stage !== "GOVERNMENT_PROCESSING")
          return false;
      } else if (filterMode === "MANUAL_REVIEW") {
        if (app.status !== "VERIFICATION_CONFLICT" && app.status !== "RETURNED_FOR_CORRECTION")
          return false;
      } else if (filterMode === "DELAYED") {
        if (app.status !== "API_UNAVAILABLE" && app.priority !== "URGENT") return false;
      }

      // 2. Priority Filter
      if (priorityFilter !== "ALL" && app.priority !== priorityFilter) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          app.id.toLowerCase().includes(q) ||
          app.applicantName.toLowerCase().includes(q) ||
          app.serviceName.toLowerCase().includes(q) ||
          app.applicantPhone.includes(q);
        if (!matches) return false;
      }

      return true;
    });

    // Sort order
    if (sortBy === "NEWEST") {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "OLDEST") {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "PRIORITY") {
      const pWeights: Record<string, number> = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
      list.sort((a, b) => (pWeights[b.priority] || 0) - (pWeights[a.priority] || 0));
    } else if (sortBy === "SLA") {
      list.sort((a, b) => new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime());
    }

    return list;
  }, [applications, filterMode, priorityFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Priority Queue Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            GOVERNMENT APPLICATION QUEUE
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Prioritized case allocation: Urgent → Action Required → Manual Adjudication → SLA Deadlines
          </p>
        </div>

        <div className="text-right hidden sm:block">
          <div className="text-xs font-bold text-slate-400 uppercase">Queue Capacity</div>
          <div className="text-2xl font-black text-blue-600 font-mono">
            {filteredApplications.length} cases
          </div>
        </div>
      </div>

      {/* Filter Mode Tabs (Section 8) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
        <button
          onClick={() => setFilterMode("ALL")}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
            filterMode === "ALL"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Cases
        </button>
        <button
          onClick={() => setFilterMode("URGENT")}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
            filterMode === "URGENT"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Urgent
        </button>
        <button
          onClick={() => setFilterMode("ACTION_REQUIRED")}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
            filterMode === "ACTION_REQUIRED"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Action Required
        </button>
        <button
          onClick={() => setFilterMode("VERIFICATION")}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
            filterMode === "VERIFICATION"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Verification
        </button>
        <button
          onClick={() => setFilterMode("MANUAL_REVIEW")}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
            filterMode === "MANUAL_REVIEW"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Manual Review
        </button>
        <button
          onClick={() => setFilterMode("DELAYED")}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
            filterMode === "DELAYED"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Delayed
        </button>
      </div>

      {/* Controls Bar: Search, Priority & Sort */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Application ID (e.g. PAN-2026-0001), Citizen Name, Phone..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
          </select>

          {/* Sort dropdown (Section 8: Newest, Oldest, Highest Priority, SLA Due Soon) */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="PRIORITY">Sort: Highest Priority</option>
            <option value="NEWEST">Sort: Newest</option>
            <option value="OLDEST">Sort: Oldest</option>
            <option value="SLA">Sort: SLA Due Soon</option>
          </select>
        </div>
      </div>

      {/* Queue Table (Section 8 Columns) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Application ID</th>
                <th className="py-3.5 px-4">Citizen</th>
                <th className="py-3.5 px-4">Service</th>
                <th className="py-3.5 px-4">Current Stage</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">SLA</th>
                <th className="py-3.5 px-4">Assigned Officer</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No applications match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-blue-700">
                      <Link href={`/applications/${app.id}`}>{app.id}</Link>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {app.applicantName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{app.serviceName}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {app.stage.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          app.status === "ACTION_REQUIRED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : app.status === "VERIFICATION_CONFLICT"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : app.status === "RETURNED_FOR_CORRECTION"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : app.status === "API_UNAVAILABLE"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : app.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {app.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase ${
                          app.priority === "URGENT"
                            ? "text-rose-600 font-black"
                            : app.priority === "HIGH"
                            ? "text-orange-600"
                            : "text-slate-600"
                        }`}
                      >
                        {app.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {app.priority === "URGENT"
                            ? "42m"
                            : app.priority === "HIGH"
                            ? "2h 15m"
                            : "4h"}
                        </span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 text-[11px]">
                      {app.assignedOfficerName || "Sai Sankeerth"}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/applications/${app.id}`}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationQueuePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-slate-500 font-medium">Loading Queue...</div>
        </div>
      }
    >
      <QueueContent />
    </React.Suspense>
  );
}
