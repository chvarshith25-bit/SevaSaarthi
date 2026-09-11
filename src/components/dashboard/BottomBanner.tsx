"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export function BottomBanner() {
  return (
    <div className="bg-gradient-to-r from-indigo-50/90 via-blue-50/80 to-purple-50/90 border border-indigo-100 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full min-w-0">
      {/* Left Icon & Text */}
      <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Let Seva Saarthi work for you!</h3>
          <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
            We&apos;ll read official portals, prepare your application, and guide you at every step.
          </p>
        </div>
      </div>

      {/* Right Button */}
      <Link
        href="/discover"
        className="w-full sm:w-auto shrink-0 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-200 flex items-center justify-center gap-2 transition-all hover:scale-102 min-h-[40px]"
      >
        <span>Explore Services</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
