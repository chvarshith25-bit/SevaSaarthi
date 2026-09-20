"use client";

import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Building2,
  Lock,
  Calendar,
  CheckCircle2,
  Database,
  Eye,
  FileText,
  User,
  QrCode,
  Sparkles,
  Layers,
} from "lucide-react";
import { StateEmblem } from "@/components/ui/StateEmblem";

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
  const [showTechDetails, setShowTechDetails] = useState(false);

  if (!isOpen || !record) return null;

  const registryName = record.registryName || "Authorized Government Registry";
  const recordType = record.recordType || "Master Record";
  const appId = record.applicationId || "PAN-2026-0001";
  const applicant = record.applicantName || "Citizen Applicant";

  const isAadhaarRegistry =
    registryName.toLowerCase().includes("aadhaar") ||
    registryName.toLowerCase().includes("uidai");

  const isPanRegistry =
    registryName.toLowerCase().includes("pan") ||
    registryName.toLowerCase().includes("income tax");

  const isEducationRegistry =
    registryName.toLowerCase().includes("education") ||
    registryName.toLowerCase().includes("board");

  const isRevenueRegistry =
    registryName.toLowerCase().includes("revenue") ||
    registryName.toLowerCase().includes("land") ||
    registryName.toLowerCase().includes("agriculture");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[92vh] shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100 shadow-2xs">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  {registryName}
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{record.status || "Authorized Record"}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                Record Type: <strong className="text-slate-700">{recordType}</strong> • Case Ref: {appId}
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

        {/* DPDP Statutory Verification Header */}
        <div className="bg-emerald-700 text-white px-4 py-1.5 text-[11px] font-semibold flex items-center justify-between shadow-inner shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-200" />
            <span>DPDP Act 2023 Statutory Query Response — Authorized Government Database</span>
          </div>
          <span className="text-[10px] font-mono opacity-90">
            Token: {record.consentToken || "CNS-2026-9901-SAI"}
          </span>
        </div>

        {/* Record Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4 bg-slate-100/50">
          {/* Official Registry Card Dossier */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            {/* Header with State Emblem */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <StateEmblem size={32} className="text-slate-800 shrink-0" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Government Central Database
                  </div>
                  <div className="text-sm font-black text-slate-900 leading-tight">
                    {registryName}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500">
                    Official Interoperability Gateway Response
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl inline-block">
                  <QrCode className="w-8 h-8 text-slate-800" />
                </div>
                <div className="text-[8px] font-mono text-slate-400 mt-0.5">AUTHENTICATED</div>
              </div>
            </div>

            {/* Rendered Attributes Table */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Authorized Record Attributes</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Exact Match Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {Object.entries(record.fields).map(([fieldName, fieldValue]) => {
                  const isConflictField =
                    fieldName.toLowerCase().includes("dob") ||
                    fieldName.toLowerCase().includes("dateofbirth");

                  return (
                    <div
                      key={fieldName}
                      className={`p-3 rounded-xl border ${
                        isConflictField && String(fieldValue).includes("2000")
                          ? "bg-rose-50/70 border-rose-200"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {fieldName.replace(/_/g, " ").replace(/([A-Z])/g, " $1")}
                      </span>
                      <div className="text-xs font-bold text-slate-900 mt-0.5 break-words">
                        {String(fieldValue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Statutory Compliance Note */}
            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-blue-900 text-[11px]">
                <Lock className="w-3.5 h-3.5 text-blue-700" />
                <span>Statutory DPDP Consent Authority</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                This record was fetched in real-time under citizen consent token <strong>{record.consentToken || "CNS-2026-9901-SAI"}</strong> for the purpose of statutory application processing under the Digital Personal Data Protection Act 2023.
              </p>
            </div>
          </div>

          {/* Technical Details Accordion */}
          <div className="pt-1">
            <button
              onClick={() => setShowTechDetails(!showTechDetails)}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{showTechDetails ? "Hide Technical Details" : "View Technical Details"}</span>
            </button>

            {showTechDetails && (
              <div className="mt-2.5 p-3.5 bg-slate-900 text-slate-300 rounded-xl font-mono text-[11px] space-y-1.5 border border-slate-800 animate-in fade-in duration-150">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Provenance & Endpoint Metadata</div>
                <div>
                  <span className="text-slate-400">Registry Source: </span>
                  <span className="text-indigo-300">{registryName}</span>
                </div>
                <div>
                  <span className="text-slate-400">Gateway Endpoint: </span>
                  <span className="text-blue-400">{record.sourceEndpoint || "https://api.gov.in/registry/interop/v2.1"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Verification Status: </span>
                  <span className="text-emerald-400 font-bold">{record.status || "VALID / ACTIVE"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Consent Token: </span>
                  <span className="text-slate-300">{record.consentToken || "CNS-2026-9901-SAI"}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Authorized evidence snapshot verified under DPDP Act 2023.</span>
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
