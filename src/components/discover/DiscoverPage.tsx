"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Compass,
  GraduationCap,
  Home,
  HeartPulse,
  Wrench,
  ExternalLink,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  ArrowRight,
  ShieldCheck,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  BookOpen,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { cn } from "@/lib/utils";
import {
  REAL_GOVERNMENT_SCHEMES,
  evaluateSchemeEligibility,
  GovernmentScheme,
  SchemeMatchResult,
} from "@/lib/schemes/schemes-data";

export function DiscoverPage() {
  const { user, profileFields, checklistSummary } = useSevaSaarthi();
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [selectedSchemeForDetails, setSelectedSchemeForDetails] = useState<SchemeMatchResult | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Evaluate each scheme against the logged-in user's profile
  const schemeMatches: SchemeMatchResult[] = useMemo(() => {
    return REAL_GOVERNMENT_SCHEMES.map((scheme) =>
      evaluateSchemeEligibility(scheme, profileFields, user?.name)
    );
  }, [profileFields, user]);

  // Extract key citizen profile values to show personalized banner
  const userIncome = profileFields.find((f) => f.field_name === "annual_income")?.value || "1,80,000";
  const userDegree = profileFields.find((f) => f.field_name === "education_degree")?.value || "B.Tech Computer Science";
  const userCollege = profileFields.find((f) => f.field_name === "college_name")?.value || "Vidya Jyothi Institute of Technology";
  const userCategory = profileFields.find((f) => f.field_name === "caste_category")?.value || "OBC";

  const categories = [
    "ALL",
    "Higher Education & Scholarships",
    "Skill & Employment",
    "Healthcare & Social Security",
    "Housing & Urban Affairs",
  ];

  const filteredSchemes = useMemo(() => {
    return schemeMatches.filter((item) => {
      if (onlyEligible && !item.isEligible) return false;
      if (selectedCategory !== "ALL" && item.scheme.category !== selectedCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.scheme.title.toLowerCase().includes(q) ||
          item.scheme.description.toLowerCase().includes(q) ||
          item.scheme.ministry.toLowerCase().includes(q) ||
          item.scheme.portalDomain.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [schemeMatches, selectedCategory, search, onlyEligible]);

  const eligibleCount = schemeMatches.filter((s) => s.isEligible).length;

  const getCategoryIcon = (iconType: GovernmentScheme["iconType"]) => {
    switch (iconType) {
      case "GRADUATION":
        return { icon: GraduationCap, bg: "bg-indigo-50 text-indigo-600 border-indigo-100" };
      case "HEALTH":
        return { icon: HeartPulse, bg: "bg-rose-50 text-rose-600 border-rose-100" };
      case "HOME":
        return { icon: Home, bg: "bg-emerald-50 text-emerald-600 border-emerald-100" };
      case "SKILL":
        return { icon: Wrench, bg: "bg-amber-50 text-amber-600 border-amber-100" };
      default:
        return { icon: Compass, bg: "bg-blue-50 text-blue-600 border-blue-100" };
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/60 shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900">Government Schemes & Eligibility Matcher</h1>
          </div>
          <p className="text-xs text-slate-500">
            Real official Indian government schemes matched automatically against your verified citizen profile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="py-2 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span>Edit Profile Data</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
          </Link>
        </div>
      </div>

      {/* 🎯 Citizen Profile Matching Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 sm:p-6 border border-indigo-500/30 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Live Citizen Matching Active
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-400/30">
                {eligibleCount} Official Schemes Matched
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-white">
              Schemes Curated for {user?.name || "Sai"} ({userCategory} Category)
            </h2>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Based on your enrolled course (<strong>{userDegree}</strong> at <strong>{userCollege}</strong>) and certified family income (<strong>₹{userIncome}</strong>), you are eligible to claim full fee reimbursement and national grants.
            </p>

            {/* Profile Attributes Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-semibold bg-white/10 px-2.5 py-1 rounded-lg text-slate-200 border border-white/10">
                Income: ₹{userIncome} / yr
              </span>
              <span className="text-[10px] font-semibold bg-white/10 px-2.5 py-1 rounded-lg text-slate-200 border border-white/10">
                Category: {userCategory}
              </span>
              <span className="text-[10px] font-semibold bg-white/10 px-2.5 py-1 rounded-lg text-slate-200 border border-white/10">
                Course: {userDegree}
              </span>
              <span className="text-[10px] font-semibold bg-white/10 px-2.5 py-1 rounded-lg text-slate-200 border border-white/10">
                College: {userCollege}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={() => setOnlyEligible((prev) => !prev)}
              className={cn(
                "py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm",
                onlyEligible
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{onlyEligible ? "Showing Matched Only" : "Filter Matched Schemes Only"}</span>
            </button>

            <Link
              href="/checklist"
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>Application Readiness ({checklistSummary.percentageComplete}%)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Category Pills & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              {cat === "ALL" ? "All Schemes" : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by scheme name or ministry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Grid of Real Government Schemes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSchemes.map((match) => {
          const scheme = match.scheme;
          const { icon: Icon, bg: iconBg } = getCategoryIcon(scheme.iconType);
          const isExpanded = expandedMatchId === scheme.id;

          return (
            <div
              key={scheme.id}
              className={`bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                match.isEligible
                  ? "border-slate-200 hover:border-indigo-300"
                  : "border-slate-200/60 opacity-90"
              }`}
            >
              <div className="p-5 sm:p-6">
                {/* Header: Icon & Eligibility Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border", iconBg)}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <span
                    className={cn(
                      "text-[11px] font-bold px-3 py-1 rounded-full border shadow-2xs text-right shrink-0",
                      match.matchStatus === "HIGHLY_ELIGIBLE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : match.matchStatus === "ELIGIBLE"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : match.matchStatus === "CRITERIA_CHECK_REQUIRED"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    )}
                  >
                    {match.matchBadge}
                  </span>
                </div>

                {/* Ministry & Scheme Title */}
                <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1 line-clamp-1">
                  {scheme.ministry}
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2">
                  {scheme.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
                  {scheme.description}
                </p>

                {/* Benefit Amount Card */}
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 mb-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Scheme Grant & Benefit:
                  </div>
                  <div className="text-xs font-bold text-emerald-900 mt-0.5">
                    {scheme.benefitAmount}
                  </div>
                </div>

                {/* Documents Summary */}
                <div className="bg-slate-50 rounded-xl p-3 mb-3.5 text-[11px] text-slate-600">
                  <span className="font-bold text-slate-800">Required: </span>
                  {scheme.docRequirementSummary}
                </div>

                {/* Match Breakdown Toggle */}
                <button
                  onClick={() => setExpandedMatchId(isExpanded ? null : scheme.id)}
                  className="w-full text-left py-2 px-3 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/70 rounded-xl text-[11px] font-semibold text-indigo-800 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Why You Match ({match.matchReasons.length} Criteria)</span>
                  </span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && (
                  <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-[11px] space-y-1.5 animate-in fade-in">
                    {match.matchReasons.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                    {match.actionNeeded && (
                      <div className="pt-1.5 text-[10px] text-amber-700 font-semibold border-t border-slate-200/60 flex items-start gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                        <span>{match.actionNeeded}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 flex items-center gap-2 mt-auto">
                <button
                  onClick={() => setSelectedSchemeForDetails(match)}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold text-center shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>View Official Process</span>
                </button>

                <a
                  href={scheme.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl transition-colors shrink-0 flex items-center gap-1 text-xs font-semibold"
                  title={`Open official portal: ${scheme.portalDomain}`}
                >
                  <span className="hidden sm:inline text-[11px] font-bold">{scheme.portalDomain}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Government Scheme Details & 5-Step Process Modal */}
      {selectedSchemeForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[92vh] flex flex-col">
            {/* Close */}
            <button
              onClick={() => setSelectedSchemeForDetails(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-4 pr-8">
              <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                {selectedSchemeForDetails.scheme.ministry}
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {selectedSchemeForDetails.scheme.title}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {selectedSchemeForDetails.matchBadge}
                </span>
                <span className="text-xs text-slate-500">
                  Official Portal: <strong>{selectedSchemeForDetails.scheme.portalDomain}</strong>
                </span>
              </div>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Benefit Highlight */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Official Financial Benefit & Scope:
                </div>
                <div className="text-sm font-black text-emerald-950 mt-0.5">
                  {selectedSchemeForDetails.scheme.benefitAmount}
                </div>
                <div className="text-xs text-emerald-800 mt-1">
                  {selectedSchemeForDetails.scheme.description}
                </div>
              </div>

              {/* Official 5-Step Process Timeline */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Official Step-by-Step Government Application Procedure</span>
                </h3>

                <div className="space-y-2.5">
                  {selectedSchemeForDetails.scheme.processSteps.map((step) => (
                    <div
                      key={step.step}
                      className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {step.step}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mandatory Required Documents */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Mandatory Documents Required for Submission</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedSchemeForDetails.scheme.requiredDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-700 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Citizen Eligibility Breakdown */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <div className="text-xs font-bold text-indigo-950 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Your Profile Match Analysis</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  {selectedSchemeForDetails.matchReasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-indigo-900">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 mt-4">
              <button
                onClick={() => setSelectedSchemeForDetails(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>

              <Link
                href="/checklist"
                onClick={() => setSelectedSchemeForDetails(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Check Document Readiness
              </Link>

              <a
                href={selectedSchemeForDetails.scheme.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <span>Apply on Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
