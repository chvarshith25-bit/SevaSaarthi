"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Clock,
  Layers,
  Sparkles,
  Bot,
  CheckCircle2,
  Building,
  MapPin,
  ChevronRight,
  User,
} from "lucide-react";
import { useGov } from "@/lib/store/gov-store";

export default function GovernmentDashboardPage() {
  const { currentUser, stats, applications, auditLogs } = useGov();

  // Dynamic greeting based on current time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Actionable applications requiring officer attention
  const actionableTasks = useMemo(() => {
    return applications
      .filter(
        (app) =>
          app.status === "ACTION_REQUIRED" ||
          app.stage === "OFFICER_REVIEW" ||
          app.status === "VERIFICATION_CONFLICT" ||
          app.status === "RETURNED_FOR_CORRECTION"
      )
      .slice(0, 6);
  }, [applications]);

  // Real operational counts derived from backend application records (No fabrication)
  const aiRoutedCount = useMemo(() => applications.filter((a) => a.stage !== "DRAFT").length, [applications]);
  const aiCandidatePreparedCount = useMemo(
    () => applications.filter((a) => a.stage === "OFFICER_REVIEW" || a.status === "APPROVED" || a.status === "ACTION_REQUIRED").length,
    [applications]
  );
  const manualReviewCasesCount = useMemo(
    () => applications.filter((a) => a.status === "ACTION_REQUIRED" || a.status === "MANUAL_REVIEW").length,
    [applications]
  );
  const conflictCasesCount = useMemo(
    () => applications.filter((a) => a.status === "VERIFICATION_CONFLICT").length,
    [applications]
  );

  // Recent officer-relevant events from real audit log
  const recentActivity = useMemo(() => {
    return auditLogs.slice(0, 5);
  }, [auditLogs]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Officer Header */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            SARKAR SEVA • Officer Operations
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            {greeting}, Officer {currentUser.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Review and adjudicate pending citizen applications, cross-registry verifications, and exception desk items.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-semibold text-slate-800">{currentUser.department || "Income Tax Department – PAN Division"}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentUser.office || "Regional Processing Cell, Hyderabad"}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-semibold text-slate-800">{currentUser.roleTitle || "Department Officer"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/government/applications"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <span>View All Applications</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 2. Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Needs Action */}
        <Link
          href="/government/applications?tab=needs_action"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Needs Action</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">{stats.officerReview}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-medium">
            <span>Pending statutory review</span>
            <span className="text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform">Review →</span>
          </div>
        </Link>

        {/* Verification */}
        <Link
          href="/government/applications?tab=verification"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verification</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">{stats.verificationPending}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-medium">
            <span>Registry corroboration active</span>
            <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform">Inspect →</span>
          </div>
        </Link>

        {/* Exceptions */}
        <Link
          href="/government/exceptions"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exceptions</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">{stats.exceptions}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-medium">
            <span>Conflicts & API retries</span>
            <span className="text-amber-600 font-bold group-hover:translate-x-0.5 transition-transform">Resolve →</span>
          </div>
        </Link>

        {/* Completed */}
        <Link
          href="/government/applications?tab=completed"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">{stats.approved}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-medium">
            <span>Issued & Delivered</span>
            <span className="text-emerald-600 font-bold group-hover:translate-x-0.5 transition-transform">History →</span>
          </div>
        </Link>
      </div>

      {/* 3. MY PRIORITY WORK */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>My Priority Work</span>
              <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
                {actionableTasks.length} Actionable
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Applications requiring immediate officer inspection, verification, or statutory decision.
            </p>
          </div>
          <Link
            href="/government/applications"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>All Applications</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {actionableTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <div className="text-sm font-bold text-slate-800">Your queue is clear!</div>
            <div className="text-xs text-slate-400 mt-1">No pending priority tasks require immediate review.</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {actionableTasks.map((app) => (
              <div
                key={app.id}
                className="p-4 lg:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    {app.id.split("-").pop()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">{app.id}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-bold text-slate-800">{app.applicantName}</span>
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
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                      <span className="font-medium text-slate-700">{app.serviceName}</span>
                      <span>•</span>
                      <span className="text-slate-600 font-medium">Stage: <strong className="text-slate-800">{app.stage}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>SLA: {(app as any).slaStatus || "Within SLA (3d remaining)"}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <Link
                    href={`/government/applications/${app.id}/review`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>Open Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. AI ASSISTANCE (Real Operational Counts) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Assistance Summary</h2>
              <p className="text-xs text-slate-500">Operational case intelligence from Model 1 & Model 2 V4.2</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
            Advisory Only • No Statutory Authority
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/government/applications"
            className="p-4 bg-slate-50 hover:bg-blue-50/70 rounded-xl border border-slate-200/70 hover:border-blue-300 transition-all group block"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-700">Intake Ingested</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{aiRoutedCount}</div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Applications ingested</span>
              <span className="text-blue-600 font-bold text-[10px]">View all →</span>
            </div>
          </Link>

          <Link
            href="/government/applications?tab=needs_action"
            className="p-4 bg-slate-50 hover:bg-indigo-50/70 rounded-xl border border-slate-200/70 hover:border-indigo-300 transition-all group block"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-indigo-900">Entity Matched</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-2xl font-black text-indigo-950 mt-2">{aiCandidatePreparedCount}</div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Registries corroborating</span>
              <span className="text-indigo-600 font-bold text-[10px]">Inspect →</span>
            </div>
          </Link>

          <Link
            href="/government/applications?tab=needs_action"
            className="p-4 bg-slate-50 hover:bg-blue-50/70 rounded-xl border border-slate-200/70 hover:border-blue-300 transition-all group block"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-900">Needs Officer Action</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-2xl font-black text-blue-900 mt-2">{manualReviewCasesCount}</div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Ready for decision</span>
              <span className="text-blue-600 font-bold text-[10px]">Review →</span>
            </div>
          </Link>

          <Link
            href="/government/exceptions"
            className="p-4 bg-slate-50 hover:bg-amber-50/70 rounded-xl border border-slate-200/70 hover:border-amber-300 transition-all group block"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-amber-900">Cases with Conflicts</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-2xl font-black text-amber-700 mt-2">{conflictCasesCount}</div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Demographic/API issues</span>
              <span className="text-amber-600 font-bold text-[10px]">Resolve →</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 5. RECENT ACTIVITY */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Recent Activity</span>
            <span className="text-slate-400 font-normal text-xs">• Audit Events</span>
          </h2>
          <Link href="/government/audit" className="text-xs font-bold text-blue-600 hover:text-blue-800">
            View Audit Log →
          </Link>
        </div>

        <div className="space-y-2.5">
          {recentActivity.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No recent activity logged yet.</div>
          ) : (
            recentActivity.map((log, idx) => (
              <div
                key={log.id || idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs gap-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="text-slate-600">{log.details}</span>
                    {log.applicationId && (
                      <>
                        <span className="text-slate-400 mx-1.5">•</span>
                        <span className="font-mono text-[11px] text-blue-600">{log.applicationId}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="shrink-0 font-mono text-[11px] text-slate-400">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
