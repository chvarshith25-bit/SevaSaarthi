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
  const { user, profileFields, profileStrength } = useSevaSaarthi();

  const getField = (name: string, fallback: string) => {
    const match = profileFields.find((f) => f.field_name === name);
    return match && match.value ? match.value : fallback;
  };

  const displayName = user?.name || "Chiluveri Varshith";
  const displayEmail = user?.email || "chiluverivarshithsahs@gmail.com";
  const displayPhone = getField("phone_number", user?.phone || "+91 98765 43210");
  const displayDob = getField("date_of_birth", "15 Aug 2003");
  const displayLocation = getField("location", getField("present_city", "Hyderabad, Telangana"));
  const displayEducation = getField("education_degree", "B.Tech (CSE)");

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const strength = profileStrength || 50;

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
        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center ring-2 ring-blue-50 shrink-0">
          {getInitials(displayName)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-900 truncate">
              {displayName}
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Verified</span>
            </span>
          </div>
          <div className="text-xs text-slate-500 truncate mt-0.5">
            {displayEmail}
          </div>
        </div>
      </div>

      {/* Metadata List */}
      <div className="space-y-2.5 pt-1 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Date of Birth</span>
          </div>
          <span className="font-semibold text-slate-800">{displayDob}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>Location</span>
          </div>
          <span className="font-semibold text-slate-800 truncate max-w-[170px]">{displayLocation}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <GraduationCap className="w-4 h-4 text-slate-400" />
            <span>Education</span>
          </div>
          <span className="font-semibold text-slate-800 truncate max-w-[170px]">{displayEducation}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <Phone className="w-4 h-4 text-slate-400" />
            <span>Phone</span>
          </div>
          <span className="font-semibold text-slate-800 font-mono">{displayPhone}</span>
        </div>
      </div>

      {/* Profile Completion Bar */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Profile Completion</span>
          <span className="font-bold text-blue-600">{strength}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(10, strength)}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400">
          {strength < 100
            ? "Add missing details to get better scheme recommendations."
            : "Your citizen profile is fully completed and verified."}
        </p>

        <Link
          href="/profile"
          className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs mt-2"
        >
          <span>{strength < 100 ? "Complete Profile" : "Manage Profile"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
