"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Layers,
} from "lucide-react";
import { useGov } from "@/lib/store/gov-store";
import { toast } from "sonner";

export default function GovernmentExceptionsPage() {
  const { exceptions, refreshAll } = useGov();
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [retryingAppId, setRetryingAppId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");

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

  const filteredExceptions = exceptions.filter((exc) => {
    if (filterType === "ALL") return true;
    if (filterType === "IDENTITY_CONFLICT") {
      return (
        (exc as any).type === "VERIFICATION_CONFLICT" ||
        exc.exceptionType === "VERIFICATION_CONFLICT" ||
        exc.title.toLowerCase().includes("conflict") ||
        exc.title.toLowerCase().includes("identity")
      );
    }
    if (filterType === "REGISTRY_API") {
      return (
        (exc as any).type === "API_UNAVAILABLE" ||
        exc.exceptionType === "API_UNAVAILABLE" ||
        exc.title.toLowerCase().includes("timeout") ||
        exc.title.toLowerCase().includes("api")
      );
    }
    if (filterType === "DOCUMENT_ISSUES") {
      return (
        (exc as any).type === "DOCUMENT_REJECTED" ||
        exc.title.toLowerCase().includes("document")
      );
    }
    if (filterType === "SLA_RISKS") {
      return (
        (exc as any).type === "SLA_BREACH" ||
        exc.title.toLowerCase().includes("sla")
      );
    }
    return (
      (exc as any).type === filterType ||
      exc.exceptionType === filterType ||
      (exc as any).severity === filterType
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold mb-1.5 border border-amber-200/60">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Operational Exceptions & Conflict Resolution</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Exceptions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cases requiring officer attention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshAll()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: "ALL", label: "All" },
          { key: "IDENTITY_CONFLICT", label: "Identity Conflicts" },
          { key: "REGISTRY_API", label: "Registry/API Issues" },
          { key: "DOCUMENT_ISSUES", label: "Document Issues" },
          { key: "SLA_RISKS", label: "SLA Risks" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilterType(item.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === item.key
                ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 3. Exception Cards Stack */}
      <div className="space-y-4">
        {filteredExceptions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <div className="text-sm font-bold text-slate-800">No active exceptions in this category.</div>
            <div className="text-xs text-slate-400 mt-1">All gateway connectors and cross-registry pipelines are operating normally.</div>
          </div>
        ) : (
          filteredExceptions.map((exc) => (
            <div
              key={exc.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 lg:p-6 shadow-xs hover:border-amber-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{exc.title}</span>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 rounded-md">
                        {exc.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Logged {new Date(exc.timestamp || (exc as any).createdAt || Date.now()).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md ${
                    (exc.resolved ?? exc.isResolved) ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {(exc.resolved ?? exc.isResolved) ? "RESOLVED" : "NEEDS ACTION"}
                  </span>
                </div>
              </div>

              {/* What Happened & Why */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">What Happened</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{exc.description || exc.whatHappened}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Impacted Application / Entity</span>
                  <div className="font-mono font-bold text-blue-600 mt-0.5">
                    {exc.applicationId ? (
                      <Link href={`/government/applications/${exc.applicationId}/review`} className="hover:underline">
                        {exc.applicationId}
                      </Link>
                    ) : (
                      "System Gateway Connector"
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-xs text-slate-500 font-medium">
                  {(exc.resolutionNote || (exc as any).resolutionNotes) && (
                    <span>Notes: {exc.resolutionNote || (exc as any).resolutionNotes}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {exc.applicationId && (
                    <Link
                      href={`/government/applications/${exc.applicationId}/review`}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <span>Open Application</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {exc.applicationId && (
                    <button
                      onClick={() => handleRetryApp(exc.applicationId!)}
                      disabled={retryingAppId === exc.applicationId}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{retryingAppId === exc.applicationId ? "Retrying..." : "Retry Connector"}</span>
                    </button>
                  )}

                  {!(exc.resolved ?? exc.isResolved) && (
                    <button
                      onClick={() => handleResolve(exc.id)}
                      disabled={resolvingId === exc.id}
                      className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {resolvingId === exc.id ? "Resolving..." : "Resolve"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
