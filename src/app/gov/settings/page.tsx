"use client";

import React, { useState } from "react";
import {
  Settings,
  Shield,
  Bell,
  User,
  KeyRound,
  Lock,
  CheckCircle2,
  HardDrive,
  Save,
  Laptop,
  Check,
} from "lucide-react";
import { useGov } from "@/lib/store/gov-store";
import { toast } from "sonner";

export default function GovernmentSettingsPage() {
  const { currentUser } = useGov();

  const [notificationSound, setNotificationSound] = useState(true);
  const [autoBatchAssignment, setAutoBatchAssignment] = useState(true);
  const [slaAlertThreshold, setSlaAlertThreshold] = useState("75");
  const [hardwareTokenActive, setHardwareTokenActive] = useState(true);
  const [biometricAudit, setBiometricAudit] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePreferences = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Officer desk preferences updated successfully", {
        description: "Your session and security parameters have been committed to the local audit store.",
      });
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 shadow-2xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Officer Settings & Workdesk Configuration
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage operational preferences, security tokens, and desk routing policies
            </p>
          </div>
        </div>

        <button
          onClick={handleSavePreferences}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 self-start md:self-auto"
        >
          {isSaving ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Officer Profile & Desk Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                SS
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">{currentUser.name}</div>
                <div className="text-xs text-blue-700 font-semibold">{currentUser.roleTitle}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">CBDT Hyderabad Regional Cell</div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Desk Identification Code
                </label>
                <div className="mt-1 font-mono font-bold text-slate-900 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  {currentUser.id}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Operational Email
                </label>
                <div className="mt-1 font-mono text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  {currentUser.email}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Regional Office & Jurisdiction
                </label>
                <div className="mt-1 text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200 font-medium">
                  {currentUser.office}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Digital Signature Certificate (DSC)
                </label>
                <div className="mt-1 bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-mono text-[11px] font-bold">DSC-IN-2026-9812-7042</div>
                      <div className="text-[10px] text-emerald-700">Valid through Dec 2027</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded">
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Security Session */}
          <div className="bg-[#0A1128] text-white rounded-3xl p-6 shadow-xs border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Shield className="w-4 h-4" />
              <span>Strict Role Isolation Enforced</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              You are authenticated as an authorized Government Employee. Citizen navigation and portal switching are strictly quarantined for this operational session.
            </p>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Client Host: 127.0.0.1</span>
              <span className="font-mono text-emerald-400 font-bold">● Formly-GovNet</span>
            </div>
          </div>
        </div>

        {/* Right Column: Workdesk Preferences & Policy Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notification & Dispatch Settings */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Bell className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Desk Alerts & Dispatch Triggers</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <div className="text-xs font-bold text-slate-900">Audio Chime on High-Priority Cases</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Play a distinctive alert tone when an urgent PAN exception arrives at your desk
                  </div>
                </div>
                <button
                  onClick={() => setNotificationSound(!notificationSound)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    notificationSound ? "bg-blue-600 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <div className="text-xs font-bold text-slate-900">Automated Case Batching</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Auto-pull verified applications from the regional queue when desk queue drops below 5
                  </div>
                </div>
                <button
                  onClick={() => setAutoBatchAssignment(!autoBatchAssignment)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    autoBatchAssignment ? "bg-blue-600 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900">SLA Breach Warning Threshold</div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                    {slaAlertThreshold}% SLA Consumed
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Highlight cases in amber when processing time crosses this threshold of the citizen charter SLA.
                </p>
                <input
                  type="range"
                  min="50"
                  max="90"
                  step="5"
                  value={slaAlertThreshold}
                  onChange={(e) => setSlaAlertThreshold(e.target.value)}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Security & Cryptographic Compliance */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Lock className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Security & Cryptographic Compliance</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <div className="text-xs font-bold text-slate-900">FIPS-140 Hardware Cryptographic Token</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Require USB hardware e-Token insertion for batch PAN approvals
                  </div>
                </div>
                <button
                  onClick={() => setHardwareTokenActive(!hardwareTokenActive)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    hardwareTokenActive ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <div className="text-xs font-bold text-slate-900">Immutable Audit Trail Logging</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Hash every case decision with officer ID, timestamp, and IP into the tamper-proof ledger
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  <Check className="w-3.5 h-3.5" />
                  <span>Always Enforced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
