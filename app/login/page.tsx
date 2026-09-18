"use client";

import Image from "next/image";
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import FLoader from "../components/Floader";

export default function LoginPage() {
  const [employeeNumber, setEmployeeNumber] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    // ------------------------------------------
    // Validation
    // ------------------------------------------
    if (!employeeNumber || !password) {
      setError("Please enter both employee number and password.");
      return;
    }

    if (!API_BASE_URL) {
      setError("API configuration is missing.");
      return;
    }

    setLoading(true);

    try {
      // ----------------------------------------
      // Login API
      // ----------------------------------------
      const response = await axios.post(
        `${API_BASE_URL}/api/users/login`,
        {
          EmployeeNumber: employeeNumber,
          password: password,
        },
        {
          withCredentials: true,
          timeout: 30000,
        },
      );

      // ----------------------------------------
      // Response
      // ----------------------------------------
      const { success, token, role, user } = response.data;

      console.log("✅ Login response received");

      if (!success) {
        throw new Error(response.data?.message || "Login failed");
      }

      if (!token) {
        throw new Error("Login successful but authentication token was not returned.");
      }

      // ----------------------------------------
      // Normalize Role
      // ----------------------------------------
      const rawRole = role || user?.role || "";

      const finalRole = String(rawRole).toLowerCase();

      // ----------------------------------------
      // User Name
      // ----------------------------------------
      const finalName = (user?.FirstName ?? user?.firstName ?? user?.name ?? `${user?.FirstName ?? ""} ${user?.LastName ?? ""}`.trim()) || "Unknown User";

      // ----------------------------------------
      // Email
      // ----------------------------------------
      const finalEmail = user?.email ?? "";

      // ----------------------------------------
      // Department
      // ----------------------------------------
      const dept = String(user?.department || "").toLowerCase();

      // ========================================
      // LOCAL STORAGE
      // ========================================

      localStorage.setItem("token", token);

      localStorage.setItem("user", JSON.stringify(user));

      localStorage.setItem("userRole", finalRole);

      localStorage.setItem("userName", finalName);

      if (dept) {
        localStorage.setItem("userDepartment", dept);
      }

      if (finalEmail) {
        localStorage.setItem("userEmail", finalEmail);
      }

      // ========================================
      // COOKIE FOR NEXT.JS PROXY
      // ========================================
      //
      // IMPORTANT:
      // proxy.ts cannot read localStorage.
      // It can only read cookies.
      //
      // Therefore token must exist as a cookie
      // on the Vercel frontend domain.
      //
      // NOTE:
      // This cookie is NOT HttpOnly because it is
      // being created from browser JavaScript.
      //
      // If you later want full HttpOnly security,
      // authentication should be redesigned using
      // a same-origin Next.js API/BFF.
      // ========================================

      document.cookie = `token=${encodeURIComponent(token)}; ` + `path=/; ` + `max-age=28800; ` + `SameSite=Lax; ` + `Secure`;

      // ----------------------------------------
      // User Cookie
      // ----------------------------------------
      document.cookie =
        `user=${encodeURIComponent(
          JSON.stringify({
            role: finalRole,
            name: finalName,
            email: finalEmail,
          }),
        )}; ` +
        `path=/; ` +
        `max-age=28800; ` +
        `SameSite=Lax; ` +
        `Secure`;

      console.log("✅ Authentication data saved");

      console.log("👤 Role:", finalRole);

      console.log("🏢 Department:", dept);

      // ========================================
      // REDIRECT
      // ========================================

      if (finalRole === "admin") {
        router.replace("/Admin");
        return;
      }

      if (finalRole === "superuser") {
        router.replace("/Superuser");
        return;
      }

      if (finalRole === "supervisor") {
        if (dept.includes("assembly")) {
          router.replace("/assembly-supervisor");
          return;
        }

        if (dept.includes("production")) {
          router.replace("/production-supervisor");
          return;
        }

        router.replace("/Supervisor");
        return;
      }

      if (finalRole === "planner") {
        router.replace("/Planingsection");
        return;
      }

      router.replace("/dashboard");
    } catch (err: unknown) {
      console.error("❌ Login Error:", err);

      let errorMessage = "Login failed. Please check your credentials.";

      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || (err.code === "ECONNABORTED" ? "Server request timed out. Please try again." : errorMessage);
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // ----------------------------------------
      // IMPORTANT
      // ----------------------------------------
      // Only stop loading when login actually
      // fails.
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <FLoader />}

      <div>
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
          <div className="w-full max-w-md">
            <div className="flex justify-center mb-8"></div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
              <div className="text-center mb-8 flex flex-col items-center justify-center">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Flexicare</h2>

                <p className="text-slate-500 text-sm">Sign in to your Flexicare account</p>

                <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center border border-slate-200">
                  <Image
                    src="/logo.png"
                    alt="Flexicare Logo"
                    width={80}
                    height={80}
                    unoptimized
                    priority
                    style={{
                      width: "auto",
                      height: "auto",
                    }}
                    className="object-contain justify-center rounded-full mt-1 p-2"
                  />
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-200 flex gap-3">
                  <span className="text-lg">⚠️</span>

                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 rounded-2xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg mt-6"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">OR</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="text-center">
                <p className="text-sm text-slate-600 mb-4">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition">
                    Contact Admin
                  </Link>
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
                <p>🔒 Your account is secure and encrypted</p>
              </div>
            </div>

            <div className="text-center mt-6 text-xs text-slate-600">
              <p>© {new Date().getFullYear()} Flexicare. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
