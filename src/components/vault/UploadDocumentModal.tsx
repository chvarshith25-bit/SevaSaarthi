"use client";

import React, { useState, useRef } from "react";
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { DocumentType } from "@/types";
import { toast } from "sonner";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (documentId: string) => void;
}

export function UploadDocumentModal({ isOpen, onClose, onSuccess }: UploadDocumentModalProps) {
  const { uploadDocument } = useSevaSaarthi();
  const [selectedType, setSelectedType] = useState<DocumentType>("AADHAAR");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const docTypes: { type: DocumentType; label: string; example: string }[] = [
    { type: "AADHAAR", label: "Aadhaar Card (UIDAI)", example: "Aadhaar_Card_SaiKumar.pdf" },
    { type: "INCOME_CERTIFICATE", label: "Income Certificate (Tahsildar)", example: "Income_Cert_FY26.pdf" },
    { type: "COLLEGE_ID", label: "College Bonafide / ID Card", example: "College_Bonafide_Certificate.jpg" },
    { type: "PREVIOUS_MARKSHEET", label: "Semester / Qualifying Marksheet", example: "BTech_Marks_Memo.pdf" },
    { type: "BANK_PASSBOOK", label: "Bank Passbook (DBT Active)", example: "SBI_Passbook_Statement.jpg" },
    { type: "CASTE_CERTIFICATE", label: "Caste / Category Certificate", example: "Community_Certificate.pdf" },
    { type: "DOMICILE_CERTIFICATE", label: "Domicile / Residence Proof", example: "Domicile_Certificate.pdf" },
  ];

  const handleFile = (f: File) => {
    // Validate size (max 10MB)
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File exceeds 10MB limit. Please upload a smaller file.");
      return;
    }
    // Validate type
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(f.type) && !f.name.match(/\.(pdf|jpe?g|png)$/i)) {
      toast.error("Unsupported file format. Please upload PDF, JPG, or PNG.");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select or drop a document to upload.");
      return;
    }
    setIsUploading(true);
    try {
      const docId = await uploadDocument(file, selectedType);
      onClose();
      if (onSuccess) onSuccess(docId);
    } catch {
      // Handled in store
    } finally {
      setIsUploading(false);
    }
  };

  // Quick select sample mock file
  const selectQuickSample = (sampleType: DocumentType, filename: string) => {
    setSelectedType(sampleType);
    const mockFile = new File(["sample binary content"], filename, {
      type: filename.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
    });
    setFile(mockFile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Upload to Document Vault</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Seva Saarthi extracts structured fields with OCR confidence scoring and tracks document provenance.
          </p>
        </div>

        {/* Document Type Selector */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Select Document Category
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as DocumentType)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          >
            {docTypes.map((dt) => (
              <option key={dt.type} value={dt.type}>
                {dt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragActive(false);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]"
              : file
              ? "border-emerald-300 bg-emerald-50/30"
              : "border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            className="hidden"
          />

          {file ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">{file.name}</div>
                <div className="text-[11px] text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB • Ready to OCR
                </div>
              </div>
              <span className="text-xs font-semibold text-indigo-600 hover:underline ml-auto">
                Change
              </span>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2.5">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-slate-800">
                Click to upload or drag & drop
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Supports PDF, JPG, PNG up to 10MB
              </div>
            </div>
          )}
        </div>

        {/* Quick Sample Selector for Instant Demo Testing */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Or quick-test with a sample document:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {docTypes.slice(0, 4).map((dt) => (
              <button
                key={dt.type}
                type="button"
                onClick={() => selectQuickSample(dt.type, dt.example)}
                className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-300 rounded-lg text-[10px] font-semibold text-slate-700 hover:text-indigo-700 transition-colors"
              >
                + {dt.label.split(" ")[0]} ({dt.type})
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!file || isUploading}
            onClick={handleUpload}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-200 transition-all flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing OCR...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Start OCR Extraction</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
