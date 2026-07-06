"use client";

import React, { useEffect, useState } from "react";
import { Save, Cpu, Clock, Package, Target, Users, SunMoon, Building } from "lucide-react";
import axios from "axios";
import api from "@/lib/api";

// ==========================================
// Types & Interfaces
// ==========================================
interface MachineData {
  LiveStatus?: { Count?: number };
}

interface MachineListItem {
  machineId?: string;
  device_id?: string;
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

const readStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token")?.trim() || null;
};

// ==========================================
// Main Component
// ==========================================
export default function LineAssignmentPanel() {
  // --- States ---
  const [lines, setLines] = useState<Record<string, LineData>>({});
  const [machines, setMachines] = useState<Record<string, MachineData>>({});

  const [selectedLine, setSelectedLine] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("");
  const [floor, setFloor] = useState("Production Floor");
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
  const [authToken, setAuthToken] = useState<string | null>(readStoredToken);

  // Keep authToken in sync with storage changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "token") {
        setAuthToken(event.newValue?.trim() || null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const getAuthHeaders = () => {
    return authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
  };

  // ✅ Data fetching logic
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    const fetchInitialData = async () => {
      try {
        if (!authToken) {
          setInitialLoading(false);
          return;
        }

        const localAuthHeaders = { Authorization: `Bearer ${authToken}` };

        // 1. Fetch Lines
        const linesResponse = await api.get(`/api/lines/`, {
          headers: localAuthHeaders,
        });
        if (isMounted && linesResponse.data.success && linesResponse.data.data) {
          setLines(linesResponse.data.data);
        }

        // 2. Fetch Available Machines (✅ CORRECTED URL & LOGIC)
        const machinesResponse = await api.get(`/api/lines/available-machines`, {
          headers: localAuthHeaders,
        });

        if (isMounted && machinesResponse.data.success) {
          const machineData: Record<string, MachineData> = {};

          // Handle if response is an array
          const machineList = Array.isArray(machinesResponse.data.data) ? machinesResponse.data.data : [];

          machineList.forEach((item: MachineListItem) => {
            // Backend එකෙන් machineId හෝ device_id ලෙස ආවත් අල්ලාගැනීම
            const id = item.machineId || item.device_id;
            if (id) {
              machineData[id] = {};
            }
          });

          setMachines(machineData);
        }
      } catch (error) {
        console.error("Error fetching data from backend:", error);
        if (isMounted) {
          setMessage("Failed to load data from backend");
        }
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    };

    fetchInitialData();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [authToken]); // Only depend on stable values

  // --- Handle Assign Line ---
  const handleAssignLine = async () => {
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

      const payload = {
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
        floor,
      };

      const response = await api.post(`/api/lines/assign`, payload, {
        headers: getAuthHeaders(),
      });

      if (response.data.success) {
        setMessage("✓ Line assigned successfully");

        // Refresh the lines data
        const linesResponse = await api.get(`/api/lines/`, {
          headers: getAuthHeaders(),
        });
        if (linesResponse.data.success && linesResponse.data.data) {
          setLines(linesResponse.data.data);
        }

        // Reset form
        setSelectedLine("");
        setSelectedMachine("");
        setProductCode("");
        setDailyTarget("");
        setHourlyTarget("");
        setTeamMembers("");
        setShift("Day");
        setSupervisor("");
        setShiftStartTime("08:00");
        setShiftEndTime("16:00");

        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(response.data.message || "Failed to assign line");
      }
    } catch (error) {
      const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Failed to assign line" : "Failed to assign line";

      console.error("ASSIGN ERROR:", error);
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
                onClick={handleAssignLine}
                disabled={loading || !selectedLine || !selectedMachine}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99]"
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
