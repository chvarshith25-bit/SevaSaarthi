"use client";

import React from "react";
import {
  X,
  ShieldCheck,
  Building2,
  Lock,
  Calendar,
  CheckCircle2,
  Database,
  Eye,
} from "lucide-react";

export interface GovRegistryRecordItem {
  registryName: string;
  recordType: string;
  fields: Record<string, any>;
  status: string;
  consentToken?: string;
  applicationId?: string;
  applicantName?: string;
  sourceEndpoint?: string;
}

interface GovernmentRecordViewerModalProps {
  record: GovRegistryRecordItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GovernmentRecordViewerModal({
  record,
  isOpen,
  onClose,
}: GovernmentRecordViewerModalProps) {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50/60">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {record.registryName}
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{record.status || "Authorized"}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                Record Type: <strong className="text-slate-700">{record.recordType}</strong> • Case: {record.applicationId || "PAN-2026-0001"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close Record"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Synthetic Record Warning Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-[10px] font-bold text-amber-900 tracking-wider uppercase flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
          <span>SYNTHETIC DEMONSTRATION RECORD — AUTHORIZED UNDER DPDP ACT 2023</span>
        </div>

        {/* Record Body */}
        <div className="flex-1 overflow-auto p-5 sm:p-6 space-y-4">
          {/* Statutory Consent Scope Card */}
          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 text-xs text-emerald-950 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Statutory DPDP Access Authorization</span>
              </span>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">
                {record.consentToken || "CNS-2026-9901-SAI"}
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
              This record was queried pursuant to explicit citizen statutory consent under the Digital Personal Data Protection Act 2023.
            </p>
          </div>

          {/* Fields Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Authorized Record Attributes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {Object.entries(record.fields).map(([fieldName, fieldValue]) => (
                <div key={fieldName} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {fieldName.replace(/_/g, " ").replace(/([A-Z])/g, " $1")}
                  </span>
                  <div className="text-xs font-bold text-slate-900 mt-0.5 break-words">
                    {String(fieldValue)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Registry Provenance Information */}
          <div className="p-3 bg-slate-900 text-slate-300 rounded-xl font-mono text-[11px] space-y-1 border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Provenance & Endpoint Metadata</div>
            <div>
              <span className="text-slate-400">Registry Source: </span>
              <span>{record.registryName}</span>
            </div>
            <div>
              <span className="text-slate-400">Endpoint: </span>
              <span className="text-blue-400">{record.sourceEndpoint || "https://gateway.gov.in/registry/v2.1"}</span>
            </div>
            <div>
              <span className="text-slate-400">Verification Status: </span>
              <span className="text-emerald-400 font-bold">{record.status || "VALID / ACTIVE"}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Authorized evidence snapshot verified by officer.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
