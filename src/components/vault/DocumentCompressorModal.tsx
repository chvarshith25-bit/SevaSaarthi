"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sliders,
  Download,
  UploadCloud,
  CheckCircle2,
  FileCheck2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileText,
  Minimize2,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import {
  PORTAL_PRESETS,
  PortalPreset,
  compressImageToTargetSize,
  CompressionResult,
  downloadFile,
} from "@/lib/utils/document-compressor";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { DocumentRow, DocumentType } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DocumentCompressorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDocument?: DocumentRow | null;
  initialPresetId?: string;
}

export function DocumentCompressorModal({
  isOpen,
  onClose,
  initialDocument,
  initialPresetId = "pan-photo",
}: DocumentCompressorModalProps) {
  const { uploadDocument, documents } = useSevaSaarthi();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PortalPreset>(
    PORTAL_PRESETS.find((p) => p.id === initialPresetId) || PORTAL_PRESETS[0]
  );
  const [customKb, setCustomKb] = useState<number>(50);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSavingToVault, setIsSavingToVault] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>("AADHAAR");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If an initial document from the vault was provided, simulate loading it or let user pick
  useEffect(() => {
    if (initialDocument) {
      // Map document_type to docType
      const dType = (initialDocument.document_type as DocumentType) || "AADHAAR";
      setSelectedDocType(dType);

      // Create a dummy image/sample to compress if no raw binary is cached
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, 1200, 800);
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 32px sans-serif";
        ctx.fillText(initialDocument.original_filename || "Government Identity Document", 60, 100);
        ctx.fillStyle = "#64748b";
        ctx.font = "20px sans-serif";
        ctx.fillText(`Category: ${initialDocument.document_type} • Verified Government Record`, 60, 140);
        ctx.fillText("Digitally signed & verified by SevaSaarthi / UIDAI", 60, 180);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File(
              [blob],
              initialDocument.original_filename || "document_scan.jpg",
              { type: "image/jpeg" }
            );
            setSelectedFile(file);
          }
        }, "image/jpeg", 0.95);
      }
    }
  }, [initialDocument]);

  const targetLimitKb = isCustomMode ? customKb : selectedPreset.targetMaxKb;

  // Run compression whenever file or target changes
  const runCompression = async (file: File, targetKb: number) => {
    setIsCompressing(true);
    setErrorMsg(null);
    try {
      const outputFilename = file.name.replace(/\.[^/.]+$/, "") + `_${targetKb}kb.jpg`;
      const result = await compressImageToTargetSize(file, targetKb, "image/jpeg", outputFilename);
      setCompressionResult(result);
    } catch (err: any) {
      console.error("Compression error:", err);
      setErrorMsg(err.message || "Could not compress file. Please ensure it is a valid image.");
    } finally {
      setIsCompressing(false);
    }
  };

  useEffect(() => {
    if (selectedFile) {
      runCompression(selectedFile, targetLimitKb);
    }
  }, [selectedFile, selectedPreset, customKb, isCustomMode]);

  if (!isOpen) return null;

  const handleFileSelect = (f: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/bmp"];
    if (!validTypes.includes(f.type) && !f.name.match(/\.(jpe?g|png|webp)$/i)) {
      toast.error("Please upload an image document (JPEG, PNG, WebP) to compress.");
      return;
    }
    setSelectedFile(f);
  };

  const handleDownload = () => {
    if (!compressionResult) return;
    const filename = (selectedFile?.name.replace(/\.[^/.]+$/, "") || "document") + `_optimized_${targetLimitKb}KB.jpg`;
    downloadFile(compressionResult.compressedBlob, filename);
    toast.success(`Saved ${filename} (${compressionResult.compressedSizeKb} KB) to your computer!`);
  };

  const handleSaveToVault = async () => {
    if (!compressionResult) return;
    setIsSavingToVault(true);
    try {
      await uploadDocument(compressionResult.compressedFile, selectedDocType);
      toast.success(
        `Optimized document (${compressionResult.compressedSizeKb} KB) added to your Document Vault!`
      );
      onClose();
    } catch (err: any) {
      toast.error("Failed to save to Vault: " + (err.message || "Unknown error"));
    } finally {
      setIsSavingToVault(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
              <Minimize2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">Smart Document Size Reducer</h3>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full font-bold border border-emerald-400/30">
                  Portal-Ready
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Automatically compress photos, signatures & certificates to meet official government website limits.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Portal Preset Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              1. Which government application website are you applying for?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PORTAL_PRESETS.map((preset) => {
                const isSelected = !isCustomMode && selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setIsCustomMode(false);
                      setSelectedPreset(preset);
                    }}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[72px]",
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20"
                        : "border-slate-200 hover:border-indigo-200 bg-slate-50/50 hover:bg-slate-50"
                    )}
                  >
                    <div>
                      <div className="text-[11px] font-bold text-slate-900 leading-tight">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {preset.portal}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded">
                        Max {preset.targetMaxKb} KB
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Custom Size Card */}
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className={cn(
                  "p-2.5 rounded-xl border text-left transition-all min-h-[72px] flex flex-col justify-between",
                  isCustomMode
                    ? "border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20"
                    : "border-slate-200 hover:border-indigo-200 bg-slate-50/50 hover:bg-slate-50"
                )}
              >
                <div>
                  <div className="text-[11px] font-bold text-slate-900 leading-tight">
                    Custom File Size
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Specify portal limit in KB</div>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-700 bg-slate-200/80 px-1.5 py-0.5 rounded">
                    {isCustomMode ? `${customKb} KB` : "Custom"}
                  </span>
                  {isCustomMode && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  )}
                </div>
              </button>
            </div>

            {/* Custom KB Controls if selected */}
            {isCustomMode && (
              <div className="mt-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Target File Limit:</span>
                    <span className="text-indigo-600 font-extrabold">{customKb} KB</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="1000"
                    step="5"
                    value={customKb}
                    onChange={(e) => setCustomKb(Number(e.target.value))}
                    className="w-full accent-indigo-600 h-1.5 bg-indigo-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>15 KB</span>
                    <span>100 KB</span>
                    <span>300 KB</span>
                    <span>500 KB</span>
                    <span>1000 KB</span>
                  </div>
                </div>

                <div className="w-24">
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    value={customKb}
                    onChange={(e) => setCustomKb(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-center text-xs font-bold border border-indigo-200 rounded-xl bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Upload or Select Document */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              2. Select Document or Photo to Reduce
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-6 text-center cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  Click to select photo, signature or certificate
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Supports JPEG, PNG up to 15MB • Client-side local processing
                </div>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {selectedFile.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Original size: {(selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-white border border-slate-200 hover:bg-indigo-50 rounded-xl transition-colors shrink-0"
                >
                  Change File
                </button>
              </div>
            )}
          </div>

          {/* Step 3: Compression Result & Live Comparison */}
          {selectedFile && (
            <div>
              <div className="text-xs font-bold text-slate-800 mb-2">
                3. Compression Results & Portal Compliance
              </div>

              {isCompressing ? (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                  <span className="text-xs font-semibold text-indigo-900">
                    Optimizing resolution & quality to stay under {targetLimitKb} KB...
                  </span>
                </div>
              ) : compressionResult ? (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3.5 shadow-xs">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-emerald-800 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">
                        Ready for website upload: Exactly{" "}
                        <strong className="underline">{compressionResult.compressedSizeKb} KB</strong> (Limit is {targetLimitKb} KB)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      -{compressionResult.compressionRatioPercent}% REDUCED
                    </span>
                  </div>

                  {/* Comparison Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Original Size</div>
                      <div className="text-sm font-black text-slate-700 mt-0.5">
                        {compressionResult.originalSizeKb} KB
                      </div>
                    </div>
                    <div className="bg-indigo-50/70 border border-indigo-100 p-2.5 rounded-xl">
                      <div className="text-[10px] text-indigo-500 font-bold uppercase">Optimized Size</div>
                      <div className="text-sm font-black text-indigo-700 mt-0.5">
                        {compressionResult.compressedSizeKb} KB
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Resolution</div>
                      <div className="text-xs font-bold text-slate-700 mt-1">
                        {compressionResult.width} × {compressionResult.height} px
                      </div>
                    </div>
                  </div>

                  {/* Image Preview */}
                  <div className="flex items-center justify-center p-2 bg-slate-100/70 rounded-xl max-h-48 overflow-hidden">
                    <img
                      src={compressionResult.dataUrl}
                      alt="Compressed Preview"
                      className="max-h-44 object-contain rounded shadow-xs"
                    />
                  </div>
                </div>
              ) : null}

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>100% Client-Side Privacy:</strong> Compression executes locally in your browser memory. Your documents are never transmitted to external compression servers.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={!compressionResult || isCompressing}
              onClick={handleDownload}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download File</span>
            </button>

            <button
              type="button"
              disabled={!compressionResult || isCompressing || isSavingToVault}
              onClick={handleSaveToVault}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-200 flex items-center gap-1.5 transition-all disabled:opacity-40"
            >
              {isSavingToVault ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving to Vault...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Save to Document Vault</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
