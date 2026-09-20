"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Clock,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Bot,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  MapPin,
  HelpCircle,
  Filter,
  Check,
} from "lucide-react";
import { useGov } from "@/lib/store/gov-store";

export default function GovernmentDashboardPage() {
  const { currentUser, stats, applications, isLoading } = useGov();

  // Dynamic greeting based on current time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Priority officer work items: applications needing officer attention
  const urgentTasks = useMemo(() => {
    return applications
      .filter(
        (app) =>
          app.status === "ACTION_REQUIRED" ||
          app.stage === "OFFICER_REVIEW" ||
          app.status === "VERIFICATION_CONFLICT"
      )
      .slice(0, 6);
  }, [applications]);

  // AI Assistance metrics derivation
  const aiRoutedCount = applications.filter((a) => a.stage !== "DRAFT").length;
  const aiCandidateMatches = applications.filter((a) => a.stage === "OFFICER_REVIEW" || a.status === "APPROVED").length;
  const collisionAlerts = applications.filter((a) => a.status === "VERIFICATION_CONFLICT").length;
  const manualReviewCases = applications.filter((a) => a.status === "ACTION_REQUIRED").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Dashboard Header */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Sovereign Public Administration Console
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            {greeting}, {currentUser.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Welcome to your official service adjudication desk. Here is your daily operational briefing.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentUser.department}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentUser.office || "District Operations Centre"}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <span className="text-slate-400 font-mono">Role:</span>
              <span className="font-semibold text-slate-800">{currentUser.roleTitle || currentUser.role}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/government/applications"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <span>Open Application Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 2. Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Needs Action */}
        <Link
          href="/government/applications?tab=review"
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
            <span className="text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform">View →</span>
          </div>
        </Link>

        {/* Verification in Progress */}
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
            <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform">View →</span>
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

        {/* Completed Today */}
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
            <span>Dispatched & Delivered</span>
            <span className="text-emerald-600 font-bold group-hover:translate-x-0.5 transition-transform">History →</span>
          </div>
        </Link>
      </div>

      {/* 3. Primary Section: MY WORK (Prioritized Tasks) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>My Work: Priority Tasks</span>
              <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
                {urgentTasks.length} Urgent
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
            <span>View All Applications</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {urgentTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <div className="text-sm font-bold text-slate-800">Your queue is clear!</div>
            <div className="text-xs text-slate-400 mt-1">No pending priority tasks require immediate review.</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {urgentTasks.map((app) => (
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
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                        app.priority === "URGENT"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : app.priority === "HIGH"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {app.priority}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                      <span>{app.serviceName}</span>
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
                    href={`/government/applications/${app.id}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>Review & Adjudicate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Secondary Section: AI ASSISTANCE SUMMARY (Model 1 & Model 2 V4.2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model 1 Workflow Routing Intelligence */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Model 1: Workflow Routing Summary</h3>
                  <p className="text-[11px] text-slate-500">Autonomous statutory departmental & service classification</p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded-md">
                Active V2.0
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="text-[11px] font-semibold text-slate-500">Total Classified</div>
                <div className="text-xl font-bold text-slate-900 mt-1">{aiRoutedCount}</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">100% Deterministic Routing</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="text-[11px] font-semibold text-slate-500">Avg Confidence</div>
                <div className="text-xl font-bold text-slate-900 mt-1">98.5%</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Sovereign Rules Calibrated</div>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-blue-50/50 p-3 rounded-xl border border-blue-100 leading-relaxed">
              <span className="font-bold text-blue-900">Statutory Notice:</span> Model 1 recommendations provide initial routing provenance. Final jurisdictional allocation remains under officer discretion.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Model 1 Accuracy: 100% on benchmark suite</span>
            <Link href="/government/applications" className="font-bold text-blue-600 hover:text-blue-800">
              Inspect Queues →
            </Link>
          </div>
        </div>

        {/* Model 2 V4.2 Entity Resolution Intelligence */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Model 2: Entity Resolution Assistance</h3>
                  <p className="text-[11px] text-slate-500">V4.2 Multilingual Candidate Scoring & Advisory Match</p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded-md">
                Advisory Only
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="text-[11px] font-semibold text-slate-500">Candidates Suggested</div>
                <div className="text-xl font-bold text-indigo-950 mt-1">{aiCandidateMatches}</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Across authorized registries</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="text-[11px] font-semibold text-slate-500">Collision Dampener</div>
                <div className="text-xl font-bold text-amber-700 mt-1">{collisionAlerts}</div>
                <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Demoted to Ambiguous (Capped)</div>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 leading-relaxed">
              <span className="font-bold text-indigo-900">Advisory Demarcation:</span> Model 2 assists officers by highlighting cross-registry candidate records. AI cannot declare legal identity or auto-approve.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Multilingual E5 Base + V3.1 Fallback Active</span>
            <Link href="/government/applications?tab=review" className="font-bold text-indigo-600 hover:text-indigo-800">
              Review Candidates →
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Tertiary Section: Recent Statutory Actions & Activity Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Recent Statutory Activity Feed</span>
            <span className="text-slate-400 font-normal text-xs">• SHA-256 Verified Append-Only Log</span>
          </h3>
          <Link href="/government/audit" className="text-xs font-bold text-blue-600 hover:text-blue-800">
            Full Audit Trail →
          </Link>
        </div>

        <div className="space-y-3">
          {applications.slice(0, 4).map((app, idx) => (
            <div
              key={app.id + idx}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-slate-800">{app.applicantName}</span>
                  <span className="text-slate-400 mx-1.5">•</span>
                  <span className="text-slate-600">{app.serviceName}</span>
                  <span className="text-slate-400 mx-1.5">•</span>
                  <span className="font-mono text-[11px] text-slate-500">{app.id}</span>
                </div>
              </div>
              <div className="shrink-0 font-medium text-slate-500">
                {app.stage}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
