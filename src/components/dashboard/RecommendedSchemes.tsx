"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, Home, Wallet, CreditCard, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { ApplyPanModal } from "./ApplyPanModal";

export function RecommendedSchemes() {
  const { checklistSummary } = useSevaSaarthi();
  const [isPanModalOpen, setIsPanModalOpen] = React.useState(false);

  const schemes = [
    {
      id: "s001",
      title: "Post-Matric Scholarship",
      icon: GraduationCap,
      iconBg: "bg-indigo-50 text-indigo-600",
      matchRate: `${checklistSummary.percentageComplete}% Match`,
      matchBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "You appear eligible based on your profile.",
      docStatus: checklistSummary.missingCount > 0 ? `${checklistSummary.missingCount} documents needed` : "All documents satisfied",
      docStatusColor: checklistSummary.missingCount > 0 ? "text-amber-600" : "text-emerald-600 font-semibold",
      buttonText: "Apply Now",
      buttonStyle: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-100",
      href: "/checklist",
    },
    {
      id: "s002",
      title: "Housing Subsidy Scheme",
      icon: Home,
      iconBg: "bg-emerald-50 text-emerald-600",
      matchRate: "87% Match",
      matchBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "Possible eligibility based on your profile.",
      docStatus: "3 documents needed",
      docStatusColor: "text-amber-600",
      buttonText: "View Details",
      buttonStyle: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
      href: "/checklist",
    },
    {
      id: "s003",
      title: "Student Support Scheme",
      icon: Wallet,
      iconBg: "bg-amber-50 text-amber-600",
      matchRate: "90% Match",
      matchBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "High match with your information.",
      docStatus: "1 document needed",
      docStatusColor: "text-amber-600",
      buttonText: "Apply Now",
      buttonStyle: "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-100",
      href: "/checklist",
    },
    {
      id: "s004",
      title: "PAN Card Application",
      icon: CreditCard,
      iconBg: "bg-blue-50 text-blue-600",
      matchRate: "91% Ready",
      matchBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "You are almost ready to apply.",
      docStatus: "Ready to apply",
      docStatusColor: "text-emerald-600 font-semibold",
      buttonText: "Continue",
      buttonStyle: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-100",
      href: "/checklist",
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-6 shadow-xs relative w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h2 className="text-base font-bold text-slate-900">Recommended for You</h2>
        <Link href="/discover" className="text-xs font-semibold text-indigo-600 hover:underline">
          View all
        </Link>
      </div>

      {/* Grid of Schemes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative w-full min-w-0">
        {schemes.map((scheme) => {
          const Icon = scheme.icon;
          return (
            <div
              key={scheme.id}
              className="bg-white rounded-2xl border border-slate-100/90 p-4 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between w-full min-w-0"
            >
              <div className="min-w-0">
                {/* Top icon and Match rate */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={cn("w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0", scheme.iconBg)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={cn("text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap", scheme.matchBg)}>
                    {scheme.matchRate}
                  </span>
                </div>

                {/* Title and Description */}
                <h3 className="font-bold text-sm text-slate-900 leading-snug mb-1.5 [overflow-wrap:anywhere] break-normal min-w-0">
                  {scheme.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3 [overflow-wrap:anywhere] break-normal min-w-0">
                  {scheme.description}
                </p>
              </div>

              {/* Status and Action */}
              <div className="pt-2 border-t border-slate-50 min-w-0">
                <div className={cn("text-xs font-medium mb-3 min-w-0 truncate", scheme.docStatusColor)}>
                  {scheme.docStatus}
                </div>
                {scheme.id === "s004" ? (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setIsPanModalOpen(true)}
                      className={cn(
                        "w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-center block transition-colors min-h-[38px] flex items-center justify-center",
                        scheme.buttonStyle
                      )}
                    >
                      {scheme.buttonText}
                    </button>
                    <Link
                      href="/applications/PAN-2026-0001/status"
                      className="text-[11px] font-semibold text-indigo-600 hover:underline text-center block"
                    >
                      Track Live (PAN-0001) →
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={scheme.href}
                    className={cn(
                      "w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-center block transition-colors min-h-[38px] flex items-center justify-center",
                      scheme.buttonStyle
                    )}
                  >
                    {scheme.buttonText}
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {/* Carousel Arrow Button (Right) */}
        <Link
          href="/discover"
          className="hidden xl:flex absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center text-slate-600 hover:text-indigo-600 hover:scale-110 transition-all z-10"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <ApplyPanModal
        isOpen={isPanModalOpen}
        onClose={() => setIsPanModalOpen(false)}
      />
    </div>
  );
}
