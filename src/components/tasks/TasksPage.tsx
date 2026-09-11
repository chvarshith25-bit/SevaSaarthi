"use client";

import React from "react";
import Link from "next/link";
import { ListTodo, CheckCircle2, FileText, Smartphone, Clock, AlertTriangle, ArrowRight, UploadCloud } from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { cn } from "@/lib/utils";

export function TasksPage() {
  const { checklistSummary } = useSevaSaarthi();

  const missingRequirements = checklistSummary.items.filter((i) => i.status === "MISSING");

  const staticTasks = [
    {
      id: "task_mobile",
      title: "Verify your mobile number with Aadhaar OTP",
      category: "Identity Verification",
      priority: "Medium Priority",
      priorityBg: "bg-amber-50 text-amber-700 border-amber-200",
      description: "Ensure your mobile number is active on UIDAI portal to receive one-time passwords for e-KYC authentication.",
      actionText: "Verify Mobile",
      href: "/profile",
    },
    {
      id: "task_bank_dbt",
      title: "Check Aadhaar DBT Seeding on NPCI Portal",
      category: "Direct Benefit Transfer",
      priority: "Medium Priority",
      priorityBg: "bg-amber-50 text-amber-700 border-amber-200",
      description: "Direct scholarship funds will be credited to the bank account linked with NPCI mapper.",
      actionText: "View Bank Details",
      href: "/profile",
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ListTodo className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Tasks & Reminders</h1>
          </div>
          <p className="text-xs text-slate-500">
            Action items to complete your readiness checklist for target government schemes.
          </p>
        </div>
      </div>

      {/* Priority Tasks from Missing Requirements */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>High Priority: Missing Scheme Requirements ({missingRequirements.length})</span>
        </h2>

        {missingRequirements.length === 0 ? (
          <div className="p-8 text-center bg-emerald-50/50 border border-emerald-100 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-emerald-900">All scheme requirements are satisfied!</h3>
            <p className="text-xs text-emerald-700 mt-0.5">You have zero pending missing document tasks.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {missingRequirements.map((item) => (
              <div
                key={item.requirement.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-rose-50/20 border border-rose-200/80 rounded-2xl"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 bg-rose-100 text-rose-800 rounded-md">
                      High Priority
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Upload {item.requirement.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                    {item.requirement.guidance_text}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <Link
                    href="/vault"
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload to Vault</span>
                  </Link>
                  <Link
                    href="/checklist"
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Checklist
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Routine & Platform Tasks */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Other Helpful Tasks</h2>
        <div className="space-y-3">
          {staticTasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50/70 border border-slate-100 rounded-2xl"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-[10px] font-bold px-2 py-0.2 rounded-md border", task.priorityBg)}>
                    {task.priority}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{task.title}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xl">{task.description}</p>
              </div>

              <Link
                href={task.href}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 self-end sm:self-auto transition-colors"
              >
                <span>{task.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
