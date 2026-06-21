"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Factory, Users, Activity, Cpu, TrendingUp, AlertTriangle, LayoutDashboard, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

// ==========================================
// Types
// ==========================================
interface DashboardStats {
  totalFactories: number;
  totalUsers: number;
  machinesOnline: number;
  totalMachines: number;
  productionToday: number;
}

interface SystemStatusItem {
  label: string;
  status: string;
}

interface AlertItem {
  message: string;
  level: "warning" | "danger" | "success";
}

interface PerformanceData {
  bestPerformingLine: string;
  activeMachines: string;
  shiftTargetAchievement: string;
  productionEfficiency: string;
  oee: string;
}

interface DashboardResponse {
  stats: DashboardStats;
  systemStatus: SystemStatusItem[];
  performance: PerformanceData;
  alerts: AlertItem[];
}

const ALERT_STYLES: Record<string, string> = {
  warning: "border-amber-500 bg-amber-500/10 text-amber-300",
  danger: "border-rose-500 bg-rose-500/10 text-rose-300",
  success: "border-emerald-500 bg-emerald-500/10 text-emerald-300",
};

// ==========================================
// Components
// ==========================================
function RadialGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex items-center gap-5 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90 shrink-0">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div>
        <p className={`text-3xl font-bold font-mono ${color}`}>{clamped}%</p>
        <p className="text-slate-400 text-sm mt-1">{label}</p>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-3 w-28 bg-slate-800 rounded" />
          <div className="h-8 w-16 bg-slate-800 rounded" />
        </div>
        <div className="w-14 h-14 rounded-xl bg-slate-800" />
      </div>
    </div>
  );
}

// ==========================================
// Main Page Component
// ==========================================
export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  const getToken = useCallback(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("token") ?? "";
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(`${API_BASE_URL}/api/admin/dashboard-stats`, { headers });

      if (res.data?.success) {
        setData(res.data.data);
        setLastUpdated(new Date());
      } else {
        setError("Dashboard returned an unexpected response.");
      }
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError("Couldn't load dashboard data. Retrying shortly...");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getToken]);

  const hasInitialized = useRef(false);

  // Live seconds ago counter
  useEffect(() => {
    if (!lastUpdated) return;

    const calculateElapsed = () => {
      setSecondsAgo(Math.max(0, Math.round((Date.now() - lastUpdated.getTime()) / 1000)));
    };

    calculateElapsed();
    const counterInterval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(counterInterval);
  }, [lastUpdated]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchDashboardData();
    }

    const interval = setInterval(fetchDashboardData, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, [fetchDashboardData, getToken, router]);

  const stats = data?.stats;
  const performance = data?.performance;

  const statCards = [
    { title: "Total Lines", value: stats?.totalFactories ?? 0, icon: Factory, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    {
      title: "Machines Online",
      value: stats ? `${stats.machinesOnline} / ${stats.totalMachines}` : "0 / 0",
      icon: Cpu,
      color: "text-violet-400 bg-violet-400/10 border-violet-400/20",
    },
    { title: "Production Today", value: stats?.productionToday?.toLocaleString() ?? 0, icon: Activity, color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 font-sans text-slate-100">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">
              <LayoutDashboard size={16} />
              System Overview
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-400 mt-2 text-sm md:text-base">Real-time factory production & monitoring system overview.</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/50 py-2 px-4 rounded-full border border-slate-800">
            {loading ? (
              <span className="flex items-center gap-2 text-cyan-400">
                <RefreshCw size={14} className="animate-spin" /> Updating live feeds...
              </span>
            ) : secondsAgo !== null ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Updated {secondsAgo}s ago
              </span>
            ) : null}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle size={18} /> {error}
            </span>
            <button onClick={fetchDashboardData} className="text-rose-400 hover:text-white bg-rose-500/20 hover:bg-rose-500/40 px-3 py-1 rounded-md text-xs font-bold transition-colors">
              Retry Connection
            </button>
          </div>
        )}

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading && !data
            ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            : statCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 hover:border-slate-700 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{item.title}</p>
                        <h2 className="text-3xl font-extrabold mt-2 text-white font-mono">{item.value}</h2>
                      </div>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${item.color} shadow-inner`}>
                        <Icon size={28} />
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: System Status */}
          <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 flex flex-col">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Activity size={16} className="text-violet-400" /> System Status
            </h2>
            <div className="space-y-4 flex-1">
              {(data?.systemStatus ?? []).map((item) => {
                const isUp = item.status.toLowerCase().match(/online|connected|running|active/);
                return (
                  <div key={item.label} className="flex items-center justify-between bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                    <span className="text-slate-300 text-sm font-medium">{item.label}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-full ${isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}
                    >
                      {isUp ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {item.status}
                    </span>
                  </div>
                );
              })}
              {!data && !loading && <p className="text-slate-600 text-sm italic text-center py-4">No system status data available.</p>}
            </div>
          </div>

          {/* Column 2: Production Summary */}
          <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" /> Production Efficiency
            </h2>
            <div className="space-y-6">
              <RadialGauge value={Number(performance?.productionEfficiency?.replace("%", "") ?? 0)} label="Overall Production Efficiency" color="text-emerald-400" />
              <RadialGauge value={Number(performance?.oee?.replace("%", "") ?? 0)} label="OEE (Overall Equipment Effectiveness)" color="text-cyan-400" />
            </div>
          </div>

          {/* Column 3: Active Alerts */}
          <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <AlertTriangle className="text-amber-400" size={16} /> Live Alerts
              </h2>
              {data?.alerts && data.alerts.length > 0 && <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{data.alerts.length} NEW</span>}
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-75">
              {(data?.alerts ?? []).map((alert, i) => (
                <div key={i} className={`border-l-4 rounded-r-lg p-4 text-sm font-medium ${ALERT_STYLES[alert.level]}`}>
                  {alert.message}
                </div>
              ))}
              {(!data?.alerts || data.alerts.length === 0) && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2 py-8">
                  <CheckCircle2 size={32} className="text-slate-700" />
                  <p className="text-sm">No active alerts. Everything looks good!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Performance Overview */}
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Best Performing Line", value: performance?.bestPerformingLine ?? "—", color: "text-cyan-400" },
              { label: "Active Machines", value: performance?.activeMachines ?? "—", color: "text-emerald-400" },
              { label: "Shift Target Achievement", value: performance?.shiftTargetAchievement ?? "—", color: "text-amber-400" },
            ].map((item) => (
              <div key={item.label} className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition-colors">
                <p className="text-slate-400 text-sm font-medium">{item.label}</p>
                <p className={`text-2xl font-extrabold mt-2 font-mono ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
