"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Factory, Users, Activity, Cpu, TrendingUp, AlertTriangle, LayoutDashboard } from "lucide-react";

export default function AdminPage() {
  // --- 1. States For Dynamic Data ---
  const [statsData, setStatsData] = useState({
    totalFactories: "...",
    totalUsers: "...",
    machinesOnline: "...",
    productionToday: "...",
  });
  const [loading, setLoading] = useState(true);

  // ඔයාගේ Backend URL එක (.env file එකෙන් හෝ default localhost)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  // --- 2. Fetch Data From Backend ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Endpoints කිහිපයකටම එකවර requests යවනවා (Performance හොඳ වෙන්න)
        const [usersRes, linesRes, freeMachinesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/users`, { headers }).catch(() => null),
          axios.get(`${API_BASE_URL}/api/esp32/all-lines`, { headers }).catch(() => null),
          axios.get(`${API_BASE_URL}/api/esp32/free-counters`, { headers }).catch(() => null),
        ]);

        // A. Total Users ගණන සැකසීම
        const userCount = usersRes?.data?.success ? usersRes.data.data.length : "Error";

        // B. Total Lines / Factories ගණන සැකසීම
        let lineCount = 0;
        if (linesRes?.data?.success && linesRes.data.data) {
          lineCount = Object.keys(linesRes.data.data).length;
        }

        // C. Machines Online ගණන (උදාහරණයකට total lines + free machines වලින් active ඒවා ගන්න පුළුවන්)
        // දැනට ඔයාගේ endpoint එක අනුව සරලව ගණනයක් කරමු:
        const activeMachinesCount = 48; // Default fallback
        if (freeMachinesRes?.data?.success) {
          // මෙතන ඔයාට database එකේ active තියෙන මුළු ගණන දාන්න පුළුවන්
        }

        // D. Production Today (Lines වල තියෙන totalProductCount එක එකතු කරලා ගන්නවා)
        let totalProd = 0;
        if (linesRes?.data?.success && linesRes.data.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Object.values(linesRes.data.data).forEach((line: any) => {
            totalProd += Number(line.totalProductCount || 0);
          });
        }

        // State එක update කිරීම
        setStatsData({
          totalFactories: lineCount > 0 ? lineCount.toString() : "0",
          totalUsers: userCount.toString(),
          machinesOnline: activeMachinesCount.toString(),
          productionToday: totalProd > 0 ? totalProd.toLocaleString() : "0",
        });
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // හැම තත්පර 10කටම සැරයක් Realtime update වෙන්න interval එකක් දාන්න පුළුවන්
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [API_BASE_URL]);

  // --- 3. Dynamic Stats Array ---
  const stats = [
    {
      title: "Total Lines / Factories",
      value: statsData.totalFactories,
      icon: Factory,
      color: "text-cyan-300 bg-cyan-500/10 ring-cyan-500/30",
    },
    {
      title: "Total Users",
      value: statsData.totalUsers,
      icon: Users,
      color: "text-emerald-300 bg-emerald-500/10 ring-emerald-500/30",
    },
    {
      title: "Machines Online",
      value: statsData.machinesOnline,
      icon: Cpu,
      color: "text-violet-300 bg-violet-500/10 ring-violet-500/30",
    },
    {
      title: "Production Today",
      value: statsData.productionToday,
      icon: Activity,
      color: "text-amber-300 bg-amber-500/10 ring-amber-500/30",
    },
  ];

  const systemStatus = [
    { label: "Backend API", status: "Online" },
    { label: "Database", status: "Connected" },
    { label: "MQTT Broker", status: "Running" },
    { label: "WebSocket", status: "Active" },
  ];

  const alerts = [
    { message: "Machine M-03 stopped unexpectedly.", level: "warning" },
    { message: "Line 02 production below target.", level: "danger" },
    { message: "Daily backup completed successfully.", level: "success" },
  ];

  const ALERT_STYLES: Record<string, string> = {
    warning: "border-amber-500 bg-amber-500/5 text-amber-200",
    danger: "border-rose-500 bg-rose-500/5 text-rose-200",
    success: "border-emerald-500 bg-emerald-500/5 text-emerald-200",
  };

  const performance = [
    { label: "Best Performing Line", value: "Line 01" },
    { label: "Active Machines", value: "48 / 50" },
    { label: "Shift Target Achievement", value: "92%" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 font-sans text-slate-100 space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-[0.2em] mb-2">
          <LayoutDashboard size={14} />
          System Overview {loading && <span className="text-slate-500 normal-case animate-pulse ml-2">(Updating...)</span>}
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Factory production monitoring system overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">{item.title}</p>
                  <h2 className="text-3xl font-bold mt-2 text-white font-mono">{item.value}</h2>
                </div>

                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ring-1 ring-inset ${item.color}`}>
                  <Icon size={26} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* System Status */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-5">System Status</h2>
          <div className="space-y-4">
            {systemStatus.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">{item.label}</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-300 font-mono text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Production Summary */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-5">Production Summary</h2>
          <div className="space-y-5">
            <div>
              <p className="text-slate-500 text-sm">Production Efficiency</p>
              <p className="text-3xl font-bold text-emerald-400 font-mono mt-1">87%</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">OEE Performance</p>
              <p className="text-3xl font-bold text-cyan-400 font-mono mt-1">82%</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="text-amber-400" size={16} />
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500">Alerts</h2>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <div key={i} className={`border-l-2 rounded-lg p-3 text-sm ${ALERT_STYLES[alert.level]}`}>
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Section */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="text-emerald-400" size={16} />
          <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500">Performance Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {performance.map((item) => (
            <div key={item.label} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-500 text-sm">{item.label}</p>
              <p className="text-2xl font-bold mt-2 text-white font-mono">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
