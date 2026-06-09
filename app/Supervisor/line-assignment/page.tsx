"use client";

import React, { useEffect, useState } from "react";
import { Save, Cpu, Clock, Package, Target, Users, SunMoon, Building } from "lucide-react";
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
  floor?: string;
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

  const machineOptions = Array.from(
    new Set([
      ...Object.keys(machines)
        .map((id) => id.trim())
        .filter(Boolean),
      ...Object.values(lines)
        .map((line) => line.machineId?.trim())
        .filter((id): id is string => Boolean(id)),
    ]),
  );
  const [floor, setFloor] = useState("Production Floor"); // <--- අලුත් State එක (Floor)
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
  const authToken = typeof window !== "undefined" ? localStorage.getItem("token")?.trim() || null : null;

  const getAuthHeaders = () => {
    return authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
  };

  // --- Fetch Data From Backend API ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setInitialLoading(true);

        if (!authToken) {
          return;
        }

        const localAuthHeaders = { Authorization: `Bearer ${authToken}` };

        // 1. Backend එකෙන් Lines දත්ත ලබාගැනීම
        const linesResponse = await axios.get("http://localhost:3000/api/esp32/lines", {
          headers: localAuthHeaders,
        });
        if (linesResponse.data.success && linesResponse.data.data) {
          setLines(linesResponse.data.data);
        }

        // 2. Backend එකෙන් සියලුම දත්ත ලබාගැනීම
        const allDataResponse = await axios.get("http://localhost:3000/api/esp32/", {
          headers: localAuthHeaders,
        });
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
  }, [authToken]);

  // --- Handle Save Assignment ---
  const handleSaveAssignment = async () => {
    if (!authToken) {
      setMessage("Please login before saving an assignment.");
      return;
    }

    if (!selectedLine || !selectedMachine || !productCode) {
      setMessage("Please fill required fields (Line, Machine, Product Code)");
      return;
    }

    try {
      setLoading(true);

      // Backend එකට දත්ත යැවීම
      await axios.post(
        "http://localhost:3000/api/esp32/assign-line",
        {
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
          floor, // <--- Floor එක Backend එකට යැවීම
        },
        {
          headers: getAuthHeaders(),
        },
      );

      setMessage("✓ Assignment saved successfully");

      // දත්ත Save කළ පසු, අලුත් දත්ත නැවත Backend එකෙන් ලබාගැනීම
      const linesResponse = await axios.get("http://localhost:3000/api/esp32/lines", {
        headers: getAuthHeaders(),
        //headers: localStorage.getItem("token")
      });
      if (linesResponse.data.success && linesResponse.data.data) {
        setLines(linesResponse.data.data);
      }

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error(error);
      setMessage("Failed to save assignment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- UI Render ---
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        {initialLoading ? (
          <div className="py-20 text-center text-slate-500 font-semibold animate-pulse">Loading Data from Server...</div>
        ) : (
          <>
            {/* Page Header */}
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-black text-slate-800">Line Assignment Form</h2>

              <p className="text-slate-500 mt-2">Configure production line and machine assignments</p>
            </div>

            {/* Alert Message */}
            {message && (
              <div className={`mb-6 rounded-2xl p-4 border text-sm font-semibold ${message.includes("✓") ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                {message}
              </div>
            )}

            {/* Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-slate-900">
              {/* Production Line */}
              <div>
                <label className="block text-sm font-semibold mb-2">Production Line</label>

                <select
                  value={selectedLine}
                  onChange={(e) => {
                    const lineKey = e.target.value;
                    setSelectedLine(lineKey);

                    const lineData = lines[lineKey];

                    if (lineData) {
                      setSelectedMachine(lineData.machineId?.trim() || "");
                      setFloor(lineData.floor || "Production Floor");
                      setProductCode(lineData.productCode || "");
                      setDailyTarget(String(lineData.dailyTarget || ""));
                      setHourlyTarget(String(lineData.hourlyTarget || ""));
                      setTeamMembers(String(lineData.plannedMembers || ""));
                      setShift(lineData.shift || "Day");
                      setSupervisor(lineData.supervisor || "");
                      setShiftStartTime(lineData.shiftStartTime || "08:00");
                      setShiftEndTime(lineData.shiftEndTime || "16:00");
                    }
                  }}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Line</option>

                  {availableLines.map((lineKey) => (
                    <option key={lineKey} value={lineKey}>
                      {lineKey}
                    </option>
                  ))}
                </select>
              </div>

              {/* Machine */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Cpu size={16} className="text-orange-500" />
                  Machine
                </label>

                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value.trim())}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Machine</option>

                  {machineOptions.map((machineKey) => (
                    <option key={machineKey} value={machineKey}>
                      {machineKey}
                    </option>
                  ))}
                </select>
              </div>

              {/* Floor */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Building size={16} className="text-teal-500" />
                  Floor
                </label>

                <select value={floor} onChange={(e) => setFloor(e.target.value)} className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="Production Floor">Production Floor</option>

                  <option value="Assembly Floor">Assembly Floor</option>
                </select>
              </div>

              {/* Shift */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <SunMoon size={16} className="text-yellow-500" />
                  Shift
                </label>

                <select value={shift} onChange={(e) => setShift(e.target.value)} className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="Day">Day Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
              </div>

              {/* Supervisor */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Users size={16} className="text-pink-500" />
                  Supervisor
                </label>

                <input
                  type="text"
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  placeholder="Supervisor Name"
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Clock size={16} className="text-blue-500" />
                  Shift Start Time
                </label>

                <input
                  type="time"
                  value={shiftStartTime}
                  onChange={(e) => setShiftStartTime(e.target.value)}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Clock size={16} className="text-blue-500" />
                  Shift End Time
                </label>

                <input
                  type="time"
                  value={shiftEndTime}
                  onChange={(e) => setShiftEndTime(e.target.value)}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Product Code */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Package size={16} className="text-purple-500" />
                  Product Code
                </label>

                <input
                  type="text"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Team Members */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Users size={16} className="text-cyan-500" />
                  Team Members
                </label>

                <input
                  type="number"
                  value={teamMembers}
                  onChange={(e) => setTeamMembers(e.target.value)}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Daily Target */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Target size={16} className="text-green-500" />
                  Daily Target
                </label>

                <input
                  type="number"
                  value={dailyTarget}
                  onChange={(e) => setDailyTarget(e.target.value)}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Hourly Target */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Target size={16} className="text-indigo-500" />
                  Hourly Target
                </label>

                <input
                  type="number"
                  value={hourlyTarget}
                  onChange={(e) => setHourlyTarget(e.target.value)}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8">
              <button
                onClick={handleSaveAssignment}
                disabled={loading}
                className="
                w-full
                bg-linear-to-r
                from-blue-600
                to-indigo-600
                hover:from-blue-700
                hover:to-indigo-700
                text-white
                font-bold
                py-4
                rounded-2xl
                shadow-lg
                transition-all
                flex
                items-center
                justify-center
                gap-2
              "
              >
                <Save size={20} />

                {loading ? "Saving Assignment..." : "Save Line Assignment"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
