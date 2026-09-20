"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Building,
  MapPin,
  Mail,
  ShieldCheck,
  Shield,
  Key,
  Clock,
  LogOut,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useGov } from "@/lib/store/gov-store";
import { toast } from "sonner";

export default function GovernmentProfilePage() {
  const { currentUser, stats } = useGov();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await fetch("/api/gov/auth/logout", { method: "POST" });
      toast.info("Signed out from Government Operations Console");
      router.push("/government/login");
    } catch {
      router.push("/government/login");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/government/dashboard"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sovereign Officer Credentials</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Officer Profile & Authority
            </h1>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-center cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* 2. Primary Identity Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 lg:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
            {currentUser.name ? currentUser.name.charAt(0) : "S"}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{currentUser.name || "Sai Sankeerth"}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                ACTIVE STATUTORY OFFICER
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 font-semibold">
              Officer Code: <strong className="text-slate-800">{currentUser.id || "OFF-PAN-7042"}</strong>
            </p>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              Department & Division
            </span>
            <div className="font-bold text-slate-800 text-sm">
              {currentUser.department || "Income Tax Department (CBDT) - PAN Division"}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Jurisdictional Office
            </span>
            <div className="font-bold text-slate-800 text-sm">
              {currentUser.office || "Regional Processing Cell, Hyderabad"}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              Government Email (NIC)
            </span>
            <div className="font-mono font-bold text-slate-800 text-sm">
              {currentUser.email || "sai.sankeerth@incometax.gov.in"}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              Assigned Role & Title
            </span>
            <div className="font-bold text-slate-800 text-sm">
              {currentUser.roleTitle || "Department Officer"} ({currentUser.role || "OFFICER"})
            </div>
          </div>
        </div>

        {/* Statutory Delegation Scope */}
        <div className="p-5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
            <Key className="w-4 h-4 text-blue-600" />
            <span>Statutory Adjudication Delegation</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Authorized under Section 139A of the Income-tax Act, 1961 and Digital Personal Data Protection (DPDP) Act, 2023 to verify demographic proofs, cross-reference UIDAI & DigiLocker registries, and adjudicate identity issuance workflows.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-blue-800">
            <span className="bg-white px-2.5 py-1 rounded-md border border-blue-200">✓ Form 49A Adjudication</span>
            <span className="bg-white px-2.5 py-1 rounded-md border border-blue-200">✓ UIDAI e-KYC Verification</span>
            <span className="bg-white px-2.5 py-1 rounded-md border border-blue-200">✓ Exception Resolution Desk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
