"use client";

import React, { useState } from "react";
import {
  FolderGit2,
  FileText,
  Download,
  ExternalLink,
  Search,
  BookOpen,
  Shield,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Building,
} from "lucide-react";
import { toast } from "sonner";

interface ResourceDoc {
  id: string;
  title: string;
  category: "STATUTORY" | "SOP" | "ESCALATION" | "INTEROPERABILITY";
  code: string;
  size: string;
  lastUpdated: string;
  department: string;
  description: string;
  status: "ACTIVE" | "MANDATORY" | "ADVISORY";
}

export default function GovernmentResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const resources: ResourceDoc[] = [
    {
      id: "res-1",
      title: "CBDT Notification No. 107/2025: Guidelines for PAN Allotment via Digital Channels",
      category: "STATUTORY",
      code: "CBDT/DIR/2025/107",
      size: "2.4 MB PDF",
      lastUpdated: "15 Jan 2026",
      department: "Income Tax Department (CBDT)",
      description:
        "Statutory directives on instant paperless PAN card issuance through biometric and Aadhaar-based OTP verification, Rule 114 compliance, and audit logging.",
      status: "MANDATORY",
    },
    {
      id: "res-2",
      title: "Regional Processing Cell (RPC) Standard Operating Procedure v3.2",
      category: "SOP",
      code: "SOP-RPC-PAN-2026",
      size: "4.1 MB PDF",
      lastUpdated: "02 Feb 2026",
      department: "Regional Processing Cell, Hyderabad",
      description:
        "Standard operating procedure for desk officers on adjudicating identity conflicts, fuzzy name matching tolerances, and physical card dispatch workflows.",
      status: "MANDATORY",
    },
    {
      id: "res-3",
      title: "DigiLocker & UIDAI Interoperability Specification 2.5",
      category: "INTEROPERABILITY",
      code: "SPEC-DIGI-UID-v2.5",
      size: "1.8 MB PDF",
      lastUpdated: "20 Dec 2025",
      department: "Ministry of Electronics & IT (MeitY)",
      description:
        "Technical schema standards for cryptographic XML payload verification, e-Sign validation, and tamper-evident PDF document hash matching.",
      status: "ACTIVE",
    },
    {
      id: "res-4",
      title: "Name & Date of Birth Mismatch Adjudication Matrix",
      category: "ESCALATION",
      code: "MATRIX-ADJ-2026-04",
      size: "820 KB PDF",
      lastUpdated: "12 Feb 2026",
      department: "Directorate General of Income Tax (Systems)",
      description:
        "Official guidelines for resolving discrepancies between application records, DigiLocker verified Aadhaar, and secondary educational certificates.",
      status: "ACTIVE",
    },
    {
      id: "res-5",
      title: "Return for Correction: Standard Defect Taxonomy & Citizen Guidance",
      category: "SOP",
      code: "SOP-DEFECT-2026-01",
      size: "1.2 MB PDF",
      lastUpdated: "08 Jan 2026",
      department: "Citizen Services Division, CBDT",
      description:
        "Standardized reason codes and approved explanations when returning applications to citizens for blurry documents or signature mismatches.",
      status: "ACTIVE",
    },
    {
      id: "res-6",
      title: "Protean & UTIITSL Downstream Integration Technical Architecture",
      category: "INTEROPERABILITY",
      code: "ARCH-PRT-UTI-2025",
      size: "3.5 MB PDF",
      lastUpdated: "18 Nov 2025",
      department: "Centralized Systems Unit",
      description:
        "Protocol specifications for secure SFTP batch processing, PAN generation acknowledgment callbacks, and India Post tracking number synchronization.",
      status: "ADVISORY",
    },
  ];

  const filteredResources = resources.filter((res) => {
    if (selectedCategory !== "ALL" && res.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        res.title.toLowerCase().includes(q) ||
        res.code.toLowerCase().includes(q) ||
        res.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDownload = (doc: ResourceDoc) => {
    toast.success(`Downloading ${doc.code}`, {
      description: `${doc.title} (${doc.size}) has been fetched securely from CBDT central repository.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 shadow-2xs">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Department Resources & Guidelines
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Official CBDT manuals, statutory circulars, and standard operating procedures
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>CBDT Repository v2.4 (Active)</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars, SOPs, codes, or keywords..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar text-xs">
            {[
              { id: "ALL", label: "All Resources" },
              { id: "STATUTORY", label: "Statutory Directives" },
              { id: "SOP", label: "Standard Operating Procedures" },
              { id: "ESCALATION", label: "Adjudication Matrices" },
              { id: "INTEROPERABILITY", label: "API Standards" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                  selectedCategory === tab.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {filteredResources.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between group hover:border-blue-300 shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {doc.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      doc.status === "MANDATORY"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : doc.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{doc.description}</p>

                <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Building className="w-3 h-3 text-slate-400" />
                    <span>{doc.department}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Updated {doc.lastUpdated}</span>
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80 mt-4 flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-slate-500">{doc.size}</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
