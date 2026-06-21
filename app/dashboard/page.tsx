"use client";

import { LayoutDashboard, Activity, Clock3, Target } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../lib/api";

import ProductionTable from "../components/ProductionTable";

// ===============================================
// LINE DATA TYPE
// ===============================================
interface LineData {
  machineId: string;
  productCode: string;
  plannedMembers: number;
  hourlyTarget: number;
}

// ===============================================
// DASHBOARD PAGE
// ===============================================
export default function Dashboard() {
  // ===========================================
  // STATES
  // ===========================================
  const [lines, setLines] = useState<Record<string, LineData>>({});
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});
  const [currentShift, setCurrentShift] = useState("");
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  // ===========================================
  // DATA FETCHING (API)
  // ===========================================
  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const linesRes = await api.get(`/api/lines`);
        const linesData = linesRes.data.data || linesRes.data;

        if (!linesData) {
          if (isMounted) setLines({});
          return;
        }

        if (isMounted) setLines(linesData);

        // 2. එක් එක් Machine එකෙහි Live Count ලබා ගැනීම
        const counts: Record<string, number> = {};

        // Object.values භාවිතය සහ unknown -> LineData Type casting
        const countPromises = Object.values(linesData).map(async (lineValue: unknown) => {
          const line = lineValue as LineData;
          const machineId = line.machineId;

          try {
            const res = await api.get(`/api/esp32/${machineId}/total-output`);

            if (res.data && res.data.success) {
              counts[machineId] = res.data.totalOutput || 0;
            }
          } catch (error) {
            console.error(`Error fetching count for ${machineId}:`, error);
          }
        });

        await Promise.all(countPromises);

        if (isMounted) {
          setLiveCounts(counts);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
    const intervalId = setInterval(fetchDashboardData, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [API_BASE_URL]);

  // ===========================================
  // SHIFT TIMING
  // ===========================================
  useEffect(() => {
    const updateShift = () => {
      const hour = new Date().getHours();
      setCurrentShift(hour >= 8 && hour < 20 ? "Day Shift" : "Night Shift");
    };

    updateShift();
    const interval = setInterval(updateShift, 60000);

    return () => clearInterval(interval);
  }, []);

  // ===========================================
  // COMBINED LINES & TOTALS
  // ===========================================
  const combinedLines = Object.entries(lines).map(([lineKey, line]) => ({
    ...line,
    lineKey,
  }));

  const totalLines = combinedLines.length;
  const totalTarget = combinedLines.reduce((sum, line) => sum + line.hourlyTarget, 0);
  const totalOutput = combinedLines.reduce((sum, line) => sum + (liveCounts[line.machineId] || 0), 0);

  // ===========================================
  // RENDER
  // ===========================================
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="bg-blue-600 text-white p-2 rounded-xl shadow-md">
              <LayoutDashboard size={28} />
            </span>
            Production Dashboard
          </h1>
          <p className="text-gray-500 mt-2 ml-1">Real-time production monitoring system</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Active Lines</p>
              <h2 className="text-3xl font-bold text-gray-800 mt-2">{totalLines}</h2>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Activity className="text-blue-600" size={26} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Current Shift</p>
              <h2 className="text-3xl font-bold text-gray-800 mt-2">{currentShift}</h2>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl">
              <Clock3 className="text-orange-600" size={26} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Hourly Target</p>
              <h2 className="text-3xl font-bold text-gray-800 mt-2">{totalTarget}</h2>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <Target className="text-green-600" size={26} />
            </div>
          </div>
        </div>
      </div>

      {/* Total Output Banner */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1.5 bg-green-500" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Production Output (All Lines)</p>
            <h2 className="text-4xl font-bold text-green-600 mt-2">{totalOutput}</h2>
          </div>
          <div className="bg-green-100 p-4 rounded-xl">
            <Activity className="text-green-600" size={32} />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gray-800 text-white px-6 py-4">
          <h2 className="text-xl font-semibold">Hourly Production Monitoring</h2>
          <p className="text-sm text-gray-300 mt-1">Real-time production tracking by line</p>
        </div>
        <div className="p-4">
          <ProductionTable />
        </div>
      </div>
    </div>
  );
}
