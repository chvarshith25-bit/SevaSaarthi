"use client";

import React, { useState } from "react";
import {
  X,
  Check,
  Trash2,
  CheckCircle2,
  FileSearch,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { DocumentRow, ExtractedField } from "@/types";
import { cn, getConfidenceBadgeClass } from "@/lib/utils";

interface FieldConfirmationModalProps {
  document: DocumentRow;
  isOpen: boolean;
  onClose: () => void;
}

export function FieldConfirmationModal({ document, isOpen, onClose }: FieldConfirmationModalProps) {
  const { extractedFields, acceptExtractedField, rejectExtractedField, acceptAllExtractedFields } =
    useSevaSaarthi();

  // Get extracted fields for this document
  const docFields = extractedFields.filter((ef) => ef.document_id === document.id);

  // Local state for tracking edited field values
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [showRawText, setShowRawText] = useState(false);

  if (!isOpen) return null;

  const handleValueChange = (fieldId: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleConfirmSingle = (field: ExtractedField) => {
    const customValue = editedValues[field.id];
    acceptExtractedField(document.id, field.id, customValue);
  };

  const formatFieldLabel = (fieldName: string) => {
    return fieldName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const pendingCount = docFields.filter((f) => !f.accepted).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileSearch className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              OCR Field Confirmation (F5)
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Review Extracted Information
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Document: <span className="font-semibold text-slate-700">{document.original_filename || document.document_type}</span> • {pendingCount} pending confirmation
          </p>
        </div>

        {/* Scrollable Fields List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
          {docFields.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No extracted fields found for this document.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">You can enter values directly in your Profile Setup.</p>
            </div>
          ) : (
            docFields.map((field) => {
              const currentValue = editedValues[field.id] !== undefined ? editedValues[field.id] : field.raw_value;
              const isEdited = editedValues[field.id] !== undefined && editedValues[field.id] !== field.raw_value;
              const confidenceClass = isEdited
                ? { bg: "bg-slate-100 border-slate-200", text: "text-slate-700", label: "Manual Override" }
                : getConfidenceBadgeClass(field.confidence);

              return (
                <div
                  key={field.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all",
                    field.accepted
                      ? "bg-emerald-50/40 border-emerald-200/80"
                      : "bg-slate-50/70 border-slate-200/80 hover:border-indigo-200"
                  )}
                >
                  {/* Field Name & Confidence Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {formatFieldLabel(field.field_name)}
                      {field.accepted && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                          Confirmed ✓
                        </span>
                      )}
                    </label>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        confidenceClass.bg,
                        confidenceClass.text
                      )}
                    >
                      {confidenceClass.label}
                    </span>
                  </div>

                  {/* Editable Input & Action Buttons */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={currentValue}
                      disabled={field.accepted}
                      onChange={(e) => handleValueChange(field.id, e.target.value)}
                      className={cn(
                        "flex-1 px-3 py-2 text-xs font-semibold rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500",
                        field.accepted
                          ? "bg-white/70 border-emerald-200 text-slate-700"
                          : "bg-white border-slate-200 text-slate-900"
                      )}
                    />

                    {!field.accepted ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleConfirmSingle(field)}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                          title="Confirm into profile"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectExtractedField(document.id, field.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                          title="Discard field"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 px-2 py-1 bg-emerald-100/60 rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Saved</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Raw OCR Text Accordion */}
          {document.ocr_raw_text && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowRawText(!showRawText)}
                className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <span>{showRawText ? "Hide Raw OCR Transcript" : "View Full Raw OCR Transcript"}</span>
                {showRawText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showRawText && (
                <pre className="mt-2 p-3 bg-slate-900 text-slate-200 text-[11px] rounded-xl font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                  {document.ocr_raw_text}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Values confirmed here update your profile with document provenance.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Done
            </button>
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  acceptAllExtractedFields(document.id);
                  onClose();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-200 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Accept All ({pendingCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
