"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  X,
  Mail,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { StateEmblem } from "@/components/ui/StateEmblem";

export function GovernmentLoginView() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("sankeerthvss@gmail.com");
  const [password, setPassword] = useState("1234567890");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Forgot Password Modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim() || !password) {
      toast.error("Please enter both Employee ID and password");
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/gov/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: employeeId.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.token) {
          document.cookie = `FORMLY_GOV_SESSION=${data.token}; path=/; max-age=28800; SameSite=Lax`;
          document.cookie = `formly_gov_session=${data.token}; path=/; max-age=28800; SameSite=Lax`;
        }
        toast.success(`Welcome back, ${data.user?.name || "Officer"}!`);
        window.location.href = "/government/dashboard";
      } else {
        toast.error(data.error || "Invalid Employee ID or password");
      }
    } catch {
      toast.error("Network error during officer authentication");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error("Please enter your registered government email or officer ID");
      return;
    }

    setIsSubmittingReset(true);
    setTimeout(() => {
      setIsSubmittingReset(false);
      setResetSent(true);
      toast.success("Password recovery instructions sent to your registered official email");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0B132B] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Indian Tricolor Accent Stripe at Top */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex shadow-md">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Main Card */}
        <div className="bg-[#1C2541]/95 border border-slate-700/70 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-md space-y-6">
          {/* Header & Emblem */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
              <StateEmblem size={32} className="text-amber-400" />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
                <span>SARKAAR</span>
                <span className="text-amber-400">SEVA</span>
              </h1>
              <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                Government Officer Portal
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Employee / Officer ID */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Employee / Officer ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter Employee ID or Official Email"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white font-medium placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(employeeId);
                    setResetSent(false);
                    setForgotModalOpen(true);
                  }}
                  className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 hover:underline transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your secure password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white font-medium placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoggingIn ? "Authenticating..." : "Sign In to Sarkaar Seva"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Security Footnote */}
        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Statutory Government Operations System • Authorized Personnel Only</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#1C2541] border border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <KeyRound className="w-4 h-4" />
                <span>Reset Officer Password</span>
              </div>
              <button
                onClick={() => setForgotModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetSent ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-white">Password Reset Link Sent</h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                    We have sent a secure OTP and password recovery link to your registered official address.
                  </p>
                </div>
                <button
                  onClick={() => setForgotModalOpen(false)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your registered Employee ID or official email address. We will verify your government credentials and send instructions to reset your password.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Employee ID or Official Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="e.g. sankeerthvss@gmail.com or OFF-PAN-7042"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white font-medium placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReset}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <span>{isSubmittingReset ? "Sending..." : "Send Reset Link"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
