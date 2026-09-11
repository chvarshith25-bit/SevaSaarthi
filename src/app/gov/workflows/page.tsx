"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Workflow,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Building,
  RotateCcw,
  Zap,
  ArrowDown,
  Layers,
  FileText,
  CreditCard,
  Truck,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useGov } from "@/lib/store/gov-store";

export default function WorkflowsPage() {
  const { applications, exceptions, stats, isLoading } = useGov();
  const [selectedNode, setSelectedNode] = useState<string>("OFFICER_REVIEW");

  const workflowSteps = [
    {
      id: "VALIDATION",
      title: "1. Intake & Validation",
      stage: "VALIDATING",
      description: "Pre-flight syntax validation, duplicate check, and schema normalization.",
      count: stats.newApps,
      status: "ACTIVE",
      type: "AUTOMATED",
      sla: "10 seconds",
      policy: "Canonical mapping via Data Mapper rules (dateOfBirth, fullName, phoneNumber).",
    },
    {
      id: "CONSENT",
      title: "2. Consent & DPDP Check",
      stage: "CONSENT",
      description: "Digital Personal Data Protection Act 2023 compliance and consent artifact cryptographic logging.",
      count: 125,
      status: "ACTIVE",
      type: "SECURITY",
      sla: "Instantaneous",
      policy: "Section 6 DPDP Act: Free, specific, informed, unconditional, and unambiguous consent token required.",
    },
    {
      id: "VERIFICATION",
      title: "3. Multi-Registry Verification",
      stage: "VERIFICATION_IN_PROGRESS",
      description: "Cross-system identity verification across UIDAI e-KYC, DigiLocker, and CBDT Core.",
      count: stats.verificationPending,
      status: "ACTIVE",
      type: "CONNECTOR",
      sla: "15 seconds",
      policy: "100% Verhoeff checksum & demographic match score verification.",
      branches: [
        { label: "Verified (100% Match)", to: "ROUTING", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
        { label: "Conflict Flagged", to: "EXCEPTIONS", color: "text-rose-600 bg-rose-50 border-rose-200" },
        { label: "Gateway Timeout (504)", to: "RETRY", color: "text-blue-600 bg-blue-50 border-blue-200" },
      ],
    },
    {
      id: "ROUTING",
      title: "4. Jurisdiction Routing",
      stage: "OFFICER_ASSIGNED",
      description: "Intelligent geographic and workload-aware assignment to authorized regional cell officer.",
      count: 40,
      status: "ACTIVE",
      type: "AUTOMATED",
      sla: "1 minute",
      policy: "Workload distribution assigned to Regional Processing Cell, Hyderabad.",
    },
    {
      id: "OFFICER_REVIEW",
      title: "5. Human Statutory Review",
      stage: "OFFICER_REVIEW",
      description: "Authorized officer adjudication of application evidence, AI synthesis, and biometric checks.",
      count: stats.officerReview,
      status: "ATTENTION_REQUIRED",
      type: "HUMAN_OFFICER",
      sla: "4 hours (SLA Strict)",
      policy: "Product Rule 1: AI cannot approve or reject. Final determination rests solely with the statutory officer.",
      branches: [
        { label: "Accept / Approved", to: "PAN_GEN", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
        { label: "Return for Correction", to: "CORRECTION", color: "text-amber-600 bg-amber-50 border-amber-200" },
        { label: "Statutory Rejection", to: "REJECT", color: "text-rose-600 bg-rose-50 border-rose-200" },
      ],
    },
    {
      id: "PAN_GEN",
      title: "6. Outcome & Issuance",
      stage: "APPROVED",
      description: "Cryptographic 10-digit PAN generation, e-PAN PDF issuance, and state machine commit.",
      count: stats.approved,
      status: "COMPLETED",
      type: "CORE_GATEWAY",
      sla: "Instantaneous",
      policy: "Section 139A Income Tax Act compliance token generated and citizen notified.",
    },
    {
      id: "LOGISTICS",
      title: "7. Physical PVC Fulfillment",
      stage: "DELIVERED",
      description: "Secure printing at India Security Press, Nashik and Speed Post dispatch via India Post.",
      count: 982,
      status: "ACTIVE",
      type: "POST_PROCESSING",
      sla: "3 business days",
      policy: "Barcoded consignment trackable end-to-end via Department of Posts integration.",
    },
  ];

  const activeStep = workflowSteps.find((s) => s.id === selectedNode) || workflowSteps[4];
  const matchingApps = applications.filter((app) => {
    if (selectedNode === "OFFICER_REVIEW") {
      return app.stage === "OFFICER_REVIEW" || app.stage === "OFFICER_ASSIGNED";
    }
    if (selectedNode === "VERIFICATION") {
      return app.stage === "VERIFICATION_IN_PROGRESS";
    }
    if (selectedNode === "VALIDATION") {
      return app.stage === "SUBMITTED" || app.stage === "VALIDATING";
    }
    if (selectedNode === "PAN_GEN" || selectedNode === "LOGISTICS") {
      return app.stage === "APPROVED" || app.stage === "PAN_GENERATION" || app.stage === "CARD_PRINTING" || app.stage === "DISPATCHED" || app.stage === "DELIVERED";
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <Workflow className="w-3.5 h-3.5" />
            <span>Workflow Orchestration Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            WORKFLOW ARCHITECTURE & PIPELINE GRAPH
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time state machine execution graph mapped directly to backend applications, state transitions, and statutory policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-500">Live Active Pipeline</div>
            <div className="text-lg font-black text-blue-600">{stats.total} Total Cases</div>
          </div>
          <Link
            href="/applications"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>Open Application Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Graph & Detail Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Interactive Pipeline Graph (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Workflow className="w-4 h-4 text-blue-600" />
                <span>Statutory Workflow Execution Chain</span>
              </h2>
              <span className="text-[11px] font-semibold text-slate-500">
                Click any node to inspect execution telemetry
              </span>
            </div>

            {/* Nodes Stack */}
            <div className="space-y-3 relative">
              {workflowSteps.map((step, idx) => {
                const isSelected = selectedNode === step.id;
                return (
                  <div key={step.id} className="relative">
                    <button
                      onClick={() => setSelectedNode(step.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-400 shadow-sm ring-2 ring-blue-500/20"
                          : "bg-slate-50/70 hover:bg-slate-100/70 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-white text-slate-700 border border-slate-200"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{step.title}</span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                step.type === "HUMAN_OFFICER"
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : step.type === "SECURITY"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-slate-200/80 text-slate-700"
                              }`}
                            >
                              {step.type}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {step.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-900 font-mono">
                            {step.count}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">applications</div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isSelected ? "text-blue-600 translate-x-1" : "text-slate-400"
                          }`}
                        />
                      </div>
                    </button>

                    {/* Step Branches Pill Display */}
                    {step.branches && (
                      <div className="pl-12 pr-4 py-2 flex flex-wrap gap-2">
                        {step.branches.map((branch) => (
                          <div
                            key={branch.label}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${branch.color}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{branch.label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Connector Arrow */}
                    {idx < workflowSteps.length - 1 && (
                      <div className="flex justify-center py-1">
                        <ArrowDown className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Step Inspection Telemetry (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Step Detail & Constraints
                </span>
                <h3 className="text-base font-bold text-slate-900">{activeStep.title}</h3>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                Stage: {activeStep.stage}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="font-bold text-slate-700">Operational Purpose</div>
                <p className="text-slate-600 leading-relaxed">{activeStep.description}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="font-bold text-slate-700">Statutory Policy & Product Rules</div>
                <p className="text-slate-600 leading-relaxed font-medium">{activeStep.policy}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">SLA Target</div>
                  <div className="font-bold text-slate-900 mt-0.5">{activeStep.sla}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Active In State</div>
                  <div className="font-bold text-blue-600 font-mono mt-0.5">{activeStep.count} cases</div>
                </div>
              </div>
            </div>

            {/* Applications currently in this state */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">Cases at this Stage</span>
                <span className="text-[11px] text-slate-500">{matchingApps.length} cases</span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {matchingApps.slice(0, 5).map((app) => (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 rounded-xl transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700 text-xs">{app.id}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            app.status === "ACTION_REQUIRED"
                              ? "bg-rose-100 text-rose-800"
                              : app.status === "VERIFICATION_CONFLICT"
                              ? "bg-rose-100 text-rose-800"
                              : app.status === "RETURNED_FOR_CORRECTION"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {app.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-1">{app.applicantName}</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                      <span>Open</span>
                      <span>→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
