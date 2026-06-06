"use client";

import { LayoutDashboard, Activity, Clock3, Target } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

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
        // 1. Lines දත්ත API එකෙන් ලබා ගැනීම
        const linesRes = await axios.get(`${API_BASE_URL}/api/esp32/lines`);
        const linesData = linesRes.data.data || linesRes.data;

        if (!linesData) {
          if (isMounted) setLines({});
          return;
        }

        if (isMounted) setLines(linesData);

        // 2. එක් එක් Machine එකෙහි Live Count ලබා ගැනීම
        const counts: Record<string, number> = {};

        // වෙනස්කම: Object.entries වෙනුවට Object.values භාවිතය සහ unknown -> LineData Type casting භාවිතය
        const countPromises = Object.values(linesData).map(async (lineValue: unknown) => {
          const line = lineValue as LineData;
          const machineId = line.machineId;

          try {
            const res = await axios.get(`${API_BASE_URL}/api/esp32/${machineId}/total-output`);

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
    <div className="min-h-screen bg-[#f3f4f6] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <LayoutDashboard className="text-blue-600" />
            Production Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Real-time production monitoring system</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Lines</p>
              <h2 className="text-3xl font-bold text-gray-800 mt-2">{totalLines}</h2>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Activity className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Current Shift</p>
              <h2 className="text-3xl font-bold text-gray-800 mt-2">{currentShift}</h2>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl">
              <Clock3 className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Hourly Target</p>
              <h2 className="text-3xl font-bold text-gray-800 mt-2">{totalTarget}</h2>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <Target className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Total Production Output (All Lines)</p>
            <h2 className="text-3xl font-bold text-green-600 mt-2">{totalOutput}</h2>
          </div>
          <div className="bg-green-100 p-3 rounded-xl">
            <Activity className="text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-[#1f2937] text-white px-6 py-4">
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
