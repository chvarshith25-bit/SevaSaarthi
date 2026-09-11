"use client";

import React from "react";
import Link from "next/link";
import {
  CreditCard,
  GraduationCap,
  Home,
  FileText,
  Award,
  Check,
  AlertCircle,
  MoreVertical,
  ArrowRight,
} from "lucide-react";
import { CitizenTrackedApplication } from "@/lib/mock-data/citizen-applications";

export function CitizenApplicationTrackerCard({ app }: { app: CitizenTrackedApplication }) {
  const getIcon = () => {
    switch (app.iconType) {
      case "pan":
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case "scholarship":
        return <GraduationCap className="w-5 h-5 text-emerald-600" />;
      case "housing":
        return <Home className="w-5 h-5 text-purple-600" />;
      case "income":
        return <FileText className="w-5 h-5 text-amber-600" />;
      case "caste":
        return <Award className="w-5 h-5 text-teal-600" />;
      default:
        return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  const getIconBg = () => {
    switch (app.iconType) {
      case "pan":
        return "bg-blue-50 border-blue-100";
      case "scholarship":
        return "bg-emerald-50 border-emerald-100";
      case "housing":
        return "bg-purple-50 border-purple-100";
      case "income":
        return "bg-amber-50 border-amber-100";
      case "caste":
        return "bg-teal-50 border-teal-100";
      default:
        return "bg-blue-50 border-blue-100";
    }
  };

  const getStatusBadge = () => {
    switch (app.statusType) {
      case "GOV_PROCESSING":
        return "bg-blue-50/80 text-blue-700 border-blue-200/80";
      case "VERIFICATION":
        return "bg-amber-50/80 text-amber-700 border-amber-200/80";
      case "ACTION_REQUIRED":
        return "bg-rose-50/80 text-rose-700 border-rose-200/80";
      case "COMPLETED":
        return "bg-emerald-50/80 text-emerald-700 border-emerald-200/80";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getDotColor = () => {
    switch (app.statusType) {
      case "GOV_PROCESSING":
        return "bg-blue-600";
      case "VERIFICATION":
        return "bg-amber-500";
      case "ACTION_REQUIRED":
        return "bg-rose-600 animate-pulse";
      case "COMPLETED":
        return "bg-emerald-600";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all">
      {/* Top Header: Icon, Titles, Live Status, Action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${getIconBg()}`}>
            {getIcon()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {app.title}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
              <span>{app.department}</span> • <span>Application ID: <strong className="font-mono text-slate-700">{app.id}</strong></span> • <span>Applied on {app.appliedDate}</span>
            </p>
          </div>
        </div>

        {/* Status Badge & Actions */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge()}`}>
            <span className={`w-2 h-2 rounded-full ${getDotColor()}`} />
            <span>Live Status: {app.statusText}</span>
          </span>

          <Link
            href={app.trackingUrl}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 flex items-center gap-1"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            aria-label="Application options"
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Multi-Step Progress Tracker matching Image 2 */}
      <div className="pt-2 overflow-x-auto no-scrollbar">
        <div className="min-w-[540px] px-2 py-2">
          <div className="relative flex items-center justify-between">
            {app.steps.map((step, index) => {
              const isFirst = index === 0;
              const isLast = index === app.steps.length - 1;
              const prevStep = index > 0 ? app.steps[index - 1] : null;
              const isConnectedCompleted = prevStep && prevStep.status === "COMPLETED";

              return (
                <div key={index} className="flex-1 flex flex-col items-center relative group">
                  {/* Connecting Line from previous step */}
                  {!isFirst && (
                    <div
                      className={`absolute top-3.5 right-1/2 left-[-50%] h-0.5 -translate-y-1/2 z-0 ${
                        step.status === "COMPLETED" || step.status === "ACTIVE" || step.status === "ALERT"
                          ? step.status === "ALERT"
                            ? "bg-rose-400"
                            : "bg-emerald-500"
                          : "bg-slate-200"
                      }`}
                    />
                  )}

                  {/* Step Node Icon */}
                  <div className="relative z-10">
                    {step.status === "COMPLETED" && (
                      <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs ring-4 ring-white">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    {step.status === "ACTIVE" && (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xs ring-4 ring-white ${
                        app.statusType === "VERIFICATION" ? "bg-amber-500" : "bg-blue-600"
                      }`}>
                        <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                      </div>
                    )}

                    {step.status === "ALERT" && (
                      <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs ring-4 ring-white animate-bounce">
                        <span className="text-xs font-black">!</span>
                      </div>
                    )}

                    {step.status === "PENDING" && (
                      <div className="w-7 h-7 rounded-full bg-white border-2 border-slate-300 text-slate-300 flex items-center justify-center ring-4 ring-white">
                        <div className="w-2 h-2 rounded-full bg-slate-200" />
                      </div>
                    )}
                  </div>

                  {/* Step Label & Date */}
                  <div className="mt-2 text-center">
                    <div className={`text-[11px] font-bold leading-tight ${
                      step.status === "COMPLETED"
                        ? "text-slate-800"
                        : step.status === "ACTIVE"
                        ? app.statusType === "VERIFICATION" ? "text-amber-700" : "text-blue-700"
                        : step.status === "ALERT"
                        ? "text-rose-700"
                        : "text-slate-400"
                    }`}>
                      {step.label}
                    </div>
                    {step.date && (
                      <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                        {step.date}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
