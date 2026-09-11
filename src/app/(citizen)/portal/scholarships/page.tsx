"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Check,
  FileCheck2,
  Printer,
  ExternalLink,
  Lock,
  Sparkles,
  ArrowLeft,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSevaSaarthi } from "@/lib/store/formly-store";

export default function GovernmentScholarshipPortal() {
  const { profileFields, user } = useSevaSaarthi();

  // Agent States: IDLE, RUNNING, PAUSED, AWAITING_APPROVAL, SUBMITTED, CANCELLED
  const [agentStatus, setAgentStatus] = useState<"IDLE" | "RUNNING" | "PAUSED" | "AWAITING_APPROVAL" | "SUBMITTED" | "CANCELLED">("RUNNING");
  const [currentFieldKey, setCurrentFieldKey] = useState<string | null>("fullName");
  const [currentActionText, setCurrentActionText] = useState("Initializing Seva Saarthi AI Agent...");
  const [progressPercent, setProgressPercent] = useState(5);
  const [typingSpeed, setTypingSpeed] = useState<number>(35);

  // Form Fields State
  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    gender: "Male",
    aadhaarNo: "",
    mobile: "",
    email: "",
    domicileState: "Delhi (NCT)",
    institution: "",
    course: "",
    rollNo: "",
    annualIncome: "",
    category: "OBC / BC",
    bankAccount: "",
    bankIfsc: "",
    bankName: "State Bank of India",
  });

  // Attached Documents State
  const [attachedDocs, setAttachedDocs] = useState({
    aadhaar: false,
    income: false,
    collegeId: false,
    marksheet: false,
  });

  const [generatedAppId, setGeneratedAppId] = useState<string | null>(null);
  const isPausedRef = useRef(false);

  // Helper to extract actual citizen profile fields with fallback
  const getProfileVal = (fieldName: string, fallback: string) => {
    const match = profileFields.find((p) => p.field_name === fieldName);
    return match && match.value && match.value.trim().length > 0 ? match.value : fallback;
  };

  const rawDob = getProfileVal("date_of_birth", "2001-08-15");
  let formattedDob = rawDob;
  if (rawDob.includes("-")) {
    const parts = rawDob.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      formattedDob = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  // Target Profile Data to Auto-Fill (From Verified Citizen Vault)
  const targetData = {
    fullName: getProfileVal("full_name", user?.name || "Citizen Applicant"),
    dob: formattedDob,
    gender: getProfileVal("gender", "Male"),
    aadhaarNo: getProfileVal("aadhaar_number", "5492 8173 9012"),
    mobile: getProfileVal("phone_number", user?.phone || "9876543210"),
    email: getProfileVal("email", user?.email || "citizen@formly.in"),
    domicileState: getProfileVal("location", "Delhi (NCT)"),
    institution: getProfileVal("college_name", "National Institute of Technology"),
    course: getProfileVal("education_degree", "B.Tech Computer Science & Engineering"),
    rollNo: getProfileVal("roll_number", "22071A0589"),
    annualIncome: getProfileVal("annual_income", "180000"),
    category: getProfileVal("caste_category", "OBC / BC"),
    bankAccount: getProfileVal("bank_account_no", "38491029481"),
    bankIfsc: getProfileVal("bank_ifsc", "SBIN0012948"),
    bankName: "State Bank of India",
  };

  // Helper to type text character by character into a field
  const typeText = async (key: keyof typeof formData, text: string) => {
    setCurrentFieldKey(key);
    for (let i = 1; i <= text.length; i++) {
      while (isPausedRef.current) {
        await new Promise((r) => setTimeout(r, 100));
      }
      setFormData((prev) => ({ ...prev, [key]: text.slice(0, i) }));
      await new Promise((r) => setTimeout(r, typingSpeed));
    }
    await new Promise((r) => setTimeout(r, 150));
  };

  // Main autonomous typing sequencer
  useEffect(() => {
    let isCancelled = false;

    const runAgentSequence = async () => {
      await new Promise((r) => setTimeout(r, 600));
      if (isCancelled) return;

      // 1. Full Name
      setCurrentActionText("Typing Full Name as per Aadhaar records...");
      setProgressPercent(10);
      await typeText("fullName", targetData.fullName);

      // 2. Date of Birth
      setCurrentActionText("Entering Date of Birth...");
      setProgressPercent(20);
      await typeText("dob", targetData.dob);

      // 3. Aadhaar Number
      setCurrentActionText("Filling 12-digit Aadhaar UIDAI Number...");
      setProgressPercent(30);
      await typeText("aadhaarNo", targetData.aadhaarNo);

      // 4. Mobile & Email
      setCurrentActionText("Entering Mobile Number & Email Address...");
      setProgressPercent(40);
      await typeText("mobile", targetData.mobile);
      await typeText("email", targetData.email);

      // 5. Institution & Course
      setCurrentActionText("Selecting Academic Institution & Degree Course...");
      setProgressPercent(55);
      await typeText("institution", targetData.institution);
      await typeText("course", targetData.course);
      await typeText("rollNo", targetData.rollNo);

      // 6. Annual Income & Category
      setCurrentActionText("Filling Annual Family Income & Reservation Category...");
      setProgressPercent(70);
      await typeText("annualIncome", targetData.annualIncome);

      // 7. Bank Details
      setCurrentActionText("Filling Bank Account Number & IFSC for DBT Seeding...");
      setProgressPercent(85);
      await typeText("bankAccount", targetData.bankAccount);
      await typeText("bankIfsc", targetData.bankIfsc);

      // 8. Attach Documents
      setCurrentActionText("Attaching verified vault documents (PDFs)...");
      setProgressPercent(95);
      setAttachedDocs({ aadhaar: true, income: true, collegeId: true, marksheet: true });
      await new Promise((r) => setTimeout(r, 800));

      // 9. Complete -> Pause at Human Approval Gate
      setCurrentFieldKey(null);
      setProgressPercent(100);
      setCurrentActionText("All 14 fields filled. Halting before submission for human authorization.");
      setAgentStatus("AWAITING_APPROVAL");

      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    };

    runAgentSequence();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePauseToggle = () => {
    if (agentStatus === "RUNNING") {
      isPausedRef.current = true;
      setAgentStatus("PAUSED");
      setCurrentActionText("Agent paused by user.");
    } else if (agentStatus === "PAUSED") {
      isPausedRef.current = false;
      setAgentStatus("RUNNING");
      setCurrentActionText("Resuming auto-fill...");
    }
  };

  const handleApproveSubmit = () => {
    setAgentStatus("SUBMITTED");
    const appId = "NSP2026-" + Math.floor(1000000 + Math.random() * 9000000);
    setGeneratedAppId(appId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelSubmit = () => {
    setAgentStatus("CANCELLED");
    setCurrentActionText("Submission cancelled by user. No form submitted.");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* FLOATING SEVA SAARTHI AGENT CONTROL COMPANION BAR (STICKY AT TOP) */}
      <div className="sticky top-0 z-50 bg-slate-950 text-white shadow-2xl border-b-2 border-indigo-500">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center shadow-md animate-pulse">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wide text-white uppercase">Seva Saarthi Autonomous Agent</span>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                    agentStatus === "RUNNING" && "bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse",
                    agentStatus === "PAUSED" && "bg-slate-800 text-slate-300 border-slate-700",
                    agentStatus === "AWAITING_APPROVAL" && "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-bounce",
                    agentStatus === "SUBMITTED" && "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
                    agentStatus === "CANCELLED" && "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  )}
                >
                  {agentStatus === "RUNNING" && "● AUTOFILLING LIVE"}
                  {agentStatus === "PAUSED" && "PAUSED"}
                  {agentStatus === "AWAITING_APPROVAL" && "🛡️ WAITING FOR YOUR SUBMIT APPROVAL"}
                  {agentStatus === "SUBMITTED" && "✓ SUBMITTED TO GOVT PORTAL"}
                  {agentStatus === "CANCELLED" && "✕ CANCELLED"}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 truncate max-w-md font-mono mt-0.5">
                {currentActionText}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                  style={{ width: progressPercent + "%" }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-slate-300">{progressPercent}%</span>
            </div>

            {(agentStatus === "RUNNING" || agentStatus === "PAUSED") && (
              <button
                onClick={handlePauseToggle}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {agentStatus === "RUNNING" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{agentStatus === "RUNNING" ? "Pause" : "Resume"}</span>
              </button>
            )}

            <Link
              href="/dashboard"
              className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Seva Saarthi</span>
            </Link>
          </div>
        </div>
      </div>

      {/* REALISTIC GOVERNMENT PORTAL HEADER (National Scholarship Portal) */}
      <header className="bg-white border-b border-slate-200">
        <div className="h-1.5 bg-gradient-to-r from-orange-500 via-white to-emerald-600" />

        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shadow-xs">
              🏛️
            </div>
            <div>
              <div className="text-sm font-black tracking-tight text-blue-950 uppercase">
                National Scholarship Portal (NSP)
              </div>
              <div className="text-xs font-semibold text-slate-600">
                Ministry of Education & Social Justice, Government of India
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-slate-500 font-mono">
            <div>Official URL: <strong className="text-blue-900">scholarships.gov.in</strong></div>
            <div className="text-[11px] text-emerald-700 font-bold">● SSL Encrypted & Verified (NIC)</div>
          </div>
        </div>

        <div className="bg-[#1e3a8a] text-white px-6 py-2 text-xs font-bold">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="hover:underline cursor-pointer">Home</span>
              <span className="hover:underline cursor-pointer">About Schemes</span>
              <span className="text-amber-300 underline">Fresh Registration (2026-27)</span>
              <span className="hover:underline cursor-pointer">Renewal Application</span>
              <span className="hover:underline cursor-pointer">Student Login</span>
            </div>
            <span className="text-blue-200 text-[11px]">Helpline: 0120-6619540</span>
          </div>
        </div>
      </header>

      {/* MAIN PORTAL BODY */}
      <main className="max-w-6xl w-full mx-auto p-6 flex-1">
        {agentStatus === "SUBMITTED" ? (
          /* OFFICIAL ACKNOWLEDGEMENT RECEIPT */
          <div className="bg-white rounded-3xl border-2 border-emerald-400 p-8 shadow-xl space-y-6 animate-in zoom-in-95">
            <div className="text-center pb-6 border-b border-slate-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Official Submission Confirmed
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-2">
                Application Successfully Submitted to NSP
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Post Matric Scholarship Scheme for Higher Education • Academic Year 2026-27
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 font-mono text-xs">
              <div>
                <div className="text-[10px] text-slate-400 font-sans uppercase font-bold">Application Reference No</div>
                <div className="text-base font-black text-indigo-700">{generatedAppId}</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-sans uppercase font-bold">Applicant Full Name</div>
                <div className="text-sm font-bold text-slate-800">{formData.fullName}</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-sans uppercase font-bold">Aadhaar UIDAI Number</div>
                <div className="text-xs font-bold text-slate-800">{formData.aadhaarNo}</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-sans uppercase font-bold">Annual Family Income</div>
                <div className="text-xs font-bold text-emerald-700 font-bold">₹ 1,80,000 (Verified)</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-sans uppercase font-bold">Institution / College</div>
                <div className="text-xs font-bold text-slate-800 truncate">{formData.institution}</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-sans uppercase font-bold">Bank Account / DBT</div>
                <div className="text-xs font-bold text-slate-800">{formData.bankAccount} ({formData.bankIfsc})</div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs">
              <div className="font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>4 Attached Documents Forwarded for District Welfare Officer Verification:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-emerald-800 font-medium">
                <div>✓ Aadhaar_Card.pdf</div>
                <div>✓ Income_Certificate.pdf</div>
                <div>✓ College_ID.pdf</div>
                <div>✓ Marksheet.pdf</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="py-2.5 px-5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Acknowledgment</span>
              </button>

              <Link
                href="/dashboard"
                className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-200 transition-all hover:scale-102"
              >
                <span>Return to Seva Saarthi Dashboard</span>
              </Link>
            </div>
          </div>
        ) : (
          /* LIVE GOVERNMENT APPLICATION FORM */
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-lg font-black text-blue-950 uppercase tracking-tight">
                National Scholarship Application Form (Fresh 2026-27)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Please review all sections carefully. Fields marked with asterisks (*) are mandatory.
              </p>
            </div>

            {/* PART A: Registration & Identification */}
            <div className="space-y-4">
              <div className="bg-blue-50/80 p-2 px-3.5 rounded-xl border border-blue-100 text-xs font-bold text-blue-950">
                Part A: Applicant Identification & Personal Information
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Full Name (as per 10th / Aadhaar) *
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.fullName}
                    placeholder="Waiting for agent..."
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl border font-bold text-slate-900 transition-all",
                      currentFieldKey === "fullName"
                        ? "border-indigo-600 bg-indigo-50/60 ring-4 ring-indigo-500/20 shadow-md"
                        : "border-slate-200 bg-slate-50"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Date of Birth (DD/MM/YYYY) *
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.dob}
                    placeholder="DD/MM/YYYY"
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl border text-slate-900 transition-all",
                      currentFieldKey === "dob"
                        ? "border-indigo-600 bg-indigo-50/60 ring-4 ring-indigo-500/20 shadow-md"
                        : "border-slate-200 bg-slate-50"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Gender *
                  </label>
                  <select
                    disabled
                    value={formData.gender}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Aadhaar Number (UIDAI) *
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.aadhaarNo}
                    placeholder="xxxx xxxx xxxx"
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl border font-mono font-bold text-slate-900 transition-all",
                      currentFieldKey === "aadhaarNo"
                        ? "border-indigo-600 bg-indigo-50/60 ring-4 ring-indigo-500/20 shadow-md"
                        : "border-slate-200 bg-slate-50"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mobile Number (e-KYC Linked) *
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.mobile}
                    placeholder="9876543210"
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl border text-slate-900 transition-all",
                      currentFieldKey === "mobile"
                        ? "border-indigo-600 bg-indigo-50/60 ring-4 ring-indigo-500/20 shadow-md"
                        : "border-slate-200 bg-slate-50"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={formData.email}
                    placeholder="you@example.com"
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl border text-slate-900 transition-all",
                      currentFieldKey === "email"
                        ? "border-indigo-600 bg-indigo-50/60 ring-4 ring-indigo-500/20 shadow-md"
                        : "border-slate-200 bg-slate-50"
                    )}
                  />
                </div>
              </div>
            </div>

            {/* PART B: Academic Details */}
            <div className="space-y-4 pt-2">
              <div className="bg-blue-50/80 p-2 px-3.5 rounded-xl border border-blue-100 text-xs font-bold text-blue-950">
                Part B: Academic & Institution Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    College / University (AISHE Code / Name) *
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.institution}
                    placeholder="Select Institution..."
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl border font-semibold text-slate-900 transition-all",
                      currentFieldKey === "institution"
                        ? "border-indigo-600 bg-indigo-50/60 ring-4 ring-indigo-500/20 shadow-md"
                        : "border-slate-200 bg-slate-50"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Enrollment / Roll Number *
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.rollNo}
                    placeholder="22071A0589"
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl border font-mono text-slate-900 transition-all",
                      currentFieldKey === "rollNo"
                        ? "border-indigo-600 bg-indigo-50/60 ring-4 ring-indigo-500/20 shadow-md"
                        : "border-slate-200 bg-slate-50"
                    )}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Present Course / Degree *
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.course}
                    placeholder="Course name..."
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl border text-slate-900 transition-all",
                      currentFieldKey === "course"
                        ? "border-indigo-600 bg-indigo-50/60 ring-4 ring-indigo-500/20 shadow-md"
                        : "border-slate-200 bg-slate-50"
                    )}
                  />
                </div>
              </div>
            </div>

            {/* PART C: Income & Bank Account Details */}
            <div className="space-y-4 pt-2">
              <div className="bg-blue-50/80 p-2 px-3.5 rounded-xl border border-blue-100 text-xs font-bold text-blue-950">
                Part C: Income & Bank Account (DBT Direct Benefit Transfer)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Annual Family Income (INR) *
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.annualIncome ? "₹ " + formData.annualIncome : ""}
                    placeholder="₹ 1,80,000"
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl border font-bold text-emerald-700 transition-all",
                      currentFieldKey === "annualIncome"
                        ? "border-indigo-600 bg-indigo-50/60 ring-4 ring-indigo-500/20 shadow-md"
                        : "border-slate-200 bg-slate-50"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Bank Account Number *
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.bankAccount}
                    placeholder="38491029481"
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl border font-mono font-bold text-slate-900 transition-all",
                      currentFieldKey === "bankAccount"
                        ? "border-indigo-600 bg-indigo-50/60 ring-4 ring-indigo-500/20 shadow-md"
                        : "border-slate-200 bg-slate-50"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Bank IFSC Code *
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.bankIfsc}
                    placeholder="SBIN0012948"
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl border font-mono text-slate-900 transition-all",
                      currentFieldKey === "bankIfsc"
                        ? "border-indigo-600 bg-indigo-50/60 ring-4 ring-indigo-500/20 shadow-md"
                        : "border-slate-200 bg-slate-50"
                    )}
                  />
                </div>
              </div>
            </div>

            {/* PART D: Document Attachments */}
            <div className="space-y-4 pt-2">
              <div className="bg-blue-50/80 p-2 px-3.5 rounded-xl border border-blue-100 text-xs font-bold text-blue-950">
                Part D: Mandatory Document Attachments (PDF / Max 10MB)
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { label: "Aadhaar Card Scan", key: "aadhaar", filename: "Aadhaar_Card.pdf" },
                  { label: "Income Certificate", key: "income", filename: "Income_Certificate.pdf" },
                  { label: "College Bonafide/ID", key: "collegeId", filename: "College_ID.pdf" },
                  { label: "Semester Marksheet", key: "marksheet", filename: "Marksheet.pdf" },
                ].map((doc) => {
                  const isAttached = attachedDocs[doc.key as keyof typeof attachedDocs];
                  return (
                    <div
                      key={doc.key}
                      className={cn(
                        "p-3 rounded-xl border text-center transition-all",
                        isAttached
                          ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      )}
                    >
                      <FileCheck2 className={cn("w-5 h-5 mx-auto mb-1", isAttached ? "text-emerald-600" : "text-slate-300")} />
                      <div className="text-[11px] font-bold">{doc.label}</div>
                      <div className="text-[10px] truncate mt-0.5">{isAttached ? doc.filename : "Waiting..."}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* HUMAN-IN-THE-LOOP SUBMISSION AUTHORIZATION MODAL / BANNER */}
            {agentStatus === "AWAITING_APPROVAL" && (
              <div className="mt-8 p-6 bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50/50 border-2 border-amber-500 rounded-3xl shadow-xl space-y-4 animate-in zoom-in-95">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-amber-950">
                      Human Authorization Required: Confirm & Submit Application
                    </h3>
                    <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                      Seva Saarthi AI Agent has successfully filled all <strong>14 fields</strong> and attached <strong>4 documents</strong> on <strong>scholarships.gov.in</strong> for <strong>{formData.fullName}</strong>.
                    </p>
                  </div>
                </div>

                <div className="bg-white/90 p-4 rounded-2xl border border-amber-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">APPLICANT</span>
                    <span className="font-bold text-slate-800">{formData.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">AADHAAR UID</span>
                    <span className="font-mono text-slate-800">{formData.aadhaarNo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">FAMILY INCOME</span>
                    <span className="font-bold text-emerald-700">₹ 1,80,000</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">DBT ACCOUNT</span>
                    <span className="font-mono text-slate-800">{formData.bankAccount}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    onClick={handleCancelSubmit}
                    className="py-3 px-5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancel / Do Not Submit
                  </button>

                  <button
                    onClick={handleApproveSubmit}
                    className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all hover:scale-102"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Yes, Authorize & Submit Application</span>
                  </button>
                </div>
              </div>
            )}

            {agentStatus !== "AWAITING_APPROVAL" && (
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secure Submission Layer • NIC Government of India</span>
                </div>

                <button
                  type="button"
                  disabled
                  className="py-3 px-6 bg-slate-300 text-slate-500 rounded-xl text-xs font-bold cursor-not-allowed"
                >
                  Submit Application (Awaiting Agent Completion)
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
