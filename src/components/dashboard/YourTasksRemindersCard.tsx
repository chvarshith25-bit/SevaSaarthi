"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  Phone,
  FileCheck,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

export function YourTasksRemindersCard() {
  const tasks = [
    {
      id: "t1",
      title: "Upload Address Proof",
      subtitle: "Required for Housing Subsidy Scheme",
      dueBadge: "Due in 2 days",
      dueColor: "bg-rose-50 text-rose-700 border-rose-200",
      iconBg: "bg-rose-50 text-rose-600 border-rose-100",
      icon: FileText,
      href: "/vault",
    },
    {
      id: "t2",
      title: "Verify Mobile Number",
      subtitle: "Helps in faster processing",
      dueBadge: "Pending",
      dueColor: "bg-amber-50 text-amber-700 border-amber-200",
      iconBg: "bg-amber-50 text-amber-600 border-amber-100",
      icon: Phone,
      href: "/profile",
    },
    {
      id: "t3",
      title: "Sign Pending Consent",
      subtitle: "Required for PAN Application",
      dueBadge: "Pending",
      dueColor: "bg-blue-50 text-blue-700 border-blue-200",
      iconBg: "bg-blue-50 text-blue-600 border-blue-100",
      icon: FileCheck,
      href: "/applications/PAN-2026-0001/status",
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">Your Tasks & Reminders</h3>
        <Link
          href="/tasks"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2">
        {tasks.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.id}
              href={t.href}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/60 hover:bg-slate-50 border border-slate-200/70 transition-all group min-w-0 gap-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${t.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {t.title}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {t.subtitle}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${t.dueColor}`}>
                  {t.dueBadge}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
