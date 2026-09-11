"use client";

import React from "react";
import Link from "next/link";
import { Headphones, ArrowRight } from "lucide-react";

export function NeedHelpCard() {
  return (
    <div className="bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-sky-50/50 rounded-3xl border border-blue-100/90 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
          <Headphones className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
            Need Help?
          </h4>
          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
            Get support or chat with Saarthi AI for instant guidance.
          </p>
        </div>
      </div>

      <Link
        href="/help"
        className="px-3.5 py-2 bg-white hover:bg-slate-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 shadow-2xs transition-all shrink-0 flex items-center gap-1"
      >
        <span>Get Help</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
