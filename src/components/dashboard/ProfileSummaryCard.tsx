"use client";

import React from "react";
import Link from "next/link";
import { User, Calendar, MapPin, GraduationCap, Banknote, FileCheck, ArrowRight } from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { formatCurrency } from "@/lib/utils";

export function ProfileSummaryCard() {
  const { profileFields, profileStrength, stats, user } = useSevaSaarthi();

  // Extract key values from real user profile fields
  const name = profileFields.find((f) => f.field_name === "full_name")?.value || user?.name || "Citizen";
  const dob = profileFields.find((f) => f.field_name === "date_of_birth")?.value;
  const location = profileFields.find((f) => f.field_name === "location")?.value || "Not entered";
  const education = profileFields.find((f) => f.field_name === "education_degree")?.value || "Not entered";
  const rawIncome = profileFields.find((f) => f.field_name === "annual_income")?.value;
  const incomeFormatted = rawIncome ? `${formatCurrency(rawIncome)} / year` : "Not entered";

  // Calculate approximate age
  let ageDisplay = "Not set";
  if (dob) {
    try {
      const birthYear = new Date(dob).getFullYear();
      if (!isNaN(birthYear)) {
        ageDisplay = `${new Date().getFullYear() - birthYear} yrs`;
      }
    } catch {
      ageDisplay = "Not set";
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-6 shadow-xs flex flex-col justify-between w-full min-w-0">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2 className="text-base font-bold text-slate-900">Your Profile Summary</h2>
          <Link href="/profile" className="text-xs font-semibold text-indigo-600 hover:underline">
            Edit
          </Link>
        </div>

        {/* Profile Attributes List */}
        <div className="space-y-3 mb-6 w-full min-w-0">
          <div className="flex items-center justify-between gap-2 text-xs py-1 border-b border-slate-50 min-w-0">
            <div className="flex items-center gap-2.5 text-slate-500 font-medium shrink-0">
              <User className="w-4 h-4 text-slate-400" />
              <span>Name</span>
            </div>
            <span className="font-bold text-slate-800 truncate max-w-[130px] sm:max-w-[160px] text-right">{name}</span>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs py-1 border-b border-slate-50 min-w-0">
            <div className="flex items-center gap-2.5 text-slate-500 font-medium shrink-0">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Age</span>
            </div>
            <span className="font-bold text-slate-800 shrink-0">{ageDisplay}</span>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs py-1 border-b border-slate-50 min-w-0">
            <div className="flex items-center gap-2.5 text-slate-500 font-medium shrink-0">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>Location</span>
            </div>
            <span className="font-bold text-slate-800 truncate max-w-[130px] sm:max-w-[160px] text-right">{location}</span>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs py-1 border-b border-slate-50 min-w-0">
            <div className="flex items-center gap-2.5 text-slate-500 font-medium shrink-0">
              <GraduationCap className="w-4 h-4 text-slate-400" />
              <span>Education</span>
            </div>
            <span className="font-bold text-slate-800 truncate max-w-[130px] sm:max-w-[160px] text-right">{education}</span>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs py-1 border-b border-slate-50 min-w-0">
            <div className="flex items-center gap-2.5 text-slate-500 font-medium shrink-0">
              <Banknote className="w-4 h-4 text-slate-400" />
              <span>Income</span>
            </div>
            <span className="font-bold text-slate-800 shrink-0 text-right">{incomeFormatted}</span>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs py-1 min-w-0">
            <div className="flex items-center gap-2.5 text-slate-500 font-medium shrink-0">
              <FileCheck className="w-4 h-4 text-slate-400" />
              <span>Documents</span>
            </div>
            <span className="font-bold text-slate-800 shrink-0">{stats.verifiedDocuments} Verified</span>
          </div>
        </div>
      </div>

      {/* Bottom Alert / Strength Callout */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4">
        <div className="text-xs font-bold text-indigo-950 mb-2">
          {profileStrength === 100
            ? "Awesome! Your profile is 100% complete."
            : `Your profile is ${profileStrength}% complete.`}
        </div>
        <div className="w-full h-2 bg-indigo-200/70 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${profileStrength}%` }}
          />
        </div>
        <Link
          href="/profile"
          className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center justify-end gap-1 group"
        >
          <span>{profileStrength === 100 ? "View Details" : "Complete Details"}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
