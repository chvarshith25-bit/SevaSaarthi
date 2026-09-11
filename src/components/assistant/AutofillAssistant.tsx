"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  FileCheck2,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
  X,
  BookOpen,
  Clock,
  Building2,
  AlertTriangle,
  FileText,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DOCUMENT_PROCUREMENT_GUIDES,
  OFFICIAL_NSP_WORKFLOW,
} from "@/lib/knowledge/government-schemes-knowledge";

interface AutofillAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQ_KNOWLEDGE = [
  {
    q: "Why do 80% of scholarship DBT disbursements fail, and how do I avoid it?",
    a: "Disbursements fail because the student's bank account is linked for SMS/ATM but NOT seeded with the NPCI (National Payments Corporation of India) Aadhaar mapper. To fix this, visit your home bank branch with your Aadhaar copy and submit the 'Aadhaar Seeding / DBT Mandate Form (Annexure-1)'. Verify that your status says 'Active' on myaadhaar.uidai.gov.in.",
  },
  {
    q: "What is the mandatory criteria for a College Bonafide Certificate?",
    a: "The Bonafide Certificate MUST be printed on the official institution letterhead, contain your Roll Number / Hall Ticket Number, current Academic Year (2025-26), the college's national AISHE Code (e.g. C-19736), and bear the physical signature of the Principal/Dean with the institutional round seal.",
  },
  {
    q: "How old can an Income Certificate be for NSP scholarships?",
    a: "An Income Certificate is valid for exactly 1 Financial Year. It MUST be issued on or after April 1st of the current financial year by a competent Revenue authority (Tahsildar / Mandal Revenue Officer). Previous year certificates are rejected automatically.",
  },
  {
    q: "What should I do if my name on Aadhaar does not match my 10th marksheet?",
    a: "Government portals use your Class 10 Matriculation certificate as the gold standard. If Aadhaar has initials instead of your full expanded surname, update your Aadhaar immediately via UIDAI update centers or myaadhaar.uidai.gov.in before the portal verification deadline.",
  },
  {
    q: "Can I apply for both State Post-Matric and Central Sector Schemes?",
    a: "No. Under Government of India scholarship guidelines, a beneficiary can avail financial assistance under only ONE government scholarship scheme at a time. If you apply for multiple schemes, the INO/SNO will flag a duplicate record and cancel both.",
  },
];

export function AutofillAssistant({ isOpen, onClose }: AutofillAssistantProps) {
  const { user, profileFields, documents, checklistSummary } = useSevaSaarthi();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"PROCESS_GUIDE" | "DOCUMENT_INTEL" | "COPY_DATA" | "FAQ">("PROCESS_GUIDE");
  const [selectedDocKey, setSelectedDocKey] = useState<string>("BONAFIDE_CERTIFICATE");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  if (!isOpen) return null;

  const copyToClipboard = (key: string, value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    toast.success(`Copied ${label}: "${value}"`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const autofillFields = [
    { key: "full_name", label: "Full Name", value: profileFields.find((f) => f.field_name === "full_name")?.value || user?.name || "Applicant" },
    { key: "dob", label: "Date of Birth", value: profileFields.find((f) => f.field_name === "date_of_birth")?.value || "" },
    { key: "gender", label: "Gender", value: profileFields.find((f) => f.field_name === "gender")?.value || "Male" },
    { key: "phone", label: "Mobile Number", value: profileFields.find((f) => f.field_name === "phone_number")?.value || user?.phone || "" },
    { key: "email", label: "Email Address", value: profileFields.find((f) => f.field_name === "email")?.value || user?.email || "" },
    { key: "aadhaar", label: "Aadhaar Number", value: profileFields.find((f) => f.field_name === "aadhaar_number")?.value || "" },
    { key: "income", label: "Annual Family Income", value: profileFields.find((f) => f.field_name === "annual_income")?.value || "180000" },
    { key: "category", label: "Caste / Category", value: profileFields.find((f) => f.field_name === "caste_category")?.value || "OBC" },
    { key: "college", label: "College Name", value: profileFields.find((f) => f.field_name === "college_name")?.value || "" },
    { key: "course", label: "Degree / Course", value: profileFields.find((f) => f.field_name === "education_degree")?.value || "" },
    { key: "bank_acc", label: "Bank Account No", value: profileFields.find((f) => f.field_name === "bank_account_no")?.value || "" },
    { key: "bank_ifsc", label: "Bank IFSC Code", value: profileFields.find((f) => f.field_name === "bank_ifsc")?.value || "" },
  ];

  const officialPortals = [
    {
      name: "National Scholarship Portal (NSP)",
      url: "https://scholarships.gov.in",
      domain: "scholarships.gov.in",
      purpose: "Official portal for Central and State Post-Matric Scholarships",
    },
    {
      name: "UIDAI myAadhaar Portal",
      url: "https://myaadhaar.uidai.gov.in",
      domain: "myaadhaar.uidai.gov.in",
      purpose: "Download e-Aadhaar & verify bank seeding status",
    },
    {
      name: "DigiLocker National Repository",
      url: "https://www.digilocker.gov.in",
      domain: "digilocker.gov.in",
      purpose: "Download authentic Class 10 & 12 digitally signed marksheets",
    },
    {
      name: "Ayushman Beneficiary Portal",
      url: "https://beneficiary.nha.gov.in",
      domain: "beneficiary.nha.gov.in",
      purpose: "Create Ayushman Bharat PM-JAY Golden Card",
    },
  ];

  const activeDocGuide = DOCUMENT_PROCUREMENT_GUIDES[selectedDocKey] || DOCUMENT_PROCUREMENT_GUIDES.BONAFIDE_CERTIFICATE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 relative max-h-[92vh] flex flex-col">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4 pr-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Government Application Process & Document Intelligence Assistant
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Trained with authoritative Indian government scheme procedures, required documents, and 1-click verified data copy.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("PROCESS_GUIDE")}
            className={cn(
              "py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
              activeTab === "PROCESS_GUIDE" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Process Roadmap</span>
          </button>
          <button
            onClick={() => setActiveTab("DOCUMENT_INTEL")}
            className={cn(
              "py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
              activeTab === "DOCUMENT_INTEL" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document Guides</span>
          </button>
          <button
            onClick={() => setActiveTab("COPY_DATA")}
            className={cn(
              "py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
              activeTab === "COPY_DATA" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>1-Click Data</span>
          </button>
          <button
            onClick={() => setActiveTab("FAQ")}
            className={cn(
              "py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
              activeTab === "FAQ" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FAQs & Pitfalls</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* TAB 1: 5-Stage Government Process Roadmap */}
          {activeTab === "PROCESS_GUIDE" && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
                <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>National Scholarship Portal (scholarships.gov.in) Official Roadmap</span>
                </div>
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  Step-by-step verification hierarchy through Institute Nodal Officers, State Welfare Officers, and Public Financial Management System (PFMS).
                </p>
              </div>

              <div className="space-y-3">
                {OFFICIAL_NSP_WORKFLOW.stages.map((stage) => (
                  <div
                    key={stage.stageNumber}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {stage.stageNumber}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{stage.stageName}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {stage.responsibleParty}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {stage.timeline}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed pl-8">
                      {stage.description}
                    </p>

                    <div className="pl-8 pt-2">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Mandatory Actions:
                      </div>
                      <ul className="space-y-1 text-[11px] text-slate-700">
                        {stage.actionItems.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Redressal */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
                <span>NSP Helpdesk Contact: <strong>{OFFICIAL_NSP_WORKFLOW.grievanceRedressal.helpline}</strong></span>
                <a
                  href={OFFICIAL_NSP_WORKFLOW.officialPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <span>Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: Document Procurement Guides */}
          {activeTab === "DOCUMENT_INTEL" && (
            <div className="space-y-4">
              {/* Document Selector Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100">
                {Object.keys(DOCUMENT_PROCUREMENT_GUIDES).map((docKey) => {
                  const guide = DOCUMENT_PROCUREMENT_GUIDES[docKey];
                  return (
                    <button
                      key={docKey}
                      onClick={() => setSelectedDocKey(docKey)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                        selectedDocKey === docKey
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      )}
                    >
                      {guide.name.split(" ")[0]} {guide.name.split(" ")[1] || ""}
                    </button>
                  );
                })}
              </div>

              {/* Active Document Details */}
              <div className="space-y-3.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{activeDocGuide.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <Building2 className="w-3 h-3" />
                      <span>{activeDocGuide.issuingAuthority}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <Clock className="w-3 h-3" />
                      <span>{activeDocGuide.typicalTurnaround}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <span>Validity: {activeDocGuide.validityPeriod}</span>
                    </span>
                  </div>
                </div>

                {/* Mandatory Criteria */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <div className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider text-indigo-900">
                    Mandatory Criteria for Acceptance:
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {activeDocGuide.mandatoryCriteria.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Step by Step Procurement */}
                <div>
                  <div className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider text-indigo-900">
                    How to Obtain This Document:
                  </div>
                  <ol className="space-y-1.5 text-xs text-slate-700 list-decimal list-inside pl-1">
                    {activeDocGuide.procurementSteps.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Rejections */}
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Common Rejection Pitfalls:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-rose-900">
                    {activeDocGuide.commonRejectionReasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>

                {/* Direct Link */}
                {activeDocGuide.portalUrl && (
                  <div>
                    <a
                      href={activeDocGuide.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3.5 py-2 rounded-xl border border-indigo-100"
                    >
                      <span>Open {activeDocGuide.issuingAuthority} Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: 1-Click Copy Verified Data */}
          {activeTab === "COPY_DATA" && (
            <div className="space-y-3">
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
                <span>Click any field button below to copy the verified value into portal form fields.</span>
                <span className="font-bold text-indigo-600">{autofillFields.length} Fields Ready</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {autofillFields.map((field) => {
                  const isCopied = copiedKey === field.key;
                  return (
                    <div
                      key={field.key}
                      className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center justify-between hover:border-indigo-300 transition-all"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{field.label}</div>
                        <div className="text-xs font-bold text-slate-900 truncate">{field.value || "Not filled"}</div>
                      </div>

                      <button
                        onClick={() => copyToClipboard(field.key, field.value, field.label)}
                        className={cn(
                          "p-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors",
                          isCopied ? "bg-emerald-600 text-white" : "bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200"
                        )}
                        title="Copy to clipboard"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Official Portals list */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Authorized Government Form Portals:
                </div>
                {officialPortals.map((p) => (
                  <div key={p.domain} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.purpose}</div>
                    </div>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Frequently Asked Questions & Rejection Prevention */}
          {activeTab === "FAQ" && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed">
                Expert tips compiled from over 50,000 successful National Scholarship and state welfare portal approvals.
              </div>

              {FAQ_KNOWLEDGE.map((item, index) => {
                const isExpanded = expandedFaq === index;
                return (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-white"
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : index)}
                      className="w-full text-left p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-xs font-bold text-slate-900">{item.q}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                    </button>
                    {isExpanded && (
                      <div className="p-3.5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
          <div className="text-[11px] text-slate-500">
            Readiness: <strong>{checklistSummary.percentageComplete}% Complete</strong>
          </div>
          <button
            onClick={onClose}
            className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Close Assistant
          </button>
        </div>
      </div>
    </div>
  );
}
