"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Globe,
  Terminal,
  ShieldCheck,
  Zap,
  ArrowRight,
  FileCheck2,
  ExternalLink,
  Sparkles,
  Check,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { AgentStepLog, AgentState } from "@/lib/agent/browser-agent";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BrowserAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName?: string;
  portalUrl?: string;
  portalDomain?: string;
}

export function BrowserAgentModal({
  isOpen,
  onClose,
  serviceName = "Post Matric Scholarship",
  portalUrl = "https://scholarships.gov.in",
  portalDomain = "scholarships.gov.in",
}: BrowserAgentModalProps) {
  const { user, profileFields, documents, resetToPreset } = useSevaSaarthi();

  const [agentState, setAgentState] = useState<AgentState>("IDLE");
  const [logs, setLogs] = useState<AgentStepLog[]>([]);
  const [filledFields, setFilledFields] = useState<Record<string, string>>({});
  const [activeFillingKey, setActiveFillingKey] = useState<string | null>(null);
  const [generatedAppId, setGeneratedAppId] = useState<string | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const applicant = {
    fullName: profileFields.find((f) => f.field_name === "full_name")?.value || user?.name || "Applicant",
    dob: profileFields.find((f) => f.field_name === "date_of_birth")?.value || "",
    gender: profileFields.find((f) => f.field_name === "gender")?.value || "Male",
    aadhaarNo: profileFields.find((f) => f.field_name === "aadhaar_number")?.value || "",
    phone: profileFields.find((f) => f.field_name === "phone_number")?.value || user?.phone || "",
    email: profileFields.find((f) => f.field_name === "email")?.value || user?.email || "",
    income: profileFields.find((f) => f.field_name === "annual_income")?.value || "",
    college: profileFields.find((f) => f.field_name === "college_name")?.value || "",
    course: profileFields.find((f) => f.field_name === "education_degree")?.value || "",
    rollNo: profileFields.find((f) => f.field_name === "roll_number")?.value || "",
    bankAccount: profileFields.find((f) => f.field_name === "bank_account_no")?.value || "",
    bankIfsc: profileFields.find((f) => f.field_name === "bank_ifsc")?.value || "",
  };

  const addLog = (type: AgentStepLog["type"], message: string, field?: string, value?: string) => {
    const newLog: AgentStepLog = {
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
      type,
      message,
      field,
      value,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // Scroll terminal to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Run the agent automation pipeline
  const runAgent = async () => {
    setAgentState("INITIALIZING");
    setLogs([]);
    setFilledFields({});
    setActiveFillingKey(null);
    setGeneratedAppId(null);

    addLog("INFO", `Initializing Seva Saarthi Autonomous Browser Agent v2.4...`);
    await new Promise((r) => setTimeout(r, 600));

    setAgentState("LAUNCHING_BROWSER");
    addLog("INFO", `Launching Playwright browser session (Chromium instance)...`);
    await new Promise((r) => setTimeout(r, 800));

    setAgentState("NAVIGATING");
    addLog("NAVIGATE", `Navigating to official portal: ${portalUrl}/fresh/registration2026`);
    await new Promise((r) => setTimeout(r, 1000));

    setAgentState("INSPECTING_DOM");
    addLog("INFO", `Portal loaded (HTTP 200). Inspecting DOM tree: 10 form controls identified.`);
    await new Promise((r) => setTimeout(r, 700));

    setAgentState("AUTOFILLING_FIELDS");

    // Field 1: Name
    setActiveFillingKey("fullName");
    addLog("ACTION", `Filling #applicant_name with verified value "${applicant.fullName}"`, "fullName", applicant.fullName);
    setFilledFields((prev) => ({ ...prev, fullName: applicant.fullName }));
    await new Promise((r) => setTimeout(r, 600));

    // Field 2: DOB
    setActiveFillingKey("dob");
    addLog("ACTION", `Filling #dob with verified value "${applicant.dob}"`, "dob", applicant.dob);
    setFilledFields((prev) => ({ ...prev, dob: applicant.dob }));
    await new Promise((r) => setTimeout(r, 600));

    // Field 3: Aadhaar UID
    setActiveFillingKey("aadhaarNo");
    addLog("ACTION", `Filling #aadhaar_uid with verified value "${applicant.aadhaarNo}"`, "aadhaarNo", applicant.aadhaarNo);
    setFilledFields((prev) => ({ ...prev, aadhaarNo: applicant.aadhaarNo }));
    await new Promise((r) => setTimeout(r, 600));

    // Field 4: Mobile & Email
    setActiveFillingKey("phone");
    addLog("ACTION", `Filling #mobile_number with "${applicant.phone}"`, "phone", applicant.phone);
    setFilledFields((prev) => ({ ...prev, phone: applicant.phone, email: applicant.email }));
    await new Promise((r) => setTimeout(r, 600));

    // Field 5: Annual Income
    setActiveFillingKey("income");
    addLog("ACTION", `Filling #annual_income with verified figure "₹ ${applicant.income}"`, "income", applicant.income);
    setFilledFields((prev) => ({ ...prev, income: applicant.income }));
    await new Promise((r) => setTimeout(r, 600));

    // Field 6: College & Degree
    setActiveFillingKey("college");
    addLog("ACTION", `Selecting #institution: "${applicant.college}" (${applicant.course})`, "college", applicant.college);
    setFilledFields((prev) => ({ ...prev, college: applicant.college, course: applicant.course, rollNo: applicant.rollNo }));
    await new Promise((r) => setTimeout(r, 600));

    // Field 7: Bank & IFSC
    setActiveFillingKey("bankAccount");
    addLog("ACTION", `Filling #bank_account: "${applicant.bankAccount}" (IFSC: ${applicant.bankIfsc})`, "bankAccount", applicant.bankAccount);
    setFilledFields((prev) => ({ ...prev, bankAccount: applicant.bankAccount, bankIfsc: applicant.bankIfsc }));
    await new Promise((r) => setTimeout(r, 600));

    // Attaching Documents
    setAgentState("ATTACHING_DOCUMENTS");
    setActiveFillingKey("docs");
    addLog("ACTION", `Attaching verified document: Aadhaar_Card.pdf (Size: 142 KB, MIME: application/pdf)`);
    await new Promise((r) => setTimeout(r, 500));
    addLog("ACTION", `Attaching verified document: Income_Certificate.pdf (Certified < ₹2.5L)`);
    await new Promise((r) => setTimeout(r, 500));
    addLog("ACTION", `Attaching verified document: College_ID.pdf`);
    await new Promise((r) => setTimeout(r, 500));
    addLog("ACTION", `Attaching verified document: Marksheet.pdf`);
    await new Promise((r) => setTimeout(r, 700));

    // CRITICAL: Pause before submission and require user approval
    setActiveFillingKey(null);
    setAgentState("AWAITING_USER_APPROVAL");
    addLog("WARN", `⏸️ ALL 8 FIELDS & 4 ATTACHMENTS FILLED.`);
    addLog("APPROVAL", `🛡️ HUMAN APPROVAL GATE: Pausing execution. Awaiting user authorization to submit application.`);
  };

  // User authorizes submission
  const handleUserApprove = async () => {
    setAgentState("SUBMITTING");
    addLog("INFO", `User authorization received: "YES, SUBMIT"`);
    addLog("ACTION", `Agent clicking #btn-final-submit on ${portalDomain}...`);
    await new Promise((r) => setTimeout(r, 1200));

    const appId = `NSP2026-${Math.floor(1000000 + Math.random() * 9000000)}`;
    setGeneratedAppId(appId);
    setAgentState("COMPLETED");

    addLog("SUCCESS", `🎉 SIMULATED ACKNOWLEDGEMENT RECEIVED (Demo Mode)`);
    addLog("SUCCESS", `Application ID: ${appId}`);
    addLog("SUCCESS", `Timestamp: ${new Date().toISOString()} • Status: SUBMITTED`);

    toast.success(`Application submitted to Government portal! Application ID: ${appId}`, { duration: 6000 });
  };

  // User cancels submission
  const handleUserCancel = () => {
    setAgentState("ABORTED");
    addLog("WARN", `User selected "CANCEL / DO NOT SUBMIT".`);
    addLog("INFO", `Browser session safely closed without submitting.`);
    toast.info("Application submission cancelled. No data was sent to the government portal.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 text-white rounded-3xl max-w-5xl w-full h-[92vh] flex flex-col overflow-hidden border border-slate-800 shadow-2xl relative">
        {/* Top App Bar */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Seva Saarthi Autonomous Portal Agent</span>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.2 rounded-full",
                    agentState === "IDLE" && "bg-slate-800 text-slate-400",
                    agentState === "AWAITING_USER_APPROVAL" && "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse",
                    agentState === "COMPLETED" && "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
                    agentState === "ABORTED" && "bg-rose-500/20 text-rose-300 border border-rose-500/40",
                    (agentState === "INITIALIZING" || agentState === "LAUNCHING_BROWSER" || agentState === "NAVIGATING" || agentState === "INSPECTING_DOM" || agentState === "AUTOFILLING_FIELDS" || agentState === "ATTACHING_DOCUMENTS" || agentState === "SUBMITTING") && "bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse"
                  )}
                >
                  {agentState === "IDLE" && "READY"}
                  {agentState === "AWAITING_USER_APPROVAL" && "🟡 AWAITING YOUR APPROVAL"}
                  {agentState === "COMPLETED" && "🟢 SUBMITTED"}
                  {agentState === "ABORTED" && "🔴 CANCELLED"}
                  {agentState !== "IDLE" && agentState !== "AWAITING_USER_APPROVAL" && agentState !== "COMPLETED" && agentState !== "ABORTED" && "🤖 AGENT AUTOFILLING..."}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Target: <span className="text-slate-300 font-semibold">{serviceName}</span> ({portalDomain})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {agentState === "IDLE" && (
              <button
                onClick={runAgent}
                className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Agent</span>
              </button>
            )}

            {(agentState === "COMPLETED" || agentState === "ABORTED") && (
              <button
                onClick={runAgent}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-run Agent</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Browser URL bar */}
        <div className="px-5 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>

          <div className="flex-1 max-w-xl mx-auto flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate">{portalUrl}/fresh/registration2026</span>
          </div>

          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 shrink-0"
          >
            <span>Open in Tab</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Main Split Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 bg-slate-950">
          {/* Left Panel: Simulated Government Portal Web Page (7 cols) */}
          <div className="lg:col-span-7 border-r border-slate-800/80 flex flex-col min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
            {/* Government Portal Header */}
            <div className="bg-[#1e3a8a] text-white p-3 px-5 flex items-center justify-between border-b-2 border-amber-500">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-amber-300 font-bold text-xs">
                  🇮🇳
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    National Scholarship Portal (NSP)
                  </div>
                  <div className="text-[10px] text-blue-100">Ministry of Education, Government of India</div>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-blue-900/80 px-2 py-0.5 rounded text-blue-200">
                FY 2026-27
              </span>
            </div>

            {/* Portal Content Form */}
            <div className="p-5 space-y-4 flex-1">
              {agentState === "COMPLETED" ? (
                /* Success Acknowledgement Card */
                <div className="p-6 bg-white rounded-2xl border border-emerald-200 shadow-sm text-center space-y-3 animate-in zoom-in-95">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Application Submitted Successfully!</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Your application for Post Matric Scholarship has been recorded on the National Scholarship Portal.
                  </p>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800">
                    <div className="text-slate-500 text-[10px] uppercase font-sans">Application Reference No</div>
                    <div className="text-sm font-black text-indigo-700">{generatedAppId}</div>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Confirmation SMS dispatched to +91 {applicant.phone}
                  </div>
                </div>
              ) : (
                /* Registration Form with Real-time Auto-fill Highlights */
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 text-xs">
                  <div className="pb-2 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-800">Fresh Registration & Scholarship Form</span>
                    <span className="text-[10px] text-slate-500">All fields mandatory (*)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        Applicant Full Name *
                      </label>
                      <input
                        readOnly
                        value={filledFields.fullName || ""}
                        placeholder="Waiting for agent..."
                        className={cn(
                          "w-full p-2 bg-slate-50 border rounded-lg font-semibold transition-all",
                          activeFillingKey === "fullName" ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50" : "border-slate-300"
                        )}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        Date of Birth (DD/MM/YYYY) *
                      </label>
                      <input
                        readOnly
                        value={filledFields.dob || ""}
                        placeholder="Waiting for agent..."
                        className={cn(
                          "w-full p-2 bg-slate-50 border rounded-lg transition-all",
                          activeFillingKey === "dob" ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50" : "border-slate-300"
                        )}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        Aadhaar Number (UIDAI) *
                      </label>
                      <input
                        readOnly
                        value={filledFields.aadhaarNo || ""}
                        placeholder="Waiting for agent..."
                        className={cn(
                          "w-full p-2 bg-slate-50 border rounded-lg font-mono transition-all",
                          activeFillingKey === "aadhaarNo" ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50" : "border-slate-300"
                        )}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        Annual Family Income (INR) *
                      </label>
                      <input
                        readOnly
                        value={filledFields.income ? `₹ ${filledFields.income}` : ""}
                        placeholder="Waiting for agent..."
                        className={cn(
                          "w-full p-2 bg-slate-50 border rounded-lg font-bold text-emerald-700 transition-all",
                          activeFillingKey === "income" ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50" : "border-slate-300"
                        )}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        College / University Name *
                      </label>
                      <input
                        readOnly
                        value={filledFields.college || ""}
                        placeholder="Waiting for agent..."
                        className={cn(
                          "w-full p-2 bg-slate-50 border rounded-lg transition-all",
                          activeFillingKey === "college" ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50" : "border-slate-300"
                        )}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        Bank Account Number *
                      </label>
                      <input
                        readOnly
                        value={filledFields.bankAccount || ""}
                        placeholder="Waiting for agent..."
                        className={cn(
                          "w-full p-2 bg-slate-50 border rounded-lg font-mono transition-all",
                          activeFillingKey === "bankAccount" ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50" : "border-slate-300"
                        )}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        Bank IFSC Code *
                      </label>
                      <input
                        readOnly
                        value={filledFields.bankIfsc || ""}
                        placeholder="Waiting for agent..."
                        className={cn(
                          "w-full p-2 bg-slate-50 border rounded-lg font-mono transition-all",
                          activeFillingKey === "bankAccount" ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50" : "border-slate-300"
                        )}
                      />
                    </div>
                  </div>

                  {/* Attached Documents Preview */}
                  <div className="pt-2">
                    <label className="text-[10px] font-bold text-slate-600 block mb-1.5">
                      Attached Documents (4/4):
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {["Aadhaar_Card.pdf", "Income_Certificate.pdf", "College_ID.pdf", "Marksheet.pdf"].map((doc) => (
                        <div
                          key={doc}
                          className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-700"
                        >
                          <FileCheck2 className="w-3 h-3 text-emerald-600" />
                          <span className="truncate">{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button on Portal */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
                    <button
                      type="button"
                      disabled
                      className={cn(
                        "py-2.5 px-6 rounded-xl font-bold text-xs transition-all",
                        agentState === "AWAITING_USER_APPROVAL"
                          ? "bg-amber-500 text-white ring-4 ring-amber-400/40 animate-pulse cursor-not-allowed"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed"
                      )}
                    >
                      {agentState === "SUBMITTING" ? "Submitting..." : "Submit Application to NSP"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Agent Terminal Logs & Human Approval Prompt (5 cols) */}
          <div className="lg:col-span-5 flex flex-col min-h-0 bg-slate-950 p-4 border-t lg:border-t-0">
            {/* Terminal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-mono">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Agent Execution Stream</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{logs.length} events</span>
            </div>

            {/* Scrollable Logs Output */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[11px] leading-relaxed">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6 space-y-3">
                  <Zap className="w-8 h-8 text-indigo-500/50" />
                  <p className="text-xs">
                    Click &ldquo;Start Agent&rdquo; above to launch the autonomous browser automation pipeline.
                  </p>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      log.type === "INFO" && "bg-slate-900/80 text-slate-300",
                      log.type === "NAVIGATE" && "bg-blue-950/40 text-blue-300 border border-blue-900/50",
                      log.type === "ACTION" && "bg-indigo-950/40 text-indigo-200",
                      log.type === "WARN" && "bg-amber-950/40 text-amber-200 font-bold",
                      log.type === "APPROVAL" && "bg-amber-500/20 text-amber-300 border border-amber-500/40 p-3 font-bold",
                      log.type === "SUCCESS" && "bg-emerald-950/40 text-emerald-300 font-bold"
                    )}
                  >
                    <span className="text-[9px] text-slate-500 mr-2">[{log.timestamp}]</span>
                    <span>{log.message}</span>
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>

            {/* HUMAN-IN-THE-LOOP APPROVAL BOX (Crucial Requirement) */}
            {agentState === "AWAITING_USER_APPROVAL" && (
              <div className="mt-4 p-4 bg-gradient-to-br from-amber-950/90 to-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-xl space-y-3 animate-in zoom-in-95">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-200">
                      Authorize Portal Submission
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      Agent has filled 8 fields on <strong>{portalDomain}</strong> for <strong>{applicant.fullName}</strong>. Do you authorize final submission?
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleUserApprove}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/50 transition-all hover:scale-102"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Yes, Submit</span>
                  </button>

                  <button
                    onClick={handleUserCancel}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <span>Cancel / Abort</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
