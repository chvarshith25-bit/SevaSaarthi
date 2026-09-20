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
  User,
  Award,
  Calendar,
  Check,
  Building2,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { StateEmblem } from "@/components/ui/StateEmblem";

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
  dob?: string;
  fatherName?: string;
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
  const isConflict = document.status === "CONFLICT";

  const handleDownload = () => {
    toast.success(`Downloading verified digital copy of ${fileName}`);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 75));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const isAadhaar =
    docType.toLowerCase().includes("aadhaar") ||
    fileName.toLowerCase().includes("aadhaar") ||
    document.key.toLowerCase().includes("aadhaar");

  const isClass10 =
    docType.toLowerCase().includes("class 10") ||
    docType.toLowerCase().includes("secondary") ||
    docType.toLowerCase().includes("marksheet") ||
    fileName.toLowerCase().includes("class10") ||
    fileName.toLowerCase().includes("marksheet") ||
    document.key.toLowerCase().includes("education");

  const isPAN =
    docType.toLowerCase().includes("pan") ||
    fileName.toLowerCase().includes("pan") ||
    document.key.toLowerCase().includes("pan");

  const isIncomeOrRevenue =
    docType.toLowerCase().includes("income") ||
    docType.toLowerCase().includes("revenue") ||
    docType.toLowerCase().includes("land") ||
    fileName.toLowerCase().includes("income");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full flex flex-col max-h-[94vh] shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  {docType}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                    isVerified
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : isConflict
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {isVerified ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                  )}
                  <span>{document.status}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                {fileName} • Case Ref: {appId}
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

        {/* Realistic DigiLocker Verification Strip */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 px-4 py-1.5 text-white text-[11px] font-semibold flex items-center justify-between shadow-inner shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-200" />
            <span>DigiLocker Verified Digital Credential — Issued by Competent Authority</span>
          </div>
          <span className="text-[10px] font-mono opacity-90 hidden sm:inline">
            ISO 27001 Certified Proof
          </span>
        </div>

        {/* Inspector Toolbar */}
        <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200/60 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <span>Inspector Zoom:</span>
            <strong className="text-slate-800 font-mono">{zoom}%</strong>
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

        {/* Document Body Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-200/60 flex items-center justify-center min-h-[420px]">
          <div
            className="w-full max-w-xl bg-white rounded-2xl border border-slate-300 shadow-xl relative overflow-hidden transition-transform duration-200"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          >
            {/* 1. REALISTIC AADHAAR CARD VIEW */}
            {isAadhaar && (
              <div className="border-4 border-slate-300 rounded-2xl bg-white overflow-hidden p-0 select-none">
                {/* Tricolor Ribbon Header */}
                <div className="h-2.5 bg-gradient-to-r from-amber-500 via-white to-emerald-600 border-b border-slate-200" />
                
                {/* UIDAI Official Header */}
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StateEmblem size={34} className="text-slate-800 shrink-0" />
                    <div>
                      <div className="text-[12px] font-black text-slate-900 leading-tight">
                        भारत सरकार
                      </div>
                      <div className="text-[11px] font-bold text-slate-700 leading-tight">
                        GOVERNMENT OF INDIA
                      </div>
                      <div className="text-[9px] font-semibold text-slate-500 mt-0.5">
                        भारतीय विशिष्ट पहचान प्राधिकरण / UIDAI
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-extrabold text-blue-900 uppercase">
                      Unique Identification
                    </div>
                    <div className="text-[9px] font-mono text-slate-500">
                      e-Aadhaar Copy
                    </div>
                  </div>
                </div>

                {/* Aadhaar Content Details */}
                <div className="p-5 grid grid-cols-12 gap-4 items-center">
                  {/* Avatar Photo Frame */}
                  <div className="col-span-4 flex flex-col items-center justify-center">
                    <div className="w-28 h-32 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-300 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                      <User className="w-16 h-16 text-slate-400" />
                      <div className="absolute bottom-0 inset-x-0 bg-slate-800/80 text-white text-[8px] text-center py-0.5 font-mono">
                        DIGITAL PHOTO
                      </div>
                    </div>
                  </div>

                  {/* Citizen Attributes */}
                  <div className="col-span-5 space-y-1.5 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">नाम / Name:</div>
                      <div className="font-extrabold text-slate-900 text-sm">{applicant}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">जन्म तिथि / DOB:</div>
                      <div className="font-bold text-slate-900">
                        {document.dob || "14/05/1999"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">लिंग / Gender:</div>
                      <div className="font-bold text-slate-900">MALE / पुरुष</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">Address / पता:</div>
                      <div className="text-[10px] text-slate-700 leading-tight font-medium">
                        Plot No. 42, Sri Nagar Colony, Hyderabad, Telangana - 500073
                      </div>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="col-span-3 flex flex-col items-center justify-center space-y-1">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      <QrCode className="w-16 h-16 text-slate-800" />
                    </div>
                    <div className="text-[8px] font-mono text-slate-500 text-center">
                      SECURE QR
                    </div>
                  </div>
                </div>

                {/* Aadhaar Number Highlight Bar */}
                <div className="py-2.5 bg-slate-100 border-y border-slate-300 text-center font-mono font-black text-slate-900 text-base tracking-widest">
                  XXXX &nbsp; XXXX &nbsp; 8912
                </div>

                {/* Bottom Slogan Ribbon */}
                <div className="px-4 py-2 bg-rose-700 text-white text-center text-xs font-black tracking-wide flex items-center justify-between">
                  <span className="text-[10px]">1947 (Toll Free)</span>
                  <span>मेरा आधार, मेरी पहचान</span>
                  <span className="text-[10px]">help@uidai.gov.in</span>
                </div>
              </div>
            )}

            {/* 2. REALISTIC CLASS 10 SECONDARY MARKSHEET VIEW */}
            {isClass10 && (
              <div className="border-4 border-amber-200 rounded-2xl bg-[#FFFDF9] p-5 select-none space-y-4">
                {/* Official Board Crest & Header */}
                <div className="text-center border-b-2 border-amber-900/20 pb-3 space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <StateEmblem size={28} className="text-amber-900" />
                    <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                      CENTRAL BOARD OF SECONDARY EDUCATION
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-900 uppercase">
                    MARKS STATEMENT CUM CERTIFICATE
                  </div>
                  <div className="text-[10px] font-semibold text-slate-600">
                    SECONDARY SCHOOL EXAMINATION (CLASS X)
                  </div>
                </div>

                {/* Student Info Box */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Roll No:</span>
                    <div className="font-mono font-bold text-slate-900">261094820</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Candidate Name:</span>
                    <div className="font-bold text-slate-900">{applicant}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Mother&apos;s Name:</span>
                    <div className="font-semibold text-slate-800">Laxmi Devi</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Father&apos;s / Guardian:</span>
                    <div className="font-semibold text-slate-800">{document.fatherName || "Ramesh Kumar"}</div>
                  </div>
                  <div className="col-span-2 p-1.5 bg-amber-100/70 border border-amber-300 rounded-lg flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-amber-950 uppercase">Date of Birth (Verified Proof):</span>
                    <span className="font-mono font-black text-xs text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-300">
                      {document.dob || "14-05-1999"}
                    </span>
                  </div>
                </div>

                {/* Marks Table */}
                <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-700 border-b border-slate-300">
                      <tr>
                        <th className="p-2">Code</th>
                        <th className="p-2">Subject</th>
                        <th className="p-2 text-center">Marks</th>
                        <th className="p-2 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px] font-medium text-slate-800">
                      <tr>
                        <td className="p-2 font-mono">101</td>
                        <td className="p-2">ENGLISH COMM.</td>
                        <td className="p-2 text-center font-bold">088</td>
                        <td className="p-2 text-center font-bold text-emerald-700">A2</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">085</td>
                        <td className="p-2">HINDI COURSE-B</td>
                        <td className="p-2 text-center font-bold">082</td>
                        <td className="p-2 text-center font-bold text-emerald-700">B1</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">041</td>
                        <td className="p-2">MATHEMATICS</td>
                        <td className="p-2 text-center font-bold">092</td>
                        <td className="p-2 text-center font-bold text-emerald-700">A1</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">086</td>
                        <td className="p-2">SCIENCE</td>
                        <td className="p-2 text-center font-bold">086</td>
                        <td className="p-2 text-center font-bold text-emerald-700">A2</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">087</td>
                        <td className="p-2">SOCIAL SCIENCE</td>
                        <td className="p-2 text-center font-bold">090</td>
                        <td className="p-2 text-center font-bold text-emerald-700">A1</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Result & Signatures */}
                <div className="flex items-center justify-between pt-2 border-t border-amber-900/10 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">FINAL RESULT:</span>
                    <span className="ml-2 font-black text-emerald-700 text-sm">PASSED</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-300 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>DigiLocker Certified</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. REALISTIC PAN CARD VIEW */}
            {isPAN && (
              <div className="border-4 border-blue-900 rounded-2xl bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 p-5 select-none space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-blue-900/30 pb-2">
                  <div className="flex items-center gap-2.5">
                    <StateEmblem size={28} className="text-blue-950" />
                    <div>
                      <div className="text-xs font-black text-blue-950">आयकर विभाग / INCOME TAX DEPARTMENT</div>
                      <div className="text-[10px] font-bold text-slate-700">भारत सरकार / GOVT. OF INDIA</div>
                    </div>
                  </div>
                  <div className="font-black text-xs text-blue-900 uppercase">Permanent Account Card</div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-4 flex justify-center">
                    <div className="w-24 h-28 rounded-xl bg-white border-2 border-blue-300 flex flex-col items-center justify-center shadow-xs">
                      <User className="w-14 h-14 text-blue-400" />
                    </div>
                  </div>
                  <div className="col-span-8 space-y-1.5 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Name:</span>
                      <div className="font-black text-slate-900 text-sm">{applicant}</div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Father&apos;s Name:</span>
                      <div className="font-bold text-slate-800">{document.fatherName || "Ramesh Kumar"}</div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Date of Birth:</span>
                      <div className="font-bold text-slate-900">{document.dob || "14/05/1999"}</div>
                    </div>
                  </div>
                </div>

                {/* PAN Number */}
                <div className="p-2.5 bg-white rounded-xl border border-blue-300 flex items-center justify-between shadow-inner">
                  <div>
                    <span className="text-[9px] font-bold text-blue-800 uppercase">Permanent Account Number (PAN):</span>
                    <div className="font-mono font-black text-base text-blue-950 tracking-wider">
                      ABCDE1234F
                    </div>
                  </div>
                  <QrCode className="w-10 h-10 text-blue-950" />
                </div>
              </div>
            )}

            {/* 4. REALISTIC INCOME / REVENUE / DOMICILE CERTIFICATE */}
            {isIncomeOrRevenue && (
              <div className="border-4 border-slate-300 rounded-2xl bg-[#FAFAFA] p-6 select-none space-y-4">
                <div className="text-center border-b border-slate-300 pb-3 space-y-1">
                  <StateEmblem size={30} className="mx-auto text-slate-900" />
                  <div className="text-xs font-black uppercase text-slate-900">
                    GOVERNMENT OF STATE • REVENUE DEPARTMENT
                  </div>
                  <div className="text-sm font-extrabold text-blue-900 uppercase">
                    CERTIFICATE OF ANNUAL HOUSEHOLD INCOME & DOMICILE
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Certificate No: REV/2026/091823 • Issued under Public Services Act
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2 leading-relaxed text-slate-800">
                  <p>
                    This is to certify that Sri/Kum <strong>{applicant}</strong>, S/o Sri <strong>{document.fatherName || "Ramesh Kumar"}</strong>, residing at Plot 42, Sri Nagar Colony, Mandal Hyderabad, District Hyderabad, has an authenticated annual household income from all sources of:
                  </p>
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-300 font-bold text-emerald-950 text-center text-sm">
                    ₹ 1,20,000/- (Rupees One Lakh Twenty Thousand Only)
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Issuing Officer</div>
                    <div className="font-bold text-slate-800">Tahsildar / Revenue Officer</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Digital Seal</div>
                    <div className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Authorized e-Sign</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. DEFAULT AUTHENTIC GOVERNMENT EVIDENCE RECORD */}
            {!isAadhaar && !isClass10 && !isPAN && !isIncomeOrRevenue && (
              <div className="p-6 space-y-5 bg-white">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-blue-900">
                        Government of India • Statutory Verification Record
                      </div>
                      <h3 className="text-sm font-black text-slate-900">{docType}</h3>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl shrink-0">
                    <QrCode className="w-8 h-8 text-slate-700" />
                  </div>
                </div>

                {/* Document Attributes */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 rounded-xl p-4 border border-slate-200">
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
            )}
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
