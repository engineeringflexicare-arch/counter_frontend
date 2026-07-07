"use client";
import React, { useState, useSyncExternalStore } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

// --- External store helper for reading saved email (hydration-safe) ---
const noopSubscribe = () => () => {};
const getSavedEmailSnapshot = () => localStorage.getItem("userEmail") || "";
const getSavedEmailServerSnapshot = () => "";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");
  const [manualEmail, setManualEmail] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();

  // ✅ Auto-filled email from localStorage (no useEffect/setState needed)
  const savedEmail = useSyncExternalStore(noopSubscribe, getSavedEmailSnapshot, getSavedEmailServerSnapshot);

  // User manually typed something takes priority, otherwise fall back to saved email
  const email = manualEmail !== null ? manualEmail : savedEmail;

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/api/users/forgot-password", { email });
      setSuccess(response.data.message || "OTP sent successfully to your email.");
      setStep(2);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to send OTP. Please check your email.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!otp.trim() || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP code.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/api/users/verify-otp", { email, otp });
      setSuccess(response.data.message || "OTP verified successfully. Redirecting...");

      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
      }, 1000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Invalid or expired OTP.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{step === 1 ? "Forgot Password" : "Enter OTP"}</h2>
            <p className="text-slate-500 text-sm">{step === 1 ? "Enter your email address to receive a verification code." : "Enter the 6-digit verification code sent to your email."}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-200 flex gap-3 items-start">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm rounded-2xl border border-green-200 flex gap-3 items-start">
              <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-70">
                {loading ? "Sending..." : "Send Verification Code"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Verification Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-800" />
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none tracking-widest"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">Check your email inbox or spam folder.</p>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-70">
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
