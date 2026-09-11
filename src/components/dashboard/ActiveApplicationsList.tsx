"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, CreditCard, Home, ChevronRight, ArrowRight, Loader2 } from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";

export function ActiveApplicationsList() {
  const { checklistSummary } = useSevaSaarthi();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchApps() {
      try {
        const res = await fetch("/api/applications");
        const data = await res.json();
        if (data.success) {
          setApplications(data.applications);
        }
      } catch (err) {
        console.error("Failed to fetch active applications:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchApps();
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-6 shadow-xs w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h2 className="text-base font-bold text-slate-900">Active Applications</h2>
        <Link href="/checklist" className="text-xs font-semibold text-indigo-600 hover:underline">
          View all
        </Link>
      </div>

      {/* Applications List */}
      <div className="space-y-3 mb-5 w-full min-w-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No active applications found.
          </div>
        ) : (
          applications.map((app) => {
            // Map DB fields to UI layout
            const title = app.service_name || "Government Service";
            const appId = app.application_number || app.id;
            const href = `/applications/${appId}/status`;
            const statusText = app.status === "SUBMITTED" ? "In Progress" :
                               app.status === "APPROVED" ? "Approved" :
                               app.status === "RETURNED_FOR_CORRECTION" ? "Correction Needed" :
                               app.status === "REJECTED" ? "Rejected" : app.status;

            // Simple icon mapping based on service name
            let icon = Home;
            let iconBg = "bg-slate-50 text-slate-600";
            if (title.toLowerCase().includes("pan")) {
              icon = CreditCard;
              iconBg = "bg-indigo-50 text-indigo-600";
            } else if (title.toLowerCase().includes("scholarship")) {
              icon = GraduationCap;
              iconBg = "bg-emerald-50 text-emerald-600";
            }

            const Icon = icon;
            return (
              <Link
                key={app.id}
                href={href}
                className="flex items-center justify-between p-3 sm:p-3.5 bg-slate-50/70 hover:bg-slate-100/80 border border-slate-100/90 rounded-2xl transition-all group min-w-0 gap-3"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {title}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate">
                      Application ID: {appId}
                    </div>
                  </div>
                </div>

                {/* Right: Status & Chevron */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 shrink-0">
                  <span className="hidden min-[380px]:inline">{statusText}</span>
                  <span className="inline min-[380px]:hidden text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">{app.status}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Bottom Full Width Action */}
      <Link
        href="/checklist"
        className="w-full py-2.5 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-700 flex items-center justify-center gap-2 transition-all"
      >
        <span>View all active applications</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
