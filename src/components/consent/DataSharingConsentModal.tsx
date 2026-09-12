"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Building,
  UserCheck,
  History,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTitle: string;
  departmentName: string;
  requestedFields: string[];
  requestedDocuments: string[];
  purpose: string;
  onConsentGranted: () => void;
}

export function DataSharingConsentModal({
  isOpen,
  onClose,
  serviceTitle,
  departmentName,
  requestedFields,
  requestedDocuments,
  purpose,
  onConsentGranted,
}: ConsentModalProps) {
  const { easyMode, addConsentRecord, consentRecords } = useSevaSaarthi();
  const [showHistory, setShowHistory] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  if (!isOpen) return null;

  const handleGrant = () => {
    if (!hasAcknowledged) {
      toast.error("Please acknowledge the consent terms before proceeding.");
      return;
    }
    addConsentRecord({
      serviceName: serviceTitle,
      department: departmentName,
      dataFields: requestedFields,
      documents: requestedDocuments,
      purpose: purpose,
      status: "ALLOWED",
    });
    toast.success("Data sharing consent recorded securely.");
    onConsentGranted();
    onClose();
  };

  const handleDecline = () => {
    addConsentRecord({
      serviceName: serviceTitle,
      department: departmentName,
      dataFields: requestedFields,
      documents: requestedDocuments,
      purpose: purpose,
      status: "DENIED",
    });
    toast.info("Data sharing request declined.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={cn("font-black text-slate-900", easyMode ? "text-xl" : "text-lg")}>
                  Data Sharing Consent
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  DPDP Act 2023
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                SIH Problem Statement 26129 Verified Citizen Authorization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-slate-700 flex-1">
          {/* Service Details Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-start gap-2.5">
              <Building className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Requesting Authority & Scheme
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {serviceTitle}
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  {departmentName}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Stated Purpose
                </div>
                <p className="text-xs text-slate-700 font-medium mt-0.5">
                  {purpose || "Verification of citizen eligibility and direct application submission for official government benefits."}
                </p>
              </div>
            </div>
          </div>

          {/* Requested Data & Documents */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Details to be shared with government authority:</span>
            </h4>

            {/* Fields List */}
            {requestedFields.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1.5">Profile Information:</div>
                <div className="flex flex-wrap gap-1.5">
                  {requestedFields.map((field, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Documents List */}
            {requestedDocuments.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1.5">Verified Documents:</div>
                <div className="flex flex-wrap gap-1.5">
                  {requestedDocuments.map((doc, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-1"
                    >
                      <FileCheck2 className="w-3 h-3 text-emerald-600" />
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Privacy & Revocation Notice */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed font-medium">
              Your data is encrypted end-to-end. In compliance with the Digital Personal Data Protection Act (DPDP 2023), you can revoke this consent or request deletion from your Seva Saarthi dashboard anytime.
            </div>
          </div>

          {/* Citizen Acknowledgment Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={hasAcknowledged}
              onChange={(e) => setHasAcknowledged(e.target.checked)}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 mt-0.5 cursor-pointer"
            />
            <span className={cn("text-xs font-semibold text-slate-800", easyMode ? "text-sm" : "")}>
              I explicitly authorize Seva Saarthi to share only the selected profile details and verified documents with {departmentName} for this application.
            </span>
          </label>

          {/* Toggle Consent History Audit Log */}
          {consentRecords.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>View My Past Data Sharing History ({consentRecords.length})</span>
                {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showHistory && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  {consentRecords.map((record) => (
                    <div key={record.id} className="p-2.5 bg-white rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">{record.serviceName || record.department}</div>
                        <div className="text-[10px] text-slate-500">{record.date} • {record.purpose}</div>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black",
                        record.status === "ALLOWED" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      )}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions with min 48px touch targets */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleDecline}
            className="px-5 py-3 rounded-2xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-200 text-sm transition-colors min-h-[48px] cursor-pointer"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleGrant}
            disabled={!hasAcknowledged}
            className={cn(
              "px-6 py-3 rounded-2xl font-bold text-white text-sm shadow-md transition-all min-h-[48px] flex items-center gap-2 cursor-pointer",
              hasAcknowledged
                ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                : "bg-slate-300 cursor-not-allowed text-slate-500 shadow-none"
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Grant Consent & Proceed</span>
          </button>
        </div>
      </div>
    </div>
  );
}
