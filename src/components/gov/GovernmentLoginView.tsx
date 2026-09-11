"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, User, ArrowRight, Building, CheckCircle2 } from "lucide-react";
import { GOV_ROLES } from "@/lib/store/gov-store";
import { GovernmentRole } from "@/types/government";
import { toast } from "sonner";

export function GovernmentLoginView() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("sankeerthvss@gmail.com");
  const [password, setPassword] = useState("1234567890");
  const [selectedRole, setSelectedRole] = useState<GovernmentRole>("OFFICER");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const performLogin = async (role: GovernmentRole, id: string) => {
    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/gov/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: id, password, role }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.token) {
          document.cookie = `FORMLY_GOV_SESSION=${data.token}; path=/; max-age=28800; SameSite=Lax`;
          document.cookie = `formly_gov_session=${data.token}; path=/; max-age=28800; SameSite=Lax`;
        }
        toast.success(`Authenticated as ${data.user?.roleTitle || GOV_ROLES[role].roleTitle} (${data.user?.name || GOV_ROLES[role].name})`);
        window.location.href = "/dashboard";
      } else {
        toast.error(data.error || "Authentication failed");
      }
    } catch {
      toast.error("Network error during authentication");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(selectedRole, employeeId);
  };

  return (
    <div className="min-h-screen bg-[#0A1128] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Indian Tricolor Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Brand Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-slate-950 font-black text-2xl mx-auto shadow-lg">
              ðŸ›ï¸
            </div>
            <h1 className="text-xl font-black tracking-wider uppercase text-white">
              FORMly GOVERNMENT
            </h1>
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
              Operations & Orchestration Portal
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">
                Employee / Officer ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">
                Secure Password / Smart Card Token
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Department:</span>
                <span className="font-bold text-slate-200">PAN Services (CBDT)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Selected Role:</span>
                <span className="font-bold text-amber-400">{GOV_ROLES[selectedRole].roleTitle}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 tracking-wide uppercase disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoggingIn ? "Authenticating..." : "Sign In to Government Portal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Officer Selection */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Quick Select Account:
              </span>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEmployeeId("sankeerthvss@gmail.com");
                    setPassword("1234567890");
                    setSelectedRole("OFFICER");
                  }}
                  className={`text-left text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center justify-between ${
                    employeeId === "sankeerthvss@gmail.com"
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                  }`}
                >
                  <span className="font-medium">Officer Sai Sankeerth</span>
                  <span className="font-mono text-[10px] text-slate-500">sankeerthvss@gmail.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmployeeId("OFF-PAN-7042");
                    setPassword("govsecure2026");
                    setSelectedRole("OFFICER");
                  }}
                  className={`text-left text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center justify-between ${
                    employeeId === "OFF-PAN-7042"
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                  }`}
                >
                  <span className="font-medium">Officer Sai Sankeerth</span>
                  <span className="font-mono text-[10px] text-slate-500">OFF-PAN-7042</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Security Footnote */}
        <div className="text-center text-[11px] text-slate-500">
          Statutory Government Operations System â€¢ Authorized CBDT Personnel Only
        </div>
      </div>
    </div>
  );
}

