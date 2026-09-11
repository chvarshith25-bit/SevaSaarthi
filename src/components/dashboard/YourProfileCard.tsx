"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  GraduationCap,
  Phone,
  ArrowRight,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";

export function YourProfileCard() {
  const { user } = useSevaSaarthi();

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">Your Profile</h3>
        <Link
          href="/profile"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
        >
          <span>View Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* User Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center ring-2 ring-slate-100 shrink-0">
          SS
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-900 truncate">
              {user?.name || "Sai Sankeerth"}
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Verified</span>
            </span>
          </div>
          <div className="text-xs text-slate-500 truncate mt-0.5">
            {user?.email || "sankeerths615@gmail.com"}
          </div>
        </div>
      </div>

      {/* Metadata List matching Image 2 */}
      <div className="space-y-2.5 pt-1 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Date of Birth</span>
          </div>
          <span className="font-semibold text-slate-800">05 Aug 2002</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>Location</span>
          </div>
          <span className="font-semibold text-slate-800">Hyderabad, Telangana</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <GraduationCap className="w-4 h-4 text-slate-400" />
            <span>Education</span>
          </div>
          <span className="font-semibold text-slate-800">B.Tech (CSE)</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <Phone className="w-4 h-4 text-slate-400" />
            <span>Phone</span>
          </div>
          <span className="font-semibold text-slate-800 font-mono">+91 98765 43210</span>
        </div>
      </div>

      {/* Profile Completion Bar */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Profile Completion</span>
          <span className="font-bold text-blue-600">50%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full w-1/2 transition-all duration-500" />
        </div>
        <p className="text-[11px] text-slate-400">
          Add missing details to get better recommendations.
        </p>

        <Link
          href="/profile"
          className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs mt-2"
        >
          <span>Complete Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
