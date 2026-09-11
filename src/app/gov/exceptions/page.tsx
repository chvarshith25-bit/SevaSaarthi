"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Shield,
  ArrowRight,
  Clock,
  User,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useGov } from "@/lib/store/gov-store";
import { toast } from "sonner";

export default function ExceptionCenterPage() {
  const { exceptions, refreshAll } = useGov();
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [retryingAppId, setRetryingAppId] = useState<string | null>(null);

  const handleResolve = async (exceptionId: string) => {
    const resolution = prompt("Enter resolution notes for audit trail:", "Reviewed and acknowledged by authorized officer.");
    if (!resolution) return;

    setResolvingId(exceptionId);
    try {
      const res = await fetch("/api/gov/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exceptionId, resolution }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Exception ${exceptionId} marked resolved.`);
        await refreshAll();
      } else {
        toast.error(data.error || "Failed to resolve");
      }
    } catch {
      toast.error("Error resolving exception");
    } finally {
      setResolvingId(null);
    }
  };

  const handleRetryApp = async (applicationId: string) => {
    setRetryingAppId(applicationId);
    try {
      const res = await fetch(`/api/gov/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RETRY_VERIFICATION" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Retry successful for ${applicationId}! Moved to Officer Review queue.`);
        await refreshAll();
      } else {
        toast.error(data.error || "Retry failed");
      }
    } catch {
      toast.error("Network error during retry");
    } finally {
      setRetryingAppId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Resiliency & Exception Resolution Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            GOVERNMENT EXCEPTION CENTER
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Isolated tracking for downstream API timeouts, cross-system demographic conflicts, and dispatch SLA delays.
          </p>
        </div>

        <button
          onClick={() => refreshAll()}
          className="self-start sm:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Incidents</span>
        </button>
      </div>

      {/* Exception Cards Stack */}
      <div className="space-y-4">
        {exceptions.map((exc) => {
          const isCritical = exc.severity === "CRITICAL";
          const isManual = exc.severity === "MANUAL_REVIEW";
          const isDelayed = exc.severity === "DELAYED";

          return (
            <div
              key={exc.id}
              className={`bg-white rounded-3xl border p-6 shadow-xs transition-all ${
                exc.isResolved
                  ? "opacity-60 border-slate-200 bg-slate-50/50"
                  : isCritical
                  ? "border-rose-300 ring-1 ring-rose-100"
                  : isManual
                  ? "border-amber-300 ring-1 ring-amber-100"
                  : "border-blue-300 ring-1 ring-blue-100"
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">
                    {isCritical ? "🔴" : isManual ? "🟡" : "🔵"}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{exc.title}</h3>
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {exc.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Target System: <span className="font-semibold text-slate-800">{exc.systemName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      exc.isResolved
                        ? "bg-emerald-100 text-emerald-800 font-black"
                        : isCritical
                        ? "bg-rose-100 text-rose-800"
                        : isManual
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {exc.isResolved ? "RESOLVED ✓" : exc.severity.replace(/_/g, " ")}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(exc.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              {/* 8 Structured Diagnostic Points required by spec */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400 font-bold block text-[11px] uppercase">What happened?</span>
                    <p className="text-slate-800 leading-relaxed font-medium mt-0.5">
                      {exc.whatHappened}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[11px] uppercase">Why did it happen?</span>
                    <p className="text-slate-800 leading-relaxed font-medium mt-0.5">
                      {exc.whyItHappened}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block font-semibold">Which application?</span>
                      <Link
                        href={`/applications/${exc.applicationId}`}
                        className="font-mono font-bold text-indigo-600 hover:underline"
                      >
                        {exc.applicationId} ↗
                      </Link>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold">Current State:</span>
                      <span className="font-bold text-slate-800">{exc.currentState}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold">Automatic Retry:</span>
                      <span className="font-bold text-slate-800">
                        {exc.autoRetry ? `Active (${exc.retryAttempts} attempts)` : "Manual Only"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold">Human Action:</span>
                      <span className="font-bold text-amber-700">Required</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-slate-500 font-bold text-[10px] uppercase block">
                      Required Action Description
                    </span>
                    <p className="text-slate-700 text-xs mt-0.5 font-medium">
                      {exc.humanActionRequired}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/applications/${exc.applicationId}`}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Open Case Workspace</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  {exc.severity === "CRITICAL" && !exc.isResolved && (
                    <button
                      onClick={() => handleRetryApp(exc.applicationId)}
                      disabled={retryingAppId === exc.applicationId}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${retryingAppId === exc.applicationId ? "animate-spin" : ""}`} />
                      <span>Execute Connector Retry</span>
                    </button>
                  )}
                </div>

                {!exc.isResolved && (
                  <button
                    onClick={() => handleResolve(exc.id)}
                    disabled={resolvingId === exc.id}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs rounded-xl border border-slate-200 hover:border-emerald-200 transition-colors"
                  >
                    {resolvingId === exc.id ? "Resolving..." : "Mark Resolved"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
