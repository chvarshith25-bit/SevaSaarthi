"use client";

import React from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  Radio,
  GitPullRequest,
  Workflow,
  BarChart3,
  FolderGit2,
  Settings,
  ArrowRight,
  ShieldAlert,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { useGov } from "@/lib/store/gov-store";

export default function GovernmentAdminPage() {
  const { currentUser } = useGov();

  const isAdminUser =
    currentUser.role === "SYS_ADMIN" ||
    currentUser.role === "DEPT_ADMIN" ||
    (currentUser.role as any) === "ADMIN";

  // RBAC Enforcement: Normal officer cannot access administration modules
  if (!isAdminUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Access Restricted</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The Administration module is restricted to authorized Supervisors and System Administrators. Standard Department Officers must use the primary task workflow.
          </p>
          <div className="pt-2">
            <Link
              href="/government/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Return to Officer Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const adminModules = [
    {
      title: "System Overview",
      description: "Comprehensive health status of all system components, active microservices, and database connectors.",
      href: "/government/monitoring",
      icon: SlidersHorizontal,
      badge: "Operational",
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
    {
      title: "Interoperability",
      description: "Manage sovereign connectors, gateway health, mock circuits, and live telemetry for UIDAI, NSDL, and DigiLocker.",
      href: "/government/interoperability",
      icon: Radio,
      badge: "6 Active Gateways",
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
    {
      title: "Data Mapping",
      description: "Inspect schema translations, transformation rules, and cross-registry field standardizations.",
      href: "/government/data-mapper",
      icon: GitPullRequest,
      badge: "42 Canonical Fields",
      badgeColor: "bg-blue-100 text-blue-800",
    },
    {
      title: "Workflow Configuration",
      description: "View department workflow definitions, state machine rules, and transition constraints.",
      href: "/government/workflows",
      icon: Workflow,
      badge: "17 Services",
      badgeColor: "bg-indigo-100 text-indigo-800",
    },
    {
      title: "Reports & SLA",
      description: "Analyze service throughput, officer adjudication latency, backlog distribution, and SLA countdowns.",
      href: "/government/monitoring",
      icon: BarChart3,
      badge: "Analytics",
      badgeColor: "bg-purple-100 text-purple-800",
    },
    {
      title: "Department Configuration",
      description: "Configure jurisdictional boundaries, office allocations, officer staff assignments, and capacity quotas.",
      href: "/government/settings?tab=resources",
      icon: FolderGit2,
      badge: "Jurisdiction",
      badgeColor: "bg-slate-100 text-slate-800",
    },
    {
      title: "Security & Settings",
      description: "Manage DPDP statutory consent policy rules, audit retention intervals, and cryptographic key parameters.",
      href: "/government/settings",
      icon: Settings,
      badge: "Governance",
      badgeColor: "bg-amber-100 text-amber-900",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 text-xs font-semibold mb-1.5 border border-indigo-200/60">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span>SARKAR SEVA • Administration</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Administration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure connectors, canonical data mappings, statutory workflows, and service SLA policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold">
            Role: {currentUser.role}
          </span>
        </div>
      </div>

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {adminModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.title}
              href={mod.href}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${mod.badgeColor}`}>
                    {mod.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {mod.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-800">
                <span>Open Module</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
