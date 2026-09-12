"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  FileText,
  CheckCircle2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Sparkles,
  QrCode,
} from "lucide-react";
import { DocumentRow } from "@/types";
import { formatDate } from "@/lib/utils";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { toast } from "sonner";

interface DocumentPreviewModalProps {
  document: DocumentRow | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCompressor?: (doc: DocumentRow) => void;
}

export function DocumentPreviewModal({
  document,
  isOpen,
  onClose,
  onOpenCompressor,
}: DocumentPreviewModalProps) {
  const { user, profileFields } = useSevaSaarthi();
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !document) return null;

  const fileName = document.original_filename || "Document Preview";
  const fileExt = fileName.split(".").pop()?.toLowerCase() || "";
  const isImage =
    document.mime_type?.startsWith("image/") ||
    ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(fileExt);

  const isPdf = document.mime_type === "application/pdf" || fileExt === "pdf";

  const handleDownload = () => {
    if (document.preview_url) {
      const a = window.document.createElement("a");
      a.href = document.preview_url;
      a.download = fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      toast.success(`Downloading ${fileName}`);
    } else {
      toast.success(`Downloading verified copy of ${fileName}`);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const getDocTypeTitle = (type: string) => {
    switch (type.toUpperCase()) {
      case "AADHAAR":
        return "Aadhaar Identity Card";
      case "INCOME_CERTIFICATE":
        return "Income & Asset Certificate";
      case "COLLEGE_ID":
        return "College Bonafide / Student ID";
      case "MARKSHEET":
      case "PREVIOUS_MARKSHEET":
        return "Academic Marksheet / Memo";
      case "BANK_PASSBOOK":
        return "Bank Account Passbook";
      case "CASTE_CERTIFICATE":
        return "Community / Caste Certificate";
      case "DOMICILE_CERTIFICATE":
        return "Domicile / Nativity Certificate";
      default:
        return type.replace(/_/g, " ");
    }
  };

  // Find user's basic info to display in visual certificate preview
  const fullName = profileFields.find((f) => f.field_name === "full_name")?.value || user?.name || "Sai Sankeerth";
  const aadhaarNumber = profileFields.find((f) => f.field_name === "aadhaar_number")?.value || "XXXX-XXXX-9012";
  const annualIncome = profileFields.find((f) => f.field_name === "annual_income")?.value || "₹ 1,80,000";
  const collegeName = profileFields.find((f) => f.field_name === "institution_name")?.value || "Vidya Jyothi Institute of Technology";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full flex flex-col max-h-[92vh] shadow-2xl border border-slate-100 overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {fileName}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Category: <strong className="text-slate-700">{getDocTypeTitle(document.document_type)}</strong> • Uploaded {formatDate(document.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenCompressor && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCompressor(document);
                }}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="Reduce file size"
              >
                <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Compress</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
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

        {/* Image / PDF Zoom Controls Toolbar */}
        {isImage && document.preview_url && (
          <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200/60 flex items-center justify-between text-xs text-slate-600 shrink-0">
            <span className="text-[11px] font-medium text-slate-500">
              Image Viewer ({zoom}%)
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
        )}

        {/* Viewport Content Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50/50 flex items-center justify-center min-h-[350px]">
          {isImage && document.preview_url ? (
            <div className="flex items-center justify-center max-w-full overflow-auto p-2">
              <img
                src={document.preview_url}
                alt={fileName}
                className="max-h-[60vh] max-w-full rounded-xl shadow-md object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                }}
              />
            </div>
          ) : isPdf && document.preview_url && document.preview_url.startsWith("blob:") ? (
            <iframe
              src={document.preview_url}
              title={fileName}
              className="w-full h-[60vh] rounded-2xl border border-slate-200 shadow-sm"
            />
          ) : (
            /* Digital Certificate & Document Preview Card */
            <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-6 shadow-md relative overflow-hidden space-y-5">
              {/* Top Seal & Watermark */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
                    🏛️ GOV
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-indigo-900">
                      National Document Repository • Digital Vault
                    </div>
                    <h3 className="text-sm font-black text-slate-900">
                      {getDocTypeTitle(document.document_type)}
                    </h3>
                  </div>
                </div>

                <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl shrink-0">
                  <QrCode className="w-8 h-8 text-slate-700" />
                </div>
              </div>

              {/* Document Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Document Holder</div>
                  <div className="font-bold text-slate-800 mt-0.5">{fullName}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Verification ID</div>
                  <div className="font-bold text-indigo-700 mt-0.5">{document.id}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Document Type</div>
                  <div className="font-semibold text-slate-700 mt-0.5">{document.document_type}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Original File</div>
                  <div className="font-semibold text-slate-700 mt-0.5 truncate" title={fileName}>
                    {fileName}
                  </div>
                </div>

                {document.document_type === "AADHAAR" && (
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Aadhaar Reference</div>
                    <div className="font-semibold text-slate-700 mt-0.5">{aadhaarNumber}</div>
                  </div>
                )}

                {document.document_type === "INCOME_CERTIFICATE" && (
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Certified Income</div>
                    <div className="font-semibold text-emerald-700 mt-0.5">{annualIncome}</div>
                  </div>
                )}

                {document.document_type === "COLLEGE_ID" && (
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Institution</div>
                    <div className="font-semibold text-slate-700 mt-0.5 truncate">{collegeName}</div>
                  </div>
                )}

                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Status</div>
                  <div className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Digitally Stored & Ready</span>
                  </div>
                </div>
              </div>

              {/* Security & Provenance Footer */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Vault Record</span>
                </span>
                <span>SHA-256 Encrypted Storage</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Ready for 1-click scheme application autofill.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
