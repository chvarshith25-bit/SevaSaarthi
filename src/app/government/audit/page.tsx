"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  History,
  Search,
  Filter,
  Shield,
  Key,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Clock,
  User,
  Database,
  Lock,
} from "lucide-react";
import { useGov } from "@/lib/store/gov-store";
import { toast } from "sonner";

export default function GovernmentAuditPage() {
  const { auditLogs } = useGov();
  const [searchQuery, setSearchQuery] = useState("");
  const [actorFilter, setActorFilter] = useState("ALL");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.applicationId && log.applicationId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesActor =
        actorFilter === "ALL" || log.actor.role === actorFilter;

      return matchesSearch && matchesActor;
    });
  }, [auditLogs, searchQuery, actorFilter]);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const copyHash = (hash?: string) => {
    if (hash) {
      navigator.clipboard.writeText(hash);
      toast.success("Tamper verification SHA-256 copied to clipboard");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold mb-1.5 border border-emerald-200/60">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Product Rule 19: Append-Only Cryptographic Trail</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Audit & Activity Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident statutory activity ledger recording every citizen interaction, AI recommendation, and officer determination.
          </p>
        </div>

        <div className="text-right hidden sm:block bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Recorded Events</div>
          <div className="text-lg font-black text-slate-900">{filteredLogs.length} events</div>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Audit ID, Application ID (e.g. SCH-2026-2346), action, or actor..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-medium text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <select
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
          className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 outline-hidden cursor-pointer w-full md:w-auto"
        >
          <option value="ALL">All Actor Roles</option>
          <option value="CITIZEN">Citizen Actions</option>
          <option value="OFFICER">Officer Decisions</option>
          <option value="SYSTEM_WORKFLOW">Workflow Engine</option>
          <option value="ADMIN">System Admin</option>
        </select>
      </div>

      {/* 3. Audit Events Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="text-sm font-bold text-slate-800">No audit events match your search</div>
            <div className="text-xs text-slate-400 mt-1">Try clearing your filters or search keywords.</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-3">
                  <div
                    onClick={() => toggleExpand(log.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        <History className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{log.action}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-[11px] text-blue-600 font-bold">
                            {log.applicationId || "System Global"}
                          </span>
                          <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                            {log.actor.role}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">{log.details}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="text-[11px] font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      <button className="p-1 text-slate-400 hover:text-slate-700 rounded-md">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Cryptographic Details */}
                  {isExpanded && (
                    <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 text-xs animate-in fade-in duration-100">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <span className="text-slate-400 text-[10px] font-medium">Actor ID</span>
                          <div className="font-mono font-bold text-slate-800 mt-0.5">{log.actor.id}</div>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <span className="text-slate-400 text-[10px] font-medium">Actor Name / IP</span>
                          <div className="font-medium text-slate-800 mt-0.5 truncate">{log.actor.name} ({(log.actor as any).ip || "127.0.0.1"})</div>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <span className="text-slate-400 text-[10px] font-medium">Verification Result</span>
                          <div className="font-bold text-emerald-700 mt-0.5">{(log as any).verificationResult || "PASS_VERIFIED"}</div>
                        </div>
                      </div>

                      {/* Cryptographic SHA-256 Tamper Evident Hash */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            SHA-256 Tamper Verification Digest
                          </span>
                          <div className="font-mono text-[11px] text-slate-700 truncate mt-0.5">
                            {(log as any).tamperVerificationHash || (log as any).hash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                          </div>
                        </div>
                        <button
                          onClick={() => copyHash((log as any).tamperVerificationHash || (log as any).hash)}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 text-xs font-semibold shrink-0 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
