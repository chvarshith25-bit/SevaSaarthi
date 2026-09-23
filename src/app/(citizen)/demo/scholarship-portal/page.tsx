"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowRight,
  Upload,
  Sparkles,
} from "lucide-react";

export default function ScholarshipPortalDemo() {
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    aadhaar: "",
    mobile: "",
    email: "",
    income: "",
    college: "",
    course: "",
    rollNo: "",
    bankAccount: "",
    ifsc: "",
    captcha: "",
  });

  const [attachedFiles, setAttachedFiles] = useState<{
    aadhaar: { name: string; size: number } | null;
    income: { name: string; size: number } | null;
    collegeId: { name: string; size: number } | null;
    marksheet: { name: string; size: number } | null;
  }>({
    aadhaar: null,
    income: null,
    collegeId: null,
    marksheet: null,
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  // Poll actual DOM file inputs to detect real browser FileList assignments
  useEffect(() => {
    const checkInputs = () => {
      const getFileInfo = (id: string) => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (el && el.files && el.files.length > 0) {
          return { name: el.files[0].name, size: el.files[0].size };
        }
        return null;
      };

      setAttachedFiles({
        aadhaar: getFileInfo("upload_aadhaar"),
        income: getFileInfo("upload_income"),
        collegeId: getFileInfo("upload_college_id"),
        marksheet: getFileInfo("upload_marksheet"),
      });
    };

    const interval = setInterval(checkInputs, 500);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof attachedFiles) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachedFiles((prev) => ({
        ...prev,
        [key]: { name: e.target.files![0].name, size: e.target.files![0].size },
      }));
    } else {
      setAttachedFiles((prev) => ({
        ...prev,
        [key]: null,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const appId = `NSP-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedAppId(appId);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">
      {/* Official Government NSP Header */}
      <header className="bg-[#1e3a8a] text-white border-b-4 border-[#ff9933] shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white text-blue-900 font-bold flex items-center justify-center text-lg shadow-inner">
              🏛️
            </div>
            <div>
              <div className="text-sm font-black tracking-wide text-amber-300 uppercase">
                National Scholarship Portal (NSP 2.0)
              </div>
              <div className="text-xs text-blue-100 font-medium">
                Ministry of Electronics & Information Technology / Ministry of Education, Govt. of India
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-950 px-3 py-1 rounded-full text-blue-200 border border-blue-800 font-mono">
              Academic Year 2026-27
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6">
        {/* Notice Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
          <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">SevaSaarthi Chrome Extension Live Demo Portal:</span> This page contains genuine government portal form inputs and real <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono font-bold">&lt;input type=&quot;file&quot;&gt;</code> upload controls. Use the SevaSaarthi Extension popup or floating button to test end-to-end field autofill and real vault document attachments!
          </div>
        </div>

        {isSubmitted ? (
          <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Application Submitted Successfully!</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Your scholarship registration and all 4 attached statutory documents have been received and verified by the National Scholarship Cell.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-sm mx-auto font-mono">
              <div className="text-[11px] text-slate-500 uppercase">Application Reference Number</div>
              <div className="text-lg font-black text-indigo-700">{submittedAppId}</div>
            </div>
            <button
              onClick={() => setIsSubmitted(false)}
              className="mt-4 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
            >
              Reset & Test Again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg space-y-6">
            <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-black text-slate-900">Fresh Scholarship Registration Form</h1>
                <p className="text-xs text-slate-500">Form Scheme: Post-Matric Scholarship for Higher Education</p>
              </div>
              <span className="text-xs text-rose-600 font-bold">* All fields & documents required</span>
            </div>

            {/* SECTION 1: Personal Details */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>1. Applicant Personal & Demographic Information</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1" htmlFor="applicant_name">
                    Full Name of Applicant *
                  </label>
                  <input
                    id="applicant_name"
                    name="applicant_name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="As printed on Aadhaar / Marksheet"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1" htmlFor="dob">
                    Date of Birth (DD/MM/YYYY) *
                  </label>
                  <input
                    id="dob"
                    name="dob"
                    type="text"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    placeholder="DD/MM/YYYY"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1" htmlFor="aadhaar_uid">
                    Aadhaar Number (UIDAI 12-Digits) *
                  </label>
                  <input
                    id="aadhaar_uid"
                    name="aadhaar_uid"
                    type="text"
                    required
                    value={formData.aadhaar}
                    onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
                    placeholder="5839 2019 4821"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1" htmlFor="annual_income">
                    Annual Family Income (INR) *
                  </label>
                  <input
                    id="annual_income"
                    name="annual_income"
                    type="text"
                    required
                    value={formData.income}
                    onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                    placeholder="e.g. 180000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-emerald-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1" htmlFor="mobile_number">
                    Mobile Number *
                  </label>
                  <input
                    id="mobile_number"
                    name="mobile_number"
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="9876543210"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1" htmlFor="email_id">
                    Email ID *
                  </label>
                  <input
                    id="email_id"
                    name="email_id"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1" htmlFor="college_name">
                    College / Institute Name *
                  </label>
                  <input
                    id="college_name"
                    name="college_name"
                    type="text"
                    required
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    placeholder="e.g. Vidya Jyothi Institute of Technology"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1" htmlFor="course_degree">
                    Course / Degree Program *
                  </label>
                  <input
                    id="course_degree"
                    name="course_degree"
                    type="text"
                    required
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    placeholder="e.g. B.Tech Computer Science & Engineering"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1" htmlFor="roll_number">
                    Student Roll Number / Registration No *
                  </label>
                  <input
                    id="roll_number"
                    name="roll_number"
                    type="text"
                    required
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                    placeholder="e.g. 22071A0589"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1" htmlFor="bank_account">
                    Bank Account Number *
                  </label>
                  <input
                    id="bank_account"
                    name="bank_account"
                    type="text"
                    required
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    placeholder="38491029481"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1" htmlFor="bank_ifsc">
                    Bank IFSC Code *
                  </label>
                  <input
                    id="bank_ifsc"
                    name="bank_ifsc"
                    type="text"
                    required
                    value={formData.ifsc}
                    onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
                    placeholder="e.g. SBIN0012948"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Mandatory Document Uploads (Real File Inputs) */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Mandatory Document Attachments (Statutory Verification)
                </h2>
                <span className="text-[11px] text-indigo-600 font-bold">
                  {Object.values(attachedFiles).filter(Boolean).length} of 4 Attached
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Aadhaar */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800" htmlFor="upload_aadhaar">
                      Upload Aadhaar Card / Identity Proof *
                    </label>
                    {attachedFiles.aadhaar && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <FileCheck2 className="w-3 h-3" /> Attached
                      </span>
                    )}
                  </div>
                  <input
                    id="upload_aadhaar"
                    name="aadhaar_file"
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileChange(e, "aadhaar")}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {attachedFiles.aadhaar && (
                    <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
                      <span>📄 {attachedFiles.aadhaar.name}</span>
                      <span className="text-slate-400">({Math.round(attachedFiles.aadhaar.size / 1024)} KB)</span>
                    </div>
                  )}
                </div>

                {/* 2. Income Certificate */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800" htmlFor="upload_income">
                      Upload Income Certificate / Proof of Income *
                    </label>
                    {attachedFiles.income && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <FileCheck2 className="w-3 h-3" /> Attached
                      </span>
                    )}
                  </div>
                  <input
                    id="upload_income"
                    name="income_cert_file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, "income")}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {attachedFiles.income && (
                    <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
                      <span>📄 {attachedFiles.income.name}</span>
                      <span className="text-slate-400">({Math.round(attachedFiles.income.size / 1024)} KB)</span>
                    </div>
                  )}
                </div>

                {/* 3. College ID */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800" htmlFor="upload_college_id">
                      Upload College ID / Bonafide Certificate *
                    </label>
                    {attachedFiles.collegeId && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <FileCheck2 className="w-3 h-3" /> Attached
                      </span>
                    )}
                  </div>
                  <input
                    id="upload_college_id"
                    name="college_id_file"
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileChange(e, "collegeId")}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {attachedFiles.collegeId && (
                    <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
                      <span>📄 {attachedFiles.collegeId.name}</span>
                      <span className="text-slate-400">({Math.round(attachedFiles.collegeId.size / 1024)} KB)</span>
                    </div>
                  )}
                </div>

                {/* 4. Marksheet */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800" htmlFor="upload_marksheet">
                      Upload 10th / Matriculation Marksheet Memo *
                    </label>
                    {attachedFiles.marksheet && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <FileCheck2 className="w-3 h-3" /> Attached
                      </span>
                    )}
                  </div>
                  <input
                    id="upload_marksheet"
                    name="marksheet_file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, "marksheet")}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {attachedFiles.marksheet && (
                    <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
                      <span>📄 {attachedFiles.marksheet.name}</span>
                      <span className="text-slate-400">({Math.round(attachedFiles.marksheet.size / 1024)} KB)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: Declaration & Submit */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                <input id="consent" type="checkbox" defaultChecked className="mt-0.5 rounded text-indigo-600" />
                <span>
                  I hereby declare that the details furnished above and attached documents are true and authentic to the best of my knowledge.
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  id="btn-nsp-submit"
                  type="submit"
                  className="px-8 py-3 bg-[#1e3a8a] hover:bg-[#172554] text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Submit Application to NSP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
