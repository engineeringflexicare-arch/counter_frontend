"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Lock, User, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Backend වෙත ඉල්ලීම යැවීම
      const response = await axios.post("http://localhost:3000/api/users/login", {
        EmployeeNumber: employeeNumber,
        Password: password,
      });

      const { token, role, name } = response.data;

      // දත්ත සුරක්ෂිත කිරීම
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", role);
      localStorage.setItem("userName", name);

      // Role එක අනුව Redirect කිරීම
      switch (role) {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "Login failed. Please check your credentials.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">Welcome Flexicare</h2>
        <p className="text-center text-slate-500 mb-8">Please login to your account</p>

        {error && <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Employee Number Input */}
          <div>
            <label className="block text-sm font-medium text-slate-950 mb-2">Employee Number</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                required
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                className="w-full text-stone-950 pl-10 pr-4 py-3 rounded-2xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your ID"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-stone-950 pl-10 pr-4 py-3 rounded-2xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
