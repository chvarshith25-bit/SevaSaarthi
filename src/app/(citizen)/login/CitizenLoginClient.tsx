"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  KeyRound,
  X,
  Send,
  Building2,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";

export default function CitizenLoginClient() {
  const router = useRouter();
  const { login } = useSevaSaarthi();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your registered email or citizen ID.");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Please enter your account password.");
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(email.trim(), password);
      if (success) {
        router.push("/dashboard");
      } else {
        setErrorMessage("Invalid email or password. Please verify your credentials.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage("");
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setTimeout(() => {
      setForgotOtpSent(true);
      setForgotLoading(false);
    }, 600);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setTimeout(() => {
      setForgotSuccess(true);
      setForgotLoading(false);
      setPassword(newPassword || "1234567890");
      setEmail(forgotEmail);
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setForgotOtpSent(false);
        setForgotSuccess(false);
      }, 1500);
    }, 600);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 bg-slate-50 overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-gradient-to-b from-indigo-100/60 via-blue-50/40 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Main Centered Login Card */}
      <div className="relative w-full max-w-md z-10">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl shadow-indigo-950/10 overflow-hidden">
          {/* Top Indian Tricolor Accent Strip */}
          <div className="h-1.5 w-full grid grid-cols-3">
            <div className="bg-[#FF9933]" />
            <div className="bg-white" />
            <div className="bg-[#138808]" />
          </div>

          <div className="p-7 sm:p-9">
            {/* Header / Brand Emblem */}
            <div className="text-center mb-7">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-lg shadow-indigo-500/25 mb-3.5 ring-4 ring-indigo-50">
                <Building2 className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Seva Saarthi
              </h1>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mt-0.5">
                नागरिक सेवा पोर्टल • Citizen Gateway
              </p>
              <p className="text-xs text-slate-500 mt-1.5 font-medium">
                Sign in to access your verified vault, schemes, and applications
              </p>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200/90 rounded-2xl flex items-start gap-2.5 text-xs font-semibold text-rose-700 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address or Citizen ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setIsForgotModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-600 font-semibold text-xs">Remember this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Citizen Portal</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Sign-in Chips */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Demo One-Click Credentials:</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoFill("chiluverivarshithsahs@gmail.com", "1234567890")}
                  className="flex-1 text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/70 hover:border-indigo-200 transition-all text-[11px] group cursor-pointer"
                >
                  <div className="font-bold text-slate-800 group-hover:text-indigo-700">Chiluveri Varshith</div>
                  <div className="text-[10px] text-slate-500 truncate">chiluverivarshithsahs@gmail.com</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill("sankeerths615@gmail.com", "1234567890")}
                  className="flex-1 text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/70 hover:border-indigo-200 transition-all text-[11px] group cursor-pointer"
                >
                  <div className="font-bold text-slate-800 group-hover:text-indigo-700">Sai Sankeerth</div>
                  <div className="text-[10px] text-slate-500 truncate">sankeerths615@gmail.com</div>
                </button>
              </div>
            </div>

            {/* Footer Sign Up Link */}
            <div className="text-center mt-6 text-xs text-slate-600 font-medium">
              Don&apos;t have a citizen account yet?{" "}
              <Link href="/signup" className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                Create an Account
              </Link>
            </div>
          </div>

          {/* Bottom Security Badge Strip */}
          <div className="bg-slate-50/90 border-t border-slate-100 px-6 py-3 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit Encrypted Government Citizen Gateway</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Recovery Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 relative">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2.5">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Reset Password</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {!forgotOtpSent ? "Enter your email to receive a verification code" : "Set your new account password"}
              </p>
            </div>

            {forgotSuccess ? (
              <div className="text-center py-4 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <div className="text-xs font-bold text-slate-900">Password Reset Successfully!</div>
                <div className="text-[11px] text-slate-500">You can now sign in with your updated password.</div>
              </div>
            ) : !forgotOtpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Recovery Code</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Enter OTP (Demo: Any 6 digits)</label>
                  <input
                    type="text"
                    required
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 tracking-widest text-center focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Confirm & Reset Password</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
