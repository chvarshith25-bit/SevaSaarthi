"use client";

import React, { useState } from "react";
import {
  FolderOpen,
  UploadCloud,
  FileCheck,
  FileSearch,
  RotateCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { DocumentRow, DocumentStatus } from "@/types";
import { cn, formatDate } from "@/lib/utils";
import { UploadDocumentModal } from "@/components/vault/UploadDocumentModal";
import { FieldConfirmationModal } from "@/components/vault/FieldConfirmationModal";

export function DocumentVaultPage() {
  const { documents, extractedFields, deleteDocument, retryOcr } = useSevaSaarthi();
  const [filter, setFilter] = useState<"ALL" | DocumentStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [reviewingDoc, setReviewingDoc] = useState<DocumentRow | null>(null);

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    if (filter !== "ALL" && doc.status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (doc.original_filename || "").toLowerCase().includes(q);
      const typeMatch = doc.document_type.toLowerCase().includes(q);
      return nameMatch || typeMatch;
    }
    return true;
  });

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "VERIFIED":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle2,
          label: "Verified",
        };
      case "EXTRACTED":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse",
          icon: FileSearch,
          label: "Review Needed",
        };
      case "PROCESSING":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: RotateCw,
          label: "Processing OCR",
          spin: true,
        };
      case "FAILED":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          icon: AlertTriangle,
          label: "OCR Failed",
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          icon: Clock,
          label: "Uploaded",
        };
    }
  };

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
            Secure, verified personal document storage with provenance tracking and instant OCR field extraction.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-indigo-200 transition-all self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: "ALL", label: `All (${documents.length})` },
              { key: "VERIFIED", label: `Verified (${documents.filter((d) => d.status === "VERIFIED").length})` },
              { key: "EXTRACTED", label: `Review Needed (${documents.filter((d) => d.status === "EXTRACTED").length})` },
              { key: "PROCESSING", label: `Processing (${documents.filter((d) => d.status === "PROCESSING").length})` },
              { key: "FAILED", label: `Failed (${documents.filter((d) => d.status === "FAILED").length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
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
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Search documents by name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
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
            Upload your Aadhaar, Income Certificate, College Bonafide, or Marksheet to start building your verified profile.
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm shadow-indigo-200"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const badge = getStatusBadge(doc.status);
            const BadgeIcon = badge.icon;
            const docExtracted = extractedFields.filter((ef) => ef.document_id === doc.id);
            const pendingFields = docExtracted.filter((ef) => !ef.accepted).length;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Top Status & Type */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          {doc.document_type.replace(/_/g, " ")}
                        </div>
                        <h3
                          className="text-xs font-bold text-slate-900 truncate"
                          title={doc.original_filename || "Document Scan"}
                        >
                          {doc.original_filename || "Document Scan"}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 ml-2 shadow-2xs",
                        badge.bg
                      )}
                    >
                      <BadgeIcon className={cn("w-3 h-3", badge.spin && "animate-spin")} />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="text-[11px] text-slate-500 space-y-1 mb-4">
                    <div className="flex items-center justify-between">
                      <span>Uploaded on:</span>
                      <span className="font-semibold text-slate-700">{formatDate(doc.created_at)}</span>
                    </div>
                    {docExtracted.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Extracted fields:</span>
                        <span className="font-semibold text-indigo-600">
                          {docExtracted.length} fields ({pendingFields} unconfirmed)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {doc.status === "EXTRACTED" ? (
                    <button
                      onClick={() => setReviewingDoc(doc)}
                      className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <FileSearch className="w-3.5 h-3.5" />
                      <span>Review Fields ({pendingFields})</span>
                    </button>
                  ) : doc.status === "FAILED" ? (
                    <button
                      onClick={() => retryOcr(doc.id)}
                      className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Retry OCR</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setReviewingDoc(doc)}
                      className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FileSearch className="w-3.5 h-3.5 text-slate-500" />
                      <span>View OCR Fields</span>
                    </button>
                  )}

                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
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

      {/* Upload Modal */}
      {isUploadOpen && <UploadDocumentModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />}

      {/* Review Fields Modal */}
      {reviewingDoc && (
        <FieldConfirmationModal
          document={reviewingDoc}
          isOpen={!!reviewingDoc}
          onClose={() => setReviewingDoc(null)}
        />
      )}
    </div>
  );
}
