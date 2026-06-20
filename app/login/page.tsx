"use client";

import Image from "next/image";
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import FLoader from "../components/Floader";

// Full Screen CometTail Loader Component

export default function LoginPage() {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    if (!employeeNumber || !password) {
      setError("Please enter both employee number and password.");
      setLoading(false);
      return;
    }

    console.log("🔥 Employee Number:", employeeNumber);
    console.log("🚀 API is calling to:", API_BASE_URL);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/login`, {
        EmployeeNumber: employeeNumber,
        password: password,
      });

      console.log("🔥 Backend Login Response:", response.data);

      const { token, role, Role, name, Firstname, user } = response.data;

      const finalRole = role || Role || (user && user.Role) || "User";
      const finalName = name || Firstname || (user && user.Firstname) || "Unknown User";

      console.log("✅ Saved to LocalStorage -> Name:", finalName, "| Role:", finalRole);

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", finalRole);
      localStorage.setItem("userName", finalName);

      // Redirect after 1s
      setTimeout(() => {
        switch (finalRole) {
          case "Admin":
            router.push("/Admin");
            break;
          case "Superuser":
            router.push("/Superuser");
            break;
          case "Supervisor":
            router.push("/Supervisor");
            break;
          default:
            router.push("/dashboard");
        }
      }, 1000);

      // මෙහිදී setLoading(false) කරන්නේ නැත. Page එක redirect වෙනකම් Loader එක පෙන්වයි.
    } catch (err: unknown) {
      console.error(err);

      // Error එකක් ආවොත් පමණක් Loader එක නවත්වන්න
      setLoading(false);

      let errorMessage = "Login failed. Please check your credentials.";

      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  return (
    <>
      {/* Full Screen CometTail Loader */}
      {loading && <FLoader />}

      <div>
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
          <div className="w-full max-w-md">
            {/* Logo Section */}
            <div className="flex justify-center mb-8"></div>

            {/* Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
              {/* Header */}
              <div className="text-center mb-8 flex flex-col items-center justify-center">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Flexicare</h2>
                <p className="text-slate-500 text-sm">Sign in to your Flexicare account</p>
                <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center border border-slate-200">
                  <Image src="/logo.png" alt="Flexicare Logo" width={80} height={80} className="object-contain justify-center rounded-full mt-1 p-2" />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-200 flex gap-3">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Employee Number Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Employee Number</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input
                      type="text"
                      required
                      disabled={loading}
                      value={employeeNumber}
                      onChange={(e) => setEmployeeNumber(e.target.value)}
                      className="w-full text-slate-900 pl-10 pr-4 py-3.5 rounded-2xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition"
                      placeholder="Enter your employee ID"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-slate-700">Password</label>
                    <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      disabled={loading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-slate-900 pl-10 pr-12 py-3.5 rounded-2xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 rounded-2xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg mt-6"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-xs text-slate-400">OR</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              {/* Additional Options */}
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-4">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition">
                    Contact Admin
                  </Link>
                </p>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
                <p>🔒 Your account is secure and encrypted</p>
              </div>
            </div>

            {/* Bottom Text */}
            <div className="text-center mt-6 text-xs text-slate-600">
              <p>© {new Date().getFullYear()} Flexicare. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
