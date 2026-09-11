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
} from "lucide-react";
import { useGov } from "@/lib/store/gov-store";
import { toast } from "sonner";

export default function AuditCenterPage() {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5 text-emerald-600" />
            <span>Immutable Statutory Event Trail</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            AUDIT CENTER
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete cryptographic audit trail recording Who, What, When, Why, Source, Target, Purpose, Consent, and Verification Result.
          </p>
        </div>

        <div className="text-right hidden sm:block">
          <div className="text-xs font-bold text-slate-400">Total Audit Events</div>
          <div className="text-xl font-black text-emerald-700">{filteredLogs.length} events</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Audit ID, PAN ID, Action Name, or Keywords..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        <select
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
          className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer w-full md:w-auto"
        >
          <option value="ALL">All Actor Categories</option>
          <option value="CITIZEN">Citizen Actions</option>
          <option value="OFFICER">Department Officer Actions</option>
          <option value="SYSTEM_WORKFLOW">Workflow Engine Transitions</option>
          <option value="CONNECTOR_JOB">Connector Telemetry Jobs</option>
          <option value="ADMIN">Administrator Interventions</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Timestamp / Event ID</th>
                <th className="py-3.5 px-4">Application</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Result</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;

                return (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => toggleExpand(log.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-mono text-xs font-bold text-slate-900">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">{log.id}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {log.applicationId ? (
                          <span className="font-mono font-bold text-indigo-700">
                            {log.applicationId}
                          </span>
                        ) : (
                          <span className="text-slate-400">System</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 text-xs">
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-bold">{log.actor.name}</div>
                        <div className="text-[10px] text-slate-400">{log.actor.role}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            log.result === "SUCCESS"
                              ? "bg-emerald-100 text-emerald-800"
                              : log.result === "WARNING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {log.result}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                        {log.details}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <span className="text-slate-400 text-xs font-bold">
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      </td>
                    </tr>

                    {/* Expandable Tamper-Evident Detail Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 border-b border-slate-100">
                        <td colSpan={7} className="p-4 sm:p-6 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-white p-4 rounded-2xl border border-slate-200">
                            <div>
                              <span className="text-slate-400 block font-bold text-[10px] uppercase">
                                Source Channel
                              </span>
                              <span className="font-semibold text-slate-800">{log.source}</span>
                            </div>

                            <div>
                              <span className="text-slate-400 block font-bold text-[10px] uppercase">
                                Target Node
                              </span>
                              <span className="font-semibold text-slate-800">{log.target}</span>
                            </div>

                            <div>
                              <span className="text-slate-400 block font-bold text-[10px] uppercase">
                                Request ID
                              </span>
                              <span className="font-mono font-bold text-indigo-700">{log.requestId}</span>
                            </div>

                            <div className="md:col-span-2">
                              <span className="text-slate-400 block font-bold text-[10px] uppercase">
                                Statutory Purpose & Legal Basis
                              </span>
                              <span className="text-slate-800 font-medium">{log.purpose}</span>
                            </div>

                            <div>
                              <span className="text-slate-400 block font-bold text-[10px] uppercase">
                                Consent Token Ref
                              </span>
                              <span className="font-mono text-xs text-slate-700">
                                {log.consentToken || "Statutory System Task"}
                              </span>
                            </div>

                            {log.tamperHash && (
                              <div className="md:col-span-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Key className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="text-[10px] font-mono text-slate-500 truncate">
                                    Tamper Hash (SHA-256): <span className="text-slate-800">{log.tamperHash}</span>
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyHash(log.tamperHash);
                                  }}
                                  className="text-[10px] font-bold text-indigo-600 hover:underline shrink-0"
                                >
                                  Copy Hash
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
