"use client";

import React from "react";
import Link from "next/link";
import { FileText, Smartphone, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function YourTasksList() {
  const tasks = [
    {
      id: "task_1",
      title: "Upload Bonafide Certificate",
      subtitle: "For Post-Matric Scholarship",
      icon: FileText,
      iconBg: "bg-rose-50 text-rose-600",
      priority: "High Priority",
      priorityBg: "bg-rose-50 text-rose-700 border-rose-200",
      href: "/vault",
    },
    {
      id: "task_2",
      title: "Verify your mobile number",
      subtitle: "For PAN Card Application",
      icon: Smartphone,
      iconBg: "bg-amber-50 text-amber-600",
      priority: "Medium Priority",
      priorityBg: "bg-amber-50 text-amber-700 border-amber-200",
      href: "/profile",
    },
    {
      id: "task_3",
      title: "Check application status",
      subtitle: "Housing Subsidy Scheme",
      icon: Clock,
      iconBg: "bg-blue-50 text-blue-600",
      priority: "Low Priority",
      priorityBg: "bg-blue-50 text-blue-700 border-blue-200",
      href: "/checklist",
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-6 shadow-xs w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900">Your Tasks</h2>
        <Link href="/tasks" className="text-xs font-semibold text-indigo-600 hover:underline">
          View all
        </Link>
      </div>

      {/* Task List */}
      <div className="space-y-3 w-full min-w-0">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <Link
              key={task.id}
              href={task.href}
              className="flex items-center justify-between p-3 sm:p-3.5 bg-slate-50/70 hover:bg-slate-100/80 border border-slate-100/90 rounded-2xl transition-all group min-w-0 gap-2.5"
            >
              {/* Left: Icon & Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={cn("w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0", task.iconBg)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {task.title}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{task.subtitle}</div>
                </div>
              </div>

              {/* Right: Priority Badge & Chevron */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-1 sm:ml-2">
                <span className={cn("text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap", task.priorityBg)}>
                  {task.priority}
                </span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
