"use client";

import React, { useEffect, useState } from "react";
import { Save, Cpu, Clock, Package, Target, Users, SunMoon } from "lucide-react";
import axios from "axios";

// ==========================================
// Types & Interfaces
// ==========================================
interface MachineData {
  LiveStatus?: { Count?: number };
}

interface LineData {
  machineId?: string;
  productCode?: string;
  dailyTarget?: number;
  hourlyTarget?: number;
  plannedMembers?: number;
  shift?: string;
  supervisor?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
}

const availableLines = ["Line_01", "Line_02", "Line_03", "Line_04", "Line_05", "Line_06", "Line_07", "Line_08"];

// ==========================================
// Main Component
// ==========================================
export default function LineAssignmentPanel() {
  // --- States ---
  const [lines, setLines] = useState<Record<string, LineData>>({});
  const [machines, setMachines] = useState<Record<string, MachineData>>({});

  const [selectedLine, setSelectedLine] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("");
  const [productCode, setProductCode] = useState("");
  const [dailyTarget, setDailyTarget] = useState("");
  const [hourlyTarget, setHourlyTarget] = useState("");
  const [teamMembers, setTeamMembers] = useState("");
  const [shift, setShift] = useState("Day");
  const [supervisor, setSupervisor] = useState("");
  const [shiftStartTime, setShiftStartTime] = useState("08:00");
  const [shiftEndTime, setShiftEndTime] = useState("16:00");

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState("");

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
  // --- Fetch Data From Backend API ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setInitialLoading(true);

        // 1. Backend එකෙන් Lines දත්ත ලබාගැනීම
        const linesResponse = await axios.get(`${API_BASE_URL}/api/esp32/lines`);
        if (linesResponse.data.success && linesResponse.data.data) {
          setLines(linesResponse.data.data);
        }

        // 2. Backend එකෙන් සියලුම දත්ත (Machines ද ඇතුළුව) ලබාගැනීම
        const allDataResponse = await axios.get(`${API_BASE_URL}/api/esp32/"`);
        if (allDataResponse.data.success && allDataResponse.data.data) {
          const allData = allDataResponse.data.data;
          const machineData: Record<string, MachineData> = {};

          Object.keys(allData).forEach((key) => {
            if (key.startsWith("Machine_")) {
              machineData[key] = allData[key];
            }
          });
          setMachines(machineData);
        }
      } catch (error) {
        console.error("Error fetching data from backend:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, [API_BASE_URL]);

  // --- Handle Save Assignment ---
  const handleSaveAssignment = async () => {
    if (!selectedLine || !selectedMachine || !productCode) {
      setMessage("Please fill required fields (Line, Machine, Product Code)");
      return;
    }

    try {
      setLoading(true);

      // Backend එකට දත්ත යැවීම
      await axios.post("http://localhost:3000/api/esp32/assign-line", {
        lineId: selectedLine,
        machineId: selectedMachine,
        productCode,
        dailyTarget: Number(dailyTarget),
        hourlyTarget: Number(hourlyTarget),
        teamMembers: Number(teamMembers),
        shift,
        supervisor,
        shiftStartTime,
        shiftEndTime,
      });

      setMessage("✓ Assignment saved successfully");

      // දත්ත Save කළ පසු, අලුත් දත්ත නැවත Backend එකෙන් ලබාගැනීම (Refresh)
      const linesResponse = await axios.get("http://localhost:3000/api/esp32/lines");
      if (linesResponse.data.success && linesResponse.data.data) {
        setLines(linesResponse.data.data);
      }

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error(error);
      setMessage("Failed to save assignment");
    } finally {
      setLoading(false);
    }
  };

  // --- UI Render ---
  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 max-w-5xl mx-auto">
      {/* Header */}

      {initialLoading ? (
        <div className="py-10 text-center text-gray-500 font-semibold animate-pulse">Loading Data from Server...</div>
      ) : (
        <>
          {/* Message Alert */}
          {message && (
            <div className={`mb-5 rounded-2xl p-4 border text-sm font-semibold ${message.includes("✓") ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
              {message}
            </div>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Line Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Production Line</label>
              <select
                value={selectedLine}
                onChange={(e) => {
                  const lineKey = e.target.value;
                  setSelectedLine(lineKey);
                  const lineData = lines[lineKey];
                  if (lineData) {
                    setSelectedMachine(lineData.machineId || "");
                    setProductCode(lineData.productCode || "");
                    setDailyTarget(String(lineData.dailyTarget || ""));
                    setHourlyTarget(String(lineData.hourlyTarget || ""));
                    setTeamMembers(String(lineData.plannedMembers || ""));
                    setShift(lineData.shift || "Day");
                    setSupervisor(lineData.supervisor || "");
                    setShiftStartTime(lineData.shiftStartTime || "08:00");
                    setShiftEndTime(lineData.shiftEndTime || "16:00");
                  } else {
                    // අලුත් Line එකක් තේරුවොත් Inputs හිස් කිරීම
                    setSelectedMachine("");
                    setProductCode("");
                    setDailyTarget("");
                    setHourlyTarget("");
                    setTeamMembers("");
                    setSupervisor("");
                  }
                }}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Line</option>
                {availableLines.map((lineKey) => (
                  <option key={lineKey} value={lineKey}>
                    {lineKey}
                  </option>
                ))}
              </select>
            </div>

            {/* Machine Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Cpu size={16} className="text-orange-600" /> Machine
              </label>
              <select
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Machine</option>
                {Object.keys(machines).map((machineKey) => (
                  <option key={machineKey} value={machineKey}>
                    {machineKey}
                  </option>
                ))}
              </select>
            </div>

            {/* Shift Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <SunMoon size={16} className="text-yellow-500" /> Shift
              </label>
              <select value={shift} onChange={(e) => setShift(e.target.value)} className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Day">Day Shift</option>
                <option value="Night">Night Shift</option>
              </select>
            </div>

            {/* Supervisor */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Users size={16} className="text-pink-600" /> Supervisor Name
              </label>
              <input
                type="text"
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                placeholder="e.g. Nimal Perera"
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Shift Start Time */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Clock size={16} className="text-blue-600" /> Shift Start Time
              </label>
              <input
                type="time"
                value={shiftStartTime}
                onChange={(e) => setShiftStartTime(e.target.value)}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Shift End Time */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Clock size={16} className="text-blue-600" /> Shift End Time
              </label>
              <input
                type="time"
                value={shiftEndTime}
                onChange={(e) => setShiftEndTime(e.target.value)}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Product Code */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Package size={16} className="text-purple-600" /> Product Code
              </label>
              <input
                type="text"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="Enter product code"
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Team Members */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Team Members Count</label>
              <input
                type="number"
                value={teamMembers}
                onChange={(e) => setTeamMembers(e.target.value)}
                placeholder="Number of members"
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Daily Target */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Target size={16} className="text-green-600" /> Daily Target
              </label>
              <input
                type="number"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                placeholder="Daily target"
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Hourly Target */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hourly Target</label>
              <input
                type="number"
                value={hourlyTarget}
                onChange={(e) => setHourlyTarget(e.target.value)}
                placeholder="Hourly target"
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8">
            <button
              onClick={handleSaveAssignment}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-2xl transition flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {loading ? "Saving Assignment..." : "Save Line Assignment"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
