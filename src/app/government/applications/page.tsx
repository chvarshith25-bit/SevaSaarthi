"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
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
  RotateCcw,
  CheckCircle2,
  CheckCircle,
  HelpCircle,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Building,
  Sparkles,
} from "lucide-react";
import { useGov } from "@/lib/store/gov-store";

function ApplicationsWorkspaceContent() {
  const { applications, currentUser, isLoading } = useGov();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "all";

  // Tab Filter States (Section 6: All, Assigned to Me, Needs Action, Verification, Returned, Completed, Exceptions)
  const [activeTab, setActiveTab] = useState<
    "all" | "assigned" | "needs_action" | "verification" | "returned" | "completed" | "exceptions"
  >(
    initialTab === "review" || initialTab === "officer_review"
      ? "needs_action"
      : initialTab === "assigned" || initialTab === "my_assignments"
      ? "assigned"
      : initialTab === "returned"
      ? "returned"
      : initialTab === "verification"
      ? "verification"
      : initialTab === "completed"
      ? "completed"
      : initialTab === "exceptions"
      ? "exceptions"
      : "all"
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "PRIORITY" | "SLA">("PRIORITY");

  // Synchronize tab state with URL query parameter & custom event
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "review" || tabParam === "officer_review" || tabParam === "needs_action") {
      setActiveTab("needs_action");
    } else if (tabParam === "assigned" || tabParam === "my_assignments") {
      setActiveTab("assigned");
    } else if (tabParam === "returned") {
      setActiveTab("returned");
    } else if (tabParam === "verification") {
      setActiveTab("verification");
    } else if (tabParam === "completed") {
      setActiveTab("completed");
    } else if (tabParam === "exceptions") {
      setActiveTab("exceptions");
    } else if (tabParam === "all") {
      setActiveTab("all");
    }

    const handleCustomTab = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener("gov-tab-change", handleCustomTab);
    return () => window.removeEventListener("gov-tab-change", handleCustomTab);
  }, [searchParams]);

  // Extract unique services for dropdown filter
  const uniqueServices = useMemo(() => {
    return Array.from(new Set(applications.map((a) => a.serviceName))).filter(Boolean);
  }, [applications]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: applications.length,
      assigned: applications.filter(
        (a) => a.assignedOfficerId === currentUser.id || a.assignedOfficerId === "OFF-PAN-7042"
      ).length,
      needs_action: applications.filter(
        (a) => a.status === "ACTION_REQUIRED" || a.stage === "OFFICER_REVIEW"
      ).length,
      verification: applications.filter(
        (a) => a.stage === "VERIFICATION_IN_PROGRESS" || a.stage === "GOVERNMENT_PROCESSING"
      ).length,
      returned: applications.filter((a) => a.status === "RETURNED_FOR_CORRECTION").length,
      completed: applications.filter((a) => a.status === "APPROVED" || a.status === "COMPLETED" || a.stage === "DELIVERED").length,
      exceptions: applications.filter(
        (a) => a.status === "VERIFICATION_CONFLICT" || a.status === "API_UNAVAILABLE"
      ).length,
    };
  }, [applications, currentUser]);

  // Filter and sort applications
  const filteredApplications = useMemo(() => {
    let list = applications.filter((app) => {
      // 1. Tab filter
      if (activeTab === "assigned") {
        if (app.assignedOfficerId !== currentUser.id && app.assignedOfficerId !== "OFF-PAN-7042") {
          return false;
        }
      } else if (activeTab === "needs_action") {
        if (app.status !== "ACTION_REQUIRED" && app.stage !== "OFFICER_REVIEW") {
          return false;
        }
      } else if (activeTab === "verification") {
        if (app.stage !== "VERIFICATION_IN_PROGRESS" && app.stage !== "GOVERNMENT_PROCESSING") {
          return false;
        }
      } else if (activeTab === "returned") {
        if (app.status !== "RETURNED_FOR_CORRECTION") {
          return false;
        }
      } else if (activeTab === "completed") {
        if (app.status !== "APPROVED" && app.status !== "COMPLETED" && app.stage !== "DELIVERED") {
          return false;
        }
      } else if (activeTab === "exceptions") {
        if (app.status !== "VERIFICATION_CONFLICT" && app.status !== "API_UNAVAILABLE") {
          return false;
        }
      }

      // 2. Priority Filter
      if (priorityFilter !== "ALL" && app.priority !== priorityFilter) return false;

      // 3. Service Filter
      if (serviceFilter !== "ALL" && app.serviceName !== serviceFilter) return false;

      // 4. Search query
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
  }, [applications, activeTab, priorityFilter, serviceFilter, searchQuery, sortBy, currentUser]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Workspace Description */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold mb-1.5 border border-blue-200/50">
            <Layers className="w-3.5 h-3.5" />
            <span>Public Service Applications</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Applications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review and process assigned public-service applications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            Showing <span className="font-bold text-slate-800">{filteredApplications.length}</span> of {applications.length} cases
          </div>
        </div>
      </div>

      {/* 2. Unified Navigation Tabs (Section 6 Requirements) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
          {[
            { key: "all", label: "All Applications", count: tabCounts.all },
            { key: "assigned", label: "Assigned to Me", count: tabCounts.assigned },
            { key: "needs_action", label: "Needs Action", count: tabCounts.needs_action },
            { key: "verification", label: "Verification", count: tabCounts.verification },
            { key: "returned", label: "Returned", count: tabCounts.returned },
            { key: "completed", label: "Completed", count: tabCounts.completed },
            { key: "exceptions", label: "Exceptions", count: tabCounts.exceptions },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                if (typeof window !== "undefined") {
                  const newUrl = tab.key === "all" ? "/government/applications" : `/government/applications?tab=${tab.key}`;
                  window.history.pushState(null, "", newUrl);
                  window.dispatchEvent(new CustomEvent("gov-tab-change", { detail: tab.key }));
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* 3. Search & Filter Bar */}
        <div className="pt-3 mt-2 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, citizen name, phone..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-hidden hover:border-slate-300"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="NORMAL">Normal Priority</option>
              <option value="LOW">Low Priority</option>
            </select>

            {/* Service Filter */}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-hidden hover:border-slate-300 max-w-[180px] truncate"
            >
              <option value="ALL">All Services</option>
              {uniqueServices.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-hidden hover:border-slate-300"
            >
              <option value="PRIORITY">Sort: Priority</option>
              <option value="SLA">Sort: SLA Deadline</option>
              <option value="NEWEST">Sort: Newest First</option>
              <option value="OLDEST">Sort: Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Applications Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            {applications.length === 0 && !isLoading ? (
              <div>
                <div className="text-sm font-bold text-slate-800">No applications available</div>
                <div className="text-xs text-slate-400 mt-1">No applications are currently loaded in the authorized workspace.</div>
              </div>
            ) : searchQuery.trim().length > 0 ? (
              <div>
                <div className="text-sm font-bold text-slate-800">No applications match your search</div>
                <div className="text-xs text-slate-400 mt-1">No records match &quot;{searchQuery}&quot;. Try modifying your search keywords.</div>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-3 px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            ) : activeTab !== "all" && tabCounts[activeTab] === 0 ? (
              <div>
                <div className="text-sm font-bold text-slate-800">No applications match this filter</div>
                <div className="text-xs text-slate-400 mt-1">There are currently 0 cases in the selected category.</div>
                <button
                  onClick={() => setActiveTab("all")}
                  className="mt-3 px-3.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  View All Applications ({tabCounts.all})
                </button>
              </div>
            ) : (
              <div>
                <div className="text-sm font-bold text-slate-800">No applications match your active filters</div>
                <div className="text-xs text-slate-400 mt-1">Try resetting dropdown filters or selecting another tab.</div>
                <button
                  onClick={() => {
                    setActiveTab("all");
                    setPriorityFilter("ALL");
                    setServiceFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="mt-3 px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Citizen Name</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Current Stage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">SLA Status</th>
                  <th className="py-3 px-4">Assigned Officer</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                  >
                    {/* Application ID */}
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 group-hover:text-blue-700">
                      <Link href={`/government/applications/${app.id}/review`}>
                        {app.id}
                      </Link>
                    </td>

                    {/* Citizen Name */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <Link href={`/government/applications/${app.id}/review`}>
                        {app.applicantName}
                      </Link>
                      <div className="text-[10px] text-slate-400 font-normal">{app.applicantPhone}</div>
                    </td>

                    {/* Service */}
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {app.serviceName}
                    </td>

                    {/* Current Stage */}
                    <td className="py-3 px-4 font-semibold text-slate-600">
                      {app.stage}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          app.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : app.status === "ACTION_REQUIRED"
                            ? "bg-blue-100 text-blue-800"
                            : app.status === "VERIFICATION_CONFLICT"
                            ? "bg-rose-100 text-rose-800"
                            : app.status === "RETURNED_FOR_CORRECTION"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                          app.priority === "URGENT"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : app.priority === "HIGH"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {app.priority}
                      </span>
                    </td>

                    {/* SLA */}
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{(app as any).slaStatus || "Within SLA"}</span>
                      </div>
                    </td>

                    {/* Assigned Officer */}
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {app.assignedOfficerId || "OFF-PAN-7042"}
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/government/applications/${app.id}/review`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GovernmentApplicationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Applications Workspace...</div>}>
      <ApplicationsWorkspaceContent />
    </Suspense>
  );
}
