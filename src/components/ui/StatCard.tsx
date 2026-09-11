"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface StatCardProps {
  title: string;
  count: number | string;
  icon: React.ElementType;
  href: string;
  iconBgColor: string;
  iconColor: string;
}

export function StatCard({
  title,
  count,
  icon: Icon,
  href,
  iconBgColor,
  iconColor,
}: StatCardProps) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-xs hover:shadow-md hover:border-slate-200 transition-all flex items-center justify-between group min-w-0"
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <div
          className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
            iconBgColor,
            iconColor
          )}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">
            {title}
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{count}</div>
        </div>
      </div>
      <div className="hidden sm:block text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2">
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
}
