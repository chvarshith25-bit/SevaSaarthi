"use client";

import React, { useState } from "react";
import { X, CheckSquare, ShieldCheck, AlertCircle } from "lucide-react";
import { ServiceRequirement } from "@/types";
import { useSevaSaarthi } from "@/lib/store/formly-store";

interface ManualResolveModalProps {
  requirement: ServiceRequirement;
  isOpen: boolean;
  onClose: () => void;
}

export function ManualResolveModal({ requirement, isOpen, onClose }: ManualResolveModalProps) {
  const { markRequirementResolved } = useSevaSaarthi();
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    markRequirementResolved(requirement.id, note.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <CheckSquare className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Mark as Manually Resolved</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Requirement: <span className="font-semibold text-slate-700">{requirement.label}</span>
          </p>
        </div>

        {/* Explanation Alert */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 mb-4 text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>F10 Manual Resolution</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            This locks the requirement as resolved by you, preventing automatic recomputes from overwriting it.
          </p>
        </div>

        {/* Note Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reason / Resolution Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., I have the physical certificate and will present it directly during college verification."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-200 transition-all"
            >
              Confirm Resolution
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
