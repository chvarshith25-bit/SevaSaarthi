"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  CreditCard,
  CheckCircle2,
  Shield,
  ArrowRight,
  Sparkles,
  FileCheck2,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { toast } from "sonner";

interface ApplyPanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApplyPanModal({ isOpen, onClose }: ApplyPanModalProps) {
  const router = useRouter();
  const { user, profileFields } = useSevaSaarthi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentGranted, setConsentGranted] = useState(true);

  if (!isOpen) return null;

  const getProfileValue = (key: string, fallback: string) => {
    const field = profileFields.find((f) => f.field_name === key);
    return field?.value || fallback;
  };

  const fullName = user?.name || "Sai Sankeerth";
  const email = user?.email || "sankeerths615@gmail.com";
  const phone = user?.phone || getProfileValue("phone_number", "1234567890");
  const dob = getProfileValue("date_of_birth", "2004-07-23");
  const gender = getProfileValue("gender", "Male");
  const aadhaar = getProfileValue("aadhaar_number", "123456789876");
  const address = "H.No 4-12/A, Gandhi Nagar, Gachibowli";
  const city = "Hyderabad";
  const state = "Telangana";
  const pincode = "500081";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentGranted) {
      toast.error("Statutory consent is required under DPDP Act 2023.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/citizen/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantName: fullName,
          applicantEmail: email,
          applicantPhone: phone,
          consentGranted,
          citizenData: {
            fullName,
            fatherName: "Suresh Kumar",
            dateOfBirth: dob,
            gender,
            mobile: phone,
            email,
            aadhaarNumber: aadhaar,
            address,
            city,
            state,
            pincode,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.application) {
        toast.success(`PAN Application ${data.application.id} submitted successfully!`);
        onClose();
        router.push(`/applications/${data.application.id}/status`);
      } else {
        toast.error(data.error || "Failed to submit application");
      }
    } catch (err: any) {
      console.error("Apply PAN error:", err);
      toast.error("Network error submitting application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Instant PAN Card Application</h3>
              <p className="text-xs text-indigo-200 mt-0.5">Automated Pre-Flight & e-KYC Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Pre-filled Citizen Data summary */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pre-Filled from Your Citizen Profile</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Full Name:</span>
                <div className="font-bold text-slate-800">{fullName}</div>
              </div>
              <div>
                <span className="text-slate-400">DOB:</span>
                <div className="font-bold text-slate-800">{dob}</div>
              </div>
              <div>
                <span className="text-slate-400">Aadhaar UID:</span>
                <div className="font-bold text-slate-800 font-mono">XXXX XXXX {aadhaar.slice(-4)}</div>
              </div>
              <div>
                <span className="text-slate-400">Mobile:</span>
                <div className="font-bold text-slate-800">{phone}</div>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Delivery Address:</span>
                <div className="font-bold text-slate-800">{address}, {city}, {state} - {pincode}</div>
              </div>
            </div>
          </div>

          {/* Pre-flight Checks */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700">Pre-Flight Automated Checks</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-700 bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>e-Aadhaar Identity Proof pre-verified in Document Vault</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700 bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>DOB & Matriculation credential verified via DigiLocker</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700 bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-slate-500 italic">Simulated integration with CBDT PAN issuance pipeline (Demo Mode)</span>
              </div>
            </div>
          </div>

          {/* Statutory Consent */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 space-y-2">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="consentCheck"
                checked={consentGranted}
                onChange={(e) => setConsentGranted(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="consentCheck" className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none">
                <span className="font-bold text-slate-900 block mb-0.5">Statutory Consent Authorization</span>
                I hereby give consent to Seva Saarthi / Formly to authenticate my credentials with UIDAI and Income Tax Department under Section 6 of the Digital Personal Data Protection Act 2023 for statutory PAN issuance.
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !consentGranted}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{isSubmitting ? "Creating Application..." : "Submit PAN Application"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
