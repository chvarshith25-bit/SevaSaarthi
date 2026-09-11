"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ChevronRight,
  Layers,
  Search,
  Radio,
  GitPullRequest,
  BarChart3,
  Clock,
  ExternalLink,
  ChevronDown,
  Check,
  Zap,
  MoreVertical,
  Filter,
  CheckSquare,
} from "lucide-react";
import { useGov } from "@/lib/store/gov-store";
import { StateEmblem } from "@/components/ui/StateEmblem";

export default function GovernmentDashboardPage() {
  const { currentUser, stats, applications, resetDemoPipeline, isLoading } = useGov();

  // Collapsible demo scenario state
  const [demoBannerOpen, setDemoBannerOpen] = useState(true);

  // Table filter and search states
  const [activeTab, setActiveTab] = useState<"ALL" | "MY_ASSIGNMENTS" | "PENDING_REVIEW" | "RETURNED" | "EXCEPTIONS">("ALL");
  const [tableSearch, setTableSearch] = useState("");
  const [tableSort, setTableSort] = useState<"LATEST" | "OLDEST" | "PRIORITY">("LATEST");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [tasksFilter, setTasksFilter] = useState<"ALL" | "HIGH" | "TODAY" | "OVERDUE">("ALL");
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  // Toggle row selection
  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  // Toggle task checkbox
  const toggleTask = (id: string) => {
    setCompletedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  // Dynamic greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Filter table applications
  const filteredTableApps = useMemo(() => {
    let list = applications.filter((app) => {
      // Tab filter
      if (activeTab === "MY_ASSIGNMENTS") {
        if (app.assignedOfficerId !== currentUser.id && app.assignedOfficerId !== "OFF-PAN-7042") return false;
      } else if (activeTab === "PENDING_REVIEW") {
        if (app.stage !== "OFFICER_REVIEW" && app.stage !== "VERIFICATION_IN_PROGRESS" && app.status !== "ACTION_REQUIRED") return false;
      } else if (activeTab === "RETURNED") {
        if (app.status !== "RETURNED_FOR_CORRECTION") return false;
      } else if (activeTab === "EXCEPTIONS") {
        if (app.status !== "VERIFICATION_CONFLICT" && app.status !== "API_UNAVAILABLE") return false;
      }

      // Search query
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase();
        const match =
          app.id.toLowerCase().includes(q) ||
          app.applicantName.toLowerCase().includes(q) ||
          app.serviceName.toLowerCase().includes(q) ||
          app.stage.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });

    // Sorting
    if (tableSort === "LATEST") {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (tableSort === "OLDEST") {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (tableSort === "PRIORITY") {
      const priorityWeight: Record<string, number> = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
      list.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
    }

    return list;
  }, [applications, activeTab, tableSearch, tableSort, currentUser.id]);

  // Today's Work task definitions
  const allTasks = [
    {
      id: "task-1",
      title: "Review PAN application with DOB conflict",
      appId: "PAN-2026-0003",
      name: "Rahul Verma",
      priority: "High",
      due: "Due in 2 hrs",
      dotColor: "bg-rose-500",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      href: "/applications/PAN-2026-0003",
      category: "HIGH",
    },
    {
      id: "task-2",
      title: "Verify document authenticity",
      appId: "PAN-2026-0005",
      name: "Anjali Sharma",
      priority: "Medium",
      due: "Due today",
      dotColor: "bg-amber-500",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      href: "/applications/PAN-2026-0002",
      category: "TODAY",
    },
    {
      id: "task-3",
      title: "Review returned application (address proof)",
      appId: "PAN-2026-0004",
      name: "Priya Patel",
      priority: "Medium",
      due: "Due today",
      dotColor: "bg-amber-500",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      href: "/applications/PAN-2026-0004",
      category: "TODAY",
    },
    {
      id: "task-4",
      title: "Approve PAN applications (batch)",
      appId: "12 applications",
      name: "Automated verification complete",
      priority: "Low",
      due: "Standard SLA",
      dotColor: "bg-emerald-500",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      href: "/applications?tab=officer_review",
      category: "ALL",
    },
    {
      id: "task-5",
      title: "Resolve data conflict",
      appId: "PAN-2026-0078",
      name: "External system mismatch",
      priority: "High",
      due: "Due in 4 hrs",
      dotColor: "bg-rose-500",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      href: "/applications/PAN-2026-0078",
      category: "HIGH",
    },
  ];

  const filteredTasks = allTasks.filter((t) => {
    if (tasksFilter === "HIGH") return t.priority === "High";
    if (tasksFilter === "TODAY") return t.due.includes("today") || t.due.includes("hrs");
    if (tasksFilter === "OVERDUE") return t.due.includes("Overdue");
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. HERO OPERATIONS HEADER */}
      <div className="bg-gradient-to-r from-blue-50/70 via-sky-50/50 to-indigo-50/80 rounded-3xl border border-sky-100 p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Officer metadata */}
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{greeting}, Sai Sankeerth</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Regional Processing Cell • Income Tax Department (CBDT), Hyderabad
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
            <span className="px-3 py-1 bg-white/80 border border-slate-200/80 rounded-xl font-mono text-slate-700 shadow-2xs">
              Desk ID: <span className="font-bold text-blue-700">{currentUser.id}</span>
            </span>
            <span className="px-3 py-1 bg-white/80 border border-slate-200/80 rounded-xl font-semibold text-slate-700 shadow-2xs">
              Role: <span className="font-bold text-slate-900">{currentUser.roleTitle}</span>
            </span>
            <span className="px-3 py-1 bg-white/80 border border-slate-200/80 rounded-xl font-semibold text-slate-700 shadow-2xs">
              Jurisdiction: <span className="font-bold text-slate-900">Hyderabad (RPC)</span>
            </span>
            <span className="px-3 py-1 bg-white/80 border border-slate-200/80 rounded-xl font-medium text-slate-500 shadow-2xs">
              Last Login: 9 Sept 2026, 6:32 PM
            </span>
          </div>
        </div>

        {/* Right: Architectural Illustration & Sovereign Motto */}
        <div className="relative flex items-center justify-end gap-6 shrink-0">
          <div className="text-right hidden xl:block select-none">
            <div className="text-xs font-black tracking-wider text-slate-800 uppercase">
              Efficient Governance
            </div>
            <div className="text-xs font-black tracking-wider text-blue-800 uppercase">
              Stronger Citizens
            </div>
            <div className="text-xs font-black tracking-wider text-emerald-800 uppercase">
              Digital India
            </div>
          </div>

          {/* SVG Parliament / Central Secretariat Dome Architectural Motif */}
          <div className="w-44 h-24 sm:w-56 sm:h-28 text-blue-600/25 relative pointer-events-none">
            <svg viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Ground line */}
              <line x1="10" y1="110" x2="230" y2="110" stroke="currentColor" strokeWidth="2.5" />
              {/* Plinth */}
              <rect x="25" y="100" width="190" height="10" rx="1" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
              {/* Colonnade columns */}
              {[40, 60, 80, 100, 120, 140, 160, 180, 200].map((cx, i) => (
                <rect key={i} x={cx - 3} y="60" width="6" height="40" rx="1" fill="currentColor" fillOpacity="0.4" />
              ))}
              {/* Entablature beam */}
              <rect x="30" y="52" width="180" height="8" rx="1" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1" />
              {/* Central Dome Base */}
              <rect x="90" y="42" width="60" height="10" rx="1" fill="currentColor" fillOpacity="0.6" />
              {/* Central Dome Arch */}
              <path d="M92 42 C92 18, 148 18, 148 42 Z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.5" />
              {/* Cupola finial spike */}
              <line x1="120" y1="18" x2="120" y2="8" stroke="currentColor" strokeWidth="2" />
              <circle cx="120" cy="7" r="2.5" fill="currentColor" />
              {/* Subtle Ashoka Chakra Motif */}
              <circle cx="120" cy="32" r="5" stroke="currentColor" strokeWidth="1" strokeDasharray="1 1" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. 6-CARD KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Applications */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <span>↑ 12%</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">1,250</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Total Applications</div>
            <div className="text-[10px] text-slate-400">vs last month</div>
          </div>
        </div>

        {/* New / Validating */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <span>↑ 5%</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">{stats.newApps}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">New / Validating</div>
            <div className="text-[10px] text-slate-400">vs yesterday</div>
          </div>
        </div>

        {/* Verification Pending */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-rose-600 flex items-center gap-0.5">
              <span>↓ 8%</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">{stats.verificationPending}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Verification Pending</div>
            <div className="text-[10px] text-slate-400">in automated queues</div>
          </div>
        </div>

        {/* Officer Review */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between transition-transform hover:-translate-y-0.5 ring-1 ring-purple-100">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <span>↑ 21%</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-700 font-mono tracking-tight">{stats.officerReview}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Officer Review</div>
            <div className="text-[10px] text-purple-600 font-bold">Action Required</div>
          </div>
        </div>

        {/* Approved & Issued */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <span>↑ 15%</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight">{stats.approved}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Approved & Issued</div>
            <div className="text-[10px] text-slate-400">fulfilled cases</div>
          </div>
        </div>

        {/* Exceptions & Conflicts */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <span>↓ 30%</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 font-mono tracking-tight">{stats.exceptions}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Exceptions & Conflicts</div>
            <div className="text-[10px] text-slate-400">2 critical incidents</div>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE ROW: TODAY'S WORK & APPLICATION PIPELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's Work (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Today&apos;s Work</h2>
              <div className="text-xs text-slate-400 font-medium">Tuesday, 10 Sept 2026</div>
            </div>

            <Link href="/applications" className="text-xs font-bold text-blue-600 hover:underline">
              View All →
            </Link>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setTasksFilter("ALL")}
              className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                tasksFilter === "ALL"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Tasks (25)
            </button>
            <button
              onClick={() => setTasksFilter("HIGH")}
              className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                tasksFilter === "HIGH"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              High Priority (6)
            </button>
            <button
              onClick={() => setTasksFilter("TODAY")}
              className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                tasksFilter === "TODAY"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Due Today (12)
            </button>
            <button
              onClick={() => setTasksFilter("OVERDUE")}
              className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                tasksFilter === "OVERDUE"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Overdue (3)
            </button>
          </div>

          {/* Tasks List */}
          <div className="space-y-2.5">
            {filteredTasks.map((task) => {
              const isDone = completedTaskIds.includes(task.id);
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                        isDone
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-slate-300 bg-white hover:border-blue-500"
                      }`}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    {/* Status Dot */}
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${task.dotColor}`} />

                    {/* Task Title & Details */}
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate transition-colors ${
                          isDone ? "line-through text-slate-400" : ""
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        <span className="font-mono font-medium">{task.appId}</span> • {task.name}
                      </div>
                    </div>
                  </div>

                  {/* Priority & Deadline Pill */}
                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${task.badgeColor}`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
                      {task.due}
                    </span>
                    <Link
                      href={task.href}
                      className="p-1.5 text-slate-400 hover:text-blue-600 group-hover:translate-x-0.5 transition-all"
                      title="Open task"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Application Pipeline (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Application Pipeline</h2>
            <Link href="/workflows" className="text-xs font-bold text-blue-600 hover:underline">
              View Workflow →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            {/* Stage Counters List */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Submissions Today</span>
                </div>
                <span className="font-bold font-mono text-slate-900">125</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                  <span>In Validation</span>
                </div>
                <span className="font-bold font-mono text-slate-900">{stats.newApps}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Verification</span>
                </div>
                <span className="font-bold font-mono text-slate-900">{stats.verificationPending}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <UserCheck className="w-3.5 h-3.5 text-purple-500" />
                  <span>Officer Review</span>
                </div>
                <span className="font-bold font-mono text-purple-700">{stats.officerReview}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <RotateCcw className="w-3.5 h-3.5 text-orange-500" />
                  <span>Returned</span>
                </div>
                <span className="font-bold font-mono text-slate-900">{stats.returned}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Approved</span>
                </div>
                <span className="font-bold font-mono text-slate-900">{stats.approved}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 text-slate-600">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Exceptions</span>
                </div>
                <span className="font-bold font-mono text-rose-600">{stats.exceptions}</span>
              </div>
            </div>

            {/* Donut Chart & Legend */}
            <div className="flex flex-col items-center">
              {/* SVG Donut Chart */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {/* Background Circle */}
                  <circle cx="50" cy="50" r="38" stroke="#E2E8F0" strokeWidth="12" fill="none" />
                  {/* Approved: 88.3% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#22C55E"
                    strokeWidth="12"
                    strokeDasharray="210.5 238.7"
                    strokeDashoffset="0"
                    fill="none"
                  />
                  {/* In Progress: 12.6% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#3B82F6"
                    strokeWidth="12"
                    strokeDasharray="30 238.7"
                    strokeDashoffset="-210.5"
                    fill="none"
                  />
                  {/* Returned: 0.6% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#F97316"
                    strokeWidth="12"
                    strokeDasharray="1.5 238.7"
                    strokeDashoffset="-240.5"
                    fill="none"
                  />
                  {/* Exceptions: 0.8% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#EF4444"
                    strokeWidth="12"
                    strokeDasharray="2 238.7"
                    strokeDashoffset="-242"
                    fill="none"
                  />
                </svg>

                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-black text-slate-900 font-mono leading-none">1,250</span>
                  <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Total</span>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="mt-3 text-[10px] space-y-1 w-full pl-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Approved</span>
                  </div>
                  <span className="font-bold text-slate-800">1,104 (88.3%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-slate-600">In Progress</span>
                  </div>
                  <span className="font-bold text-slate-800">157 (12.6%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-slate-600">Returned</span>
                  </div>
                  <span className="font-bold text-slate-800">8 (0.6%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-slate-600">Exceptions</span>
                  </div>
                  <span className="font-bold text-slate-800">10 (0.8%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. LOWER MIDDLE ROW: QUICK ACTIONS & SLA PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Actions (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Quick Actions</h2>
            <Link href="/applications" className="text-xs font-bold text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Tile 1: Application Queue */}
            <Link
              href="/applications"
              className="p-3.5 bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 rounded-2xl transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900">Application Queue</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Browse & filter applications</div>
            </Link>

            {/* Tile 2: Advanced Search */}
            <Link
              href="/applications"
              className="p-3.5 bg-slate-50/80 hover:bg-sky-50/60 border border-slate-200/80 hover:border-sky-200 rounded-2xl transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Search className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900">Advanced Search</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Find applications / citizens</div>
            </Link>

            {/* Tile 3: Exception Center */}
            <Link
              href="/exceptions"
              className="p-3.5 bg-slate-50/80 hover:bg-rose-50/60 border border-slate-200/80 hover:border-rose-200 rounded-2xl transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900">Exception Center</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Handle conflicts & alerts</div>
            </Link>

            {/* Tile 4: Interoperability Hub */}
            <Link
              href="/interoperability"
              className="p-3.5 bg-slate-50/80 hover:bg-purple-50/60 border border-slate-200/80 hover:border-purple-200 rounded-2xl transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Radio className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900">Interoperability Hub</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Check external verifications</div>
            </Link>

            {/* Tile 5: Data Mapper */}
            <Link
              href="/data-mapper"
              className="p-3.5 bg-slate-50/80 hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-200 rounded-2xl transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <GitPullRequest className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900">Data Mapper</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Manage field mappings</div>
            </Link>

            {/* Tile 6: Generate Reports */}
            <Link
              href="/monitoring"
              className="p-3.5 bg-slate-50/80 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-200 rounded-2xl transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900">Generate Reports</div>
              <div className="text-[10px] text-slate-500 mt-0.5">SLA, performance & insights</div>
            </Link>
          </div>
        </div>

        {/* Right: SLA Performance (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">SLA Performance</h2>
            <button className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <span>This Month</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center pt-1">
            {/* Radial Gauge */}
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" stroke="#E2E8F0" strokeWidth="10" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10B981"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset="10"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-slate-900 font-mono leading-none">96%</span>
                <span className="text-[10px] text-slate-500 font-semibold mt-1">Within SLA</span>
              </div>
            </div>

            {/* SLA Breakdown Statuses */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Within SLA</span>
                </div>
                <span className="font-bold font-mono text-slate-900">1,200</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Approaching</span>
                </div>
                <span className="font-bold font-mono text-slate-900">35</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Breached</span>
                </div>
                <span className="font-bold font-mono text-slate-900">15</span>
              </div>
            </div>
          </div>

          {/* Bottom Summary Stats */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold">Avg. Processing Time</div>
              <div className="text-sm font-black text-slate-900 font-mono mt-0.5 flex items-center gap-1.5">
                <span>2.4 days</span>
                <span className="text-[10px] text-emerald-600 font-bold">↓ 18%</span>
              </div>
              <div className="text-[10px] text-slate-400">vs last month</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 font-semibold">Oldest Pending</div>
              <div className="text-sm font-black text-slate-900 font-mono mt-0.5 flex items-center gap-1.5">
                <span>7 days</span>
              </div>
              <Link
                href="/applications/PAN-2026-0074"
                className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5"
              >
                <span>PAN-2026-0074</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 5. EXECUTABLE DEMONSTRATION SCENARIOS BANNER (COLLAPSIBLE DARK NAVY CARD) */}
      <div className="bg-[#0A1128] text-white rounded-3xl p-6 sm:p-7 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  Executable Demonstration Scenarios
                </h3>
                <span className="text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded uppercase">
                  DEMO ENVIRONMENT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Test end-to-end government workflows with sample cases
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => resetDemoPipeline()}
              disabled={isLoading}
              className="px-3.5 py-1.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              title="Reset all test cases to initial state"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
              <span>Reset Demo Pipeline</span>
            </button>
            <button
              onClick={() => setDemoBannerOpen(!demoBannerOpen)}
              className="px-2.5 py-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs"
            >
              {demoBannerOpen ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>

        {demoBannerOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
            {/* Case 1: PAN-2026-0001 */}
            <Link
              href="/applications/PAN-2026-0001"
              className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-xs text-amber-300">PAN-2026-0001</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Ready to Approve
                  </span>
                </div>
                <div className="font-bold text-sm text-white">Sai Sankeerth</div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Standard Happy Path. All UIDAI and DigiLocker checks verified.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800 mt-3 flex items-center justify-between text-xs font-semibold text-amber-300 group-hover:underline">
                <span>Open Case</span>
                <span>→</span>
              </div>
            </Link>

            {/* Case 2: PAN-2026-0002 */}
            <Link
              href="/applications/PAN-2026-0002"
              className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-xs text-amber-300">PAN-2026-0002</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    API Retry Case
                  </span>
                </div>
                <div className="font-bold text-sm text-white">Anjali Sharma</div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  API timeout (504). Show retry queue & recovery mechanism.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800 mt-3 flex items-center justify-between text-xs font-semibold text-amber-300 group-hover:underline">
                <span>Open Case</span>
                <span>→</span>
              </div>
            </Link>

            {/* Case 3: PAN-2026-0003 */}
            <Link
              href="/applications/PAN-2026-0003"
              className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-xs text-amber-300">PAN-2026-0003</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    DOB Conflict
                  </span>
                </div>
                <div className="font-bold text-sm text-white">Rahul Verma</div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Source conflict. Application states 1999 vs UIDAI 2000. Requires officer adjudication.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800 mt-3 flex items-center justify-between text-xs font-semibold text-amber-300 group-hover:underline">
                <span>Open Case</span>
                <span>→</span>
              </div>
            </Link>

            {/* Case 4: PAN-2026-0004 */}
            <Link
              href="/applications/PAN-2026-0004"
              className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-xs text-amber-300">PAN-2026-0004</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    Returned for Fix
                  </span>
                </div>
                <div className="font-bold text-sm text-white">Priya Patel</div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Returned by officer for blurry address proof. Citizen has resubmitted.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800 mt-3 flex items-center justify-between text-xs font-semibold text-amber-300 group-hover:underline">
                <span>Open Case</span>
                <span>→</span>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* 6. BOTTOM SECTION: APPLICATIONS IN REGIONAL CELL DATA TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Applications in Regional Cell
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Live applications assigned to your desk</p>
          </div>

          <Link
            href="/applications"
            className="self-start sm:self-auto px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span>Manage Queue</span>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100 no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`pb-2.5 font-bold transition-colors relative ${
              activeTab === "ALL"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All ({stats.newApps})
          </button>
          <button
            onClick={() => setActiveTab("MY_ASSIGNMENTS")}
            className={`pb-2.5 font-bold transition-colors relative ${
              activeTab === "MY_ASSIGNMENTS"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            My Assignments ({stats.officerReview})
          </button>
          <button
            onClick={() => setActiveTab("PENDING_REVIEW")}
            className={`pb-2.5 font-bold transition-colors relative ${
              activeTab === "PENDING_REVIEW"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Pending Review ({stats.verificationPending})
          </button>
          <button
            onClick={() => setActiveTab("RETURNED")}
            className={`pb-2.5 font-bold transition-colors relative ${
              activeTab === "RETURNED"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Returned ({stats.returned})
          </button>
          <button
            onClick={() => setActiveTab("EXCEPTIONS")}
            className={`pb-2.5 font-bold transition-colors relative ${
              activeTab === "EXCEPTIONS"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Exceptions ({stats.exceptions})
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search by Application ID, name, or service..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter</span>
            </button>

            <select
              value={tableSort}
              onChange={(e: any) => setTableSort(e.target.value)}
              aria-label="Sort applications"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="LATEST">Sort: Latest</option>
              <option value="OLDEST">Sort: Oldest</option>
              <option value="PRIORITY">Sort: Priority</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 w-8">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={selectedRowIds.length === filteredTableApps.length && filteredTableApps.length > 0}
                    onChange={() =>
                      setSelectedRowIds(
                        selectedRowIds.length === filteredTableApps.length
                          ? []
                          : filteredTableApps.map((a) => a.id)
                      )
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="pb-3">Application ID</th>
                <th className="pb-3">Citizen Name</th>
                <th className="pb-3">Service</th>
                <th className="pb-3">Current Stage</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Priority</th>
                <th className="pb-3">Applied On</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTableApps.slice(0, 10).map((app) => {
                const isSelected = selectedRowIds.includes(app.id);
                return (
                  <tr
                    key={app.id}
                    className={`hover:bg-slate-50/90 transition-colors ${
                      isSelected ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <td className="py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select application ${app.id}`}
                        checked={isSelected}
                        onChange={() => toggleSelectRow(app.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 font-mono font-bold text-blue-700 hover:underline">
                      <Link href={`/applications/${app.id}`}>{app.id}</Link>
                    </td>
                    <td className="py-3 font-bold text-slate-900">{app.applicantName}</td>
                    <td className="py-3 text-slate-600">{app.serviceName}</td>
                    <td className="py-3">
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {app.stage.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          app.status === "ACTION_REQUIRED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : app.status === "VERIFICATION_CONFLICT"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : app.status === "RETURNED_FOR_CORRECTION"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : app.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : app.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {app.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3">
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
                    <td className="py-3 text-slate-500 text-[11px]">
                      {new Date(app.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/applications/${app.id}`}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1"
                        >
                          <span>Open</span>
                          <span>→</span>
                        </Link>
                        <button
                          aria-label="More options"
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer Meta */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing 1–{Math.min(filteredTableApps.length, 6)} of {stats.newApps} applications
          </div>

          <div className="flex items-center gap-1">
            <button className="px-2 py-1 rounded border border-slate-200 text-slate-400 hover:bg-slate-50">
              ‹
            </button>
            <button className="px-2.5 py-1 rounded border border-blue-600 bg-blue-50 text-blue-700 font-bold">
              1
            </button>
            <button className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50">
              2
            </button>
            <button className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50">
              3
            </button>
            <button className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50">
              4
            </button>
            <button className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50">
              5
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50">
              14
            </button>
            <button className="px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50">
              ›
            </button>

            <div className="ml-4 flex items-center gap-1">
              <span>Rows per page</span>
              <select
                aria-label="Rows per page"
                className="bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 font-semibold"
              >
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Version and Sovereign Footer */}
      <div className="pt-4 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 border-t border-slate-200/80 mt-6">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
            <StateEmblem size={16} className="text-amber-600/90" />
          </div>
          <div className="text-[11px] leading-tight text-slate-500">
            <span className="font-bold text-slate-700">Government of India</span> • Income Tax Department (CBDT) • Digital Governance for a better India
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-medium font-mono">
          FORMly v2.0.0 | Secure • Reliable • Transparent
        </div>
      </div>
    </div>
  );
}
