"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileCheck, FileWarning, FileQuestion, UploadCloud } from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { UploadDocumentModal } from "@/components/vault/UploadDocumentModal";

export function DocumentVaultCard() {
  const { stats } = useSevaSaarthi();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-6 shadow-xs w-full min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Document Vault</h2>
          <Link href="/vault" className="text-xs font-semibold text-indigo-600 hover:underline">
            View all
          </Link>
        </div>

        {/* Vault Stats Row & Upload Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
          {/* Mini Stat Badges */}
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto min-w-0">
            {/* Verified */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 bg-emerald-50/70 border border-emerald-100 rounded-xl min-w-0">
              <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-xs font-bold text-emerald-900">{stats.verifiedDocuments}</span>
                <span className="text-[10px] text-emerald-700 ml-1 hidden min-[360px]:inline">Verified</span>
              </div>
            </div>

            {/* Expiring Soon */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 bg-amber-50/70 border border-amber-100 rounded-xl min-w-0">
              <FileWarning className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
              <div className="truncate">
                <span className="text-xs font-bold text-amber-900">{stats.expiringSoonDocuments}</span>
                <span className="text-[10px] text-amber-700 ml-1 hidden min-[360px]:inline">Expiring</span>
              </div>
            </div>

            {/* Missing */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 bg-rose-50/70 border border-rose-100 rounded-xl min-w-0">
              <FileQuestion className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 shrink-0" />
              <div className="truncate">
                <span className="text-xs font-bold text-rose-900">{stats.missingDocuments}</span>
                <span className="text-[10px] text-rose-700 ml-1 hidden min-[360px]:inline">Missing</span>
              </div>
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="w-full sm:w-auto py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 border border-indigo-200/70 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shrink-0 shadow-2xs min-h-[40px]"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadOpen && <UploadDocumentModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />}
    </>
  );
}
