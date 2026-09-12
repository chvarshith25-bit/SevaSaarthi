"use client";

import React, { useState, useMemo } from "react";
import {
  FolderOpen,
  UploadCloud,
  Trash2,
  CheckCircle2,
  FileText,
  Minimize2,
  Search,
  ExternalLink,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { DocumentRow } from "@/types";
import { cn, formatDate } from "@/lib/utils";
import { UploadDocumentModal } from "@/components/vault/UploadDocumentModal";
import { DocumentCompressorModal } from "@/components/vault/DocumentCompressorModal";
import { DocumentPreviewModal } from "@/components/vault/DocumentPreviewModal";

type CategoryFilter = "ALL" | "IDENTITY" | "INCOME" | "EDUCATION" | "BANKING";

export function DocumentVaultPage() {
  const { documents, deleteDocument } = useSevaSaarthi();
  const [filter, setFilter] = useState<CategoryFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<DocumentRow | null>(null);
  const [isCompressorOpen, setIsCompressorOpen] = useState(false);
  const [selectedDocForCompression, setSelectedDocForCompression] = useState<DocumentRow | null>(null);

  // Filter documents by category and search query
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const type = (doc.document_type || "").toUpperCase();

      if (filter === "IDENTITY" && !["AADHAAR", "DOMICILE_CERTIFICATE"].includes(type)) {
        return false;
      }
      if (filter === "INCOME" && !["INCOME_CERTIFICATE", "CASTE_CERTIFICATE"].includes(type)) {
        return false;
      }
      if (filter === "EDUCATION" && !["COLLEGE_ID", "MARKSHEET", "PREVIOUS_MARKSHEET", "BONAFIDE_CERTIFICATE"].includes(type)) {
        return false;
      }
      if (filter === "BANKING" && !["BANK_PASSBOOK"].includes(type)) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (doc.original_filename || "").toLowerCase().includes(q);
        const typeMatch = doc.document_type.toLowerCase().includes(q);
        return nameMatch || typeMatch;
      }

      return true;
    });
  }, [documents, filter, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Document Vault</h1>
          </div>
          <p className="text-xs text-slate-500">
            Secure personal document storage for your government schemes and certificate applications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => {
              setSelectedDocForCompression(null);
              setIsCompressorOpen(true);
            }}
            className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:border-indigo-300 cursor-pointer"
          >
            <Minimize2 className="w-4 h-4 text-indigo-600" />
            <span>Reduce Document Size</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-extrabold border border-indigo-100">
              Portal Limits
            </span>
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-indigo-200 transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: "ALL", label: `All Documents (${documents.length})` },
              { key: "IDENTITY", label: "Identity & Domicile" },
              { key: "INCOME", label: "Income & Caste" },
              { key: "EDUCATION", label: "Education & Bonafide" },
              { key: "BANKING", label: "Bank Passbook" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                filter === tab.key
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full md:w-64 relative">
          <input
            type="text"
            placeholder="Search by name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No documents found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Upload your Aadhaar Card, Income Certificate, College Bonafide, or Marksheet to store them ready for 1-click scheme applications.
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm shadow-indigo-200 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const fileName = doc.original_filename || "Document Scan";
            const fileExt = fileName.split(".").pop()?.toUpperCase() || "PDF";

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Top Status & Type */}
                  <div
                    onClick={() => setSelectedDocForPreview(doc)}
                    className="flex items-start justify-between gap-2 mb-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider">
                          {doc.document_type.replace(/_/g, " ")}
                        </div>
                        <h3
                          className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors"
                          title={fileName}
                        >
                          {fileName}
                        </h3>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 ml-2 shadow-2xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Ready</span>
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="text-[11px] text-slate-500 space-y-1.5 mb-4 p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Uploaded on:</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(doc.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">File Format:</span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded text-[10px]">
                        {fileExt}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedDocForPreview(doc)}
                    className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-indigo-100"
                  >
                    <span>View / Preview</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedDocForCompression(doc);
                      setIsCompressorOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors shrink-0 cursor-pointer"
                    title="Reduce file size for portal limits"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-200 transition-colors shrink-0 cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedDocForPreview && (
        <DocumentPreviewModal
          document={selectedDocForPreview}
          isOpen={!!selectedDocForPreview}
          onClose={() => setSelectedDocForPreview(null)}
          onOpenCompressor={(doc) => {
            setSelectedDocForCompression(doc);
            setIsCompressorOpen(true);
          }}
        />
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <UploadDocumentModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
        />
      )}

      {/* Document Compressor Modal */}
      {isCompressorOpen && (
        <DocumentCompressorModal
          isOpen={isCompressorOpen}
          initialDocument={selectedDocForCompression}
          onClose={() => {
            setIsCompressorOpen(false);
            setSelectedDocForCompression(null);
          }}
        />
      )}
    </div>
  );
}

