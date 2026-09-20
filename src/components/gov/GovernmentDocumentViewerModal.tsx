"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ShieldCheck,
  QrCode,
  Lock,
  Building,
} from "lucide-react";
import { toast } from "sonner";

export interface GovDocumentItem {
  key: string;
  type: string;
  filename: string;
  status: string;
  note?: string;
  hash?: string;
  applicationId?: string;
  applicantName?: string;
  serviceName?: string;
}

interface GovernmentDocumentViewerModalProps {
  document: GovDocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GovernmentDocumentViewerModal({
  document,
  isOpen,
  onClose,
}: GovernmentDocumentViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !document) return null;

  const fileName = document.filename || "Document_File.pdf";
  const docType = document.type || "Supporting Document";
  const applicant = document.applicantName || "Citizen Applicant";
  const appId = document.applicationId || "PAN-2026-0001";
  const isVerified = document.status === "VERIFIED";

  const handleDownload = () => {
    toast.success(`Downloading verified copy of ${fileName}`);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 75));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full flex flex-col max-h-[92vh] shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50/60">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {docType}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                    isVerified
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {isVerified ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-amber-600" />}
                  <span>{document.status}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                {fileName} • Case: {appId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Synthetic Document Warning Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-[10px] font-bold text-amber-900 tracking-wider uppercase flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
          <span>SYNTHETIC DEMONSTRATION DOCUMENT — NOT A REAL GOVERNMENT DOCUMENT</span>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200/60 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <span className="text-[11px] font-medium text-slate-500">
            Officer Document Inspector ({zoom}%)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              className="p-1.5 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
            >
              100%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRotate}
              className="p-1.5 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 transition-colors ml-1 cursor-pointer"
              title="Rotate 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Viewport Content Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/40 flex items-center justify-center min-h-[350px]">
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-6 shadow-md relative overflow-hidden space-y-5 transition-transform duration-200"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          >
            {/* Top Seal & Official Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-blue-900">
                    Government of India • Verification Evidence
                  </div>
                  <h3 className="text-sm font-black text-slate-900">{docType}</h3>
                </div>
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl shrink-0">
                <QrCode className="w-8 h-8 text-slate-700" />
              </div>
            </div>

            {/* Document Attributes */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/80 rounded-xl p-4 border border-slate-100">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Applicant Name</div>
                <div className="font-bold text-slate-900 mt-0.5">{applicant}</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Application Case</div>
                <div className="font-mono font-bold text-blue-600 mt-0.5">{appId}</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Document Category</div>
                <div className="font-semibold text-slate-700 mt-0.5">{document.key}</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Verification Status</div>
                <div className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{document.status}</span>
                </div>
              </div>

              <div className="col-span-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Scrutiny Note</div>
                <div className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                  {document.note || "Digitally verified against authoritative state registry records under DPDP Act 2023."}
                </div>
              </div>
            </div>

            {/* Security & Checksum */}
            <div className="p-2.5 bg-slate-900 text-slate-300 rounded-xl font-mono text-[10px] space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Cryptographic SHA-256 Checksum:</span>
              </div>
              <div className="text-slate-200 break-all text-[9px]">
                {document.hash || "a3f5e8b1c9d24607e5f1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3"}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Document integrity cryptographically validated for statutory decision.</span>
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
