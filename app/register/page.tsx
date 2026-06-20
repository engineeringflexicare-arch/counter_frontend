"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, Building2, User, Briefcase, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

// Loading Component
export function LoadingSpinner() {
  const numDots = 18;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center z-50 backdrop-blur-sm overflow-hidden">
      {/* Loader Container */}
      <div className="relative w-56 h-56 flex items-center justify-center">
        {/* Spinning Comet Tail */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "2s", animationTimingFunction: "linear" }}>
          {[...Array(numDots)].map((_, i) => {
            const rotation = (360 / numDots) * i;
            const dotSize = 2 + i * 0.5;
            const opacity = 0.1 + (i / numDots) * 0.9;

            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                style={{
                  width: `${dotSize}px`,
                  height: `${dotSize}px`,
                  opacity: opacity,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg) translateY(-100px)`,
                }}
              />
            );
          })}
        </div>

        {/* Rotating Ring */}
        <div className="absolute inset-10 rounded-full border-2 border-blue-300 border-l-blue-500" style={{ animation: "spin 3s linear infinite reverse" }} />

        {/* Center */}
        <div className="relative z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl border-2 border-blue-100">
          <span className="text-2xl">📋</span>
        </div>
      </div>

      {/* Text */}
      <div className="mt-10 text-center">
        <h2 className="text-white font-bold tracking-widest text-sm uppercase drop-shadow-lg">Processing...</h2>
        <p className="text-white text-opacity-70 text-xs mt-2">Submitting your request</p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSubmitError("");

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.department || !formData.position) {
      setSubmitError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    console.log("📋 Registration Data:", formData);
    console.log("🚀 API is calling to:", API_BASE_URL);

    try {
      // RegisterPage.tsx තුළ
      const response = await axios.post(`${API_BASE_URL}/api/users/register`, formData);

      console.log("✅ Registration Response:", response.data);

      // Show success message
      setSuccess(true);

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        department: "",
        position: "",
        reason: "",
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      console.error(err);
      let errorMessage = "Registration failed. Please try again.";

      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-green-50 to-slate-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-500">
                <CheckCircle className="text-green-600" size={40} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">Request Submitted!</h2>
            <p className="text-slate-600 mb-6">Your account request has been successfully submitted. Our admin team will review and contact you shortly.</p>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
              <p className="text-sm text-green-700">
                <strong>Email:</strong> {formData.email}
              </p>
              <p className="text-sm text-green-700 mt-2">Check your inbox for updates.</p>
            </div>

            <p className="text-slate-500 text-sm mb-4">Redirecting to login page...</p>

            <Link href="/login" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-2xl transition">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Loading Spinner */}
      {loading && <LoadingSpinner />}

      <div>
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
          <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Link href="/login" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-slate-100 border border-slate-200 transition shadow-sm">
                <ArrowLeft size={20} className="text-slate-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Create Your Account</h1>
                <p className="text-slate-500 text-sm">Fill in your details and request admin approval</p>
              </div>
            </div>

            {/* Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
              {/* Info Box */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex gap-3">
                <AlertCircle className="text-blue-600 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Account Request Required</p>
                  <p className="text-xs text-blue-700 mt-1">Your request will be reviewed by our admin team. You&apos;ll receive an email once your account is approved.</p>
                </div>
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-200 flex gap-3">
                  <span className="text-lg shrink-0">⚠️</span>
                  <span>{submitError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Row 1: First Name & Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <input
                        type="text"
                        name="firstName"
                        required
                        disabled={loading}
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full text-slate-900 pl-10 pr-4 py-3.5 rounded-2xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition"
                        placeholder="John"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <input
                        type="text"
                        name="lastName"
                        required
                        disabled={loading}
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full text-slate-900 pl-10 pr-4 py-3.5 rounded-2xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <input
                        type="email"
                        name="email"
                        required
                        disabled={loading}
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full text-slate-900 pl-10 pr-4 py-3.5 rounded-2xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <input
                        type="tel"
                        name="phone"
                        required
                        disabled={loading}
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full text-slate-900 pl-10 pr-4 py-3.5 rounded-2xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Department & Position */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <select
                        name="department"
                        required
                        disabled={loading}
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full text-slate-900 pl-10 pr-4 py-3.5 rounded-2xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition bg-white"
                      >
                        <option value="">Select Department</option>
                        <option value="HR">Human Resources</option>
                        <option value="IT">Information Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                        <option value="Sales">Sales</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Other">Engineering</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Position <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <input
                        type="text"
                        name="position"
                        required
                        disabled={loading}
                        value={formData.position}
                        onChange={handleChange}
                        className="w-full text-slate-900 pl-10 pr-4 py-3.5 rounded-2xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition"
                        placeholder="Senior Manager"
                      />
                    </div>
                  </div>
                </div>

                {/* Reason/Comments */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Information</label>
                  <textarea
                    name="reason"
                    disabled={loading}
                    value={formData.reason}
                    onChange={handleChange}
                    className="w-full text-slate-900 px-4 py-3.5 rounded-2xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition resize-none"
                    rows={4}
                    placeholder="Tell us why you need this account..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 rounded-2xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
                <p>
                  Already have an account?{" "}
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="text-center mt-6 text-xs text-slate-600">
              <p>🔒 Your information is secure and will only be used for account creation.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
