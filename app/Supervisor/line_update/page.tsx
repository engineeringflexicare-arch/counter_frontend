"use client";

import React, { useEffect, useState } from "react";
import { Save, Cpu, Package, Target, Users, SunMoon, Building, Calendar, Settings } from "lucide-react";
import axios from "axios";

interface LineData {
  machineId?: string;
  productCode?: string;
  dailyTarget?: number;
  hourlyTarget?: number;
  plannedMembers?: number;
  shift?: string;
  supervisor?: string;
  floor?: string;
}

interface MachineData {
  machineId: string;
  machineName?: string;
  status?: string;
}

export default function SupervisorLineUpdatePanel() {
  const [lines, setLines] = useState<Record<string, LineData>>({});
  const [freeMachines, setFreeMachines] = useState<MachineData[]>([]);
  const [selectedLine, setSelectedLine] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const [machineId, setMachineId] = useState("");
  const [productCode, setProductCode] = useState("");
  const [dailyTarget, setDailyTarget] = useState("");
  const [hourlyTarget, setHourlyTarget] = useState("");
  const [teamMembers, setTeamMembers] = useState("");
  const [shift, setShift] = useState("Day");

  const [floor, setFloor] = useState("Production_Floor");

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState("");

  // නිවැරදි කළ .env නම භාවිතය
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        const token = localStorage.getItem("token");

        const linesRes = await axios.get(`${API_BASE_URL}/api/esp32/lines`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (linesRes.data.success && linesRes.data.data) {
          setLines(linesRes.data.data);
        }

        const machinesRes = await axios.get(`${API_BASE_URL}/api/esp32/free-counters`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (machinesRes.data.success && machinesRes.data.data) {
          setFreeMachines(machinesRes.data.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  const handleUpdate = async () => {
    if (!selectedLine) {
      setMessage("Please select a line to update.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await axios.put(
        `${API_BASE_URL}/api/esp32/update-line`,
        {
          lineId: selectedLine,
          date: selectedDate,
          machineId,
          productCode,
          dailyTarget: Number(dailyTarget),
          hourlyTarget: Number(hourlyTarget),
          teamMembers: Number(teamMembers),
          shift,
          floor,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setMessage("✓ Line details updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Failed to update details.");
      } else {
        setMessage("Failed to update details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredLines = Object.entries(lines).filter(([, line]) => {
    const dbFloor = line.floor ? line.floor.replace("_", " ") : "";
    const selectedFloor = floor.replace("_", " ");
    return !line.floor || dbFloor === selectedFloor;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 max-w-5xl mx-auto my-6">
      <div className="mb-8 pb-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Settings className="text-blue-600" size={28} />
            </div>
            Line Update Panel
          </h2>
          <p className="text-slate-500 text-sm mt-2 sm:ml-13">Manage and update your production line details, machine assignments, and daily targets.</p>
        </div>
      </div>

      {initialLoading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-slate-500 font-semibold animate-pulse">Loading Your Lines...</p>
        </div>
      ) : (
        <>
          {message && (
            <div
              className={`mb-6 rounded-2xl p-4 border text-sm font-semibold flex items-center gap-2 ${message.includes("✓") ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
            >
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3 sm:mb-0">
                <Calendar size={18} className="text-blue-600" />
                Select Date for Update:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 font-semibold cursor-pointer shadow-sm transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Building size={16} className="text-slate-500" />
                Floor
              </label>
              <select
                value={floor}
                onChange={(e) => {
                  setFloor(e.target.value);
                  setSelectedLine("");
                }}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-blue-50 font-medium transition-all"
              >
                <option value="Production_Floor">Production Floor</option>
                <option value="Assembly_Floor">Assembly Floor</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select Your Line</label>
              <select
                value={selectedLine}
                onChange={(e) => {
                  const lineKey = e.target.value;
                  setSelectedLine(lineKey);
                  const lineData = lines[lineKey];

                  if (lineData) {
                    setMachineId(lineData.machineId || "");
                    setProductCode(lineData.productCode || "");
                    setDailyTarget(String(lineData.dailyTarget || ""));
                    setHourlyTarget(String(lineData.hourlyTarget || ""));
                    setTeamMembers(String(lineData.plannedMembers || ""));
                    setShift(lineData.shift || "Day");
                  }
                }}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-blue-50 font-medium transition-all"
              >
                <option value="">-- Choose a Line --</option>
                {filteredLines.map(([lineKey]) => (
                  <option key={lineKey} value={lineKey}>
                    {lineKey.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Cpu size={16} className="text-slate-500" />
                Machine ID
              </label>
              <select
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 transition-all"
              >
                <option value="">-- No Machine --</option>
                {machineId && !freeMachines.find((m) => m.machineId === machineId) && <option value={machineId}>{machineId} (Current)</option>}
                {freeMachines.map((machine) => (
                  <option key={machine.machineId} value={machine.machineId}>
                    {machine.machineId} (Free)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Package size={16} className="text-slate-500" />
                Product Code
              </label>
              <input
                type="text"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Enter Product Code"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <SunMoon size={16} className="text-slate-500" />
                Shift
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="Day">Day Shift</option>
                <option value="Night">Night Shift</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Users size={16} className="text-slate-500" />
                Team Members
              </label>
              <input
                type="number"
                value={teamMembers}
                onChange={(e) => setTeamMembers(e.target.value)}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Target size={16} className="text-slate-500" />
                Daily Target
              </label>
              <input
                type="number"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Target size={16} className="text-slate-500" />
                Hourly Target
              </label>
              <input
                type="number"
                value={hourlyTarget}
                onChange={(e) => setHourlyTarget(e.target.value)}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="mt-10">
            <button
              onClick={handleUpdate}
              disabled={loading || !selectedLine}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99]"
            >
              <Save size={22} />
              {loading ? "Updating Details..." : "Update Line Details"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
