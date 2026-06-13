"use client";

import React, { useEffect, useState } from "react";
import { Save, Cpu, Package, Target, Users, SunMoon, Building } from "lucide-react";
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

export default function SupervisorLineUpdatePanel() {
  const [lines, setLines] = useState<Record<string, LineData>>({});
  const [selectedLine, setSelectedLine] = useState("");

  // Form States
  const [machineId, setMachineId] = useState("");
  const [productCode, setProductCode] = useState("");
  const [dailyTarget, setDailyTarget] = useState("");
  const [hourlyTarget, setHourlyTarget] = useState("");
  const [teamMembers, setTeamMembers] = useState("");
  const [shift, setShift] = useState("Day");
  const [floor, setFloor] = useState("Production Floor");

  // UI States
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Backend එකෙන් Supervisor ට අදාළ ලයින් පමණක් ලබා ගැනීම
  useEffect(() => {
    const fetchLines = async () => {
      try {
        setInitialLoading(true);
        const token = localStorage.getItem("token");

        // අලුත් ක්‍රමය: .env ෆයිල් එකෙන් API URL එක ලබා ගනී
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/esp32/lines`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success && response.data.data) {
          setLines(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching lines:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchLines();
  }, []);

  // දත්ත Update කිරීම
  const handleUpdate = async () => {
    if (!selectedLine) {
      setMessage("Please select a line to update.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // අලුත් ක්‍රමය: .env ෆයිල් එකෙන් API URL එක ලබා ගනී
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/esp32/update-line`,
        {
          lineId: selectedLine,
          machineId,
          productCode,
          dailyTarget: Number(dailyTarget),
          hourlyTarget: Number(hourlyTarget),
          teamMembers: Number(teamMembers),
          shift,
          floor,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setMessage("✓ Line details updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: unknown) {
      // Axios error එකක්ද කියලා පරීක්ෂා කිරීම
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Failed to update details.");
      } else if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("Failed to update details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 max-w-5xl mx-auto">
      {initialLoading ? (
        <div className="py-10 text-center text-gray-500 font-semibold animate-pulse">Loading Your Lines...</div>
      ) : (
        <>
          {message && (
            <div className={`mb-5 rounded-2xl p-4 border text-sm font-semibold ${message.includes("✓") ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Line Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Your Line</label>
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
                    setFloor(lineData.floor || "Production Floor");
                  }
                }}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 bg-green-50"
              >
                <option value="">-- Choose a Line --</option>
                {Object.keys(lines).map((lineKey) => (
                  <option key={lineKey} value={lineKey}>
                    {lineKey}
                  </option>
                ))}
              </select>
            </div>

            {/* අදාළ දත්ත වෙනස් කිරීමේ Inputs */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Cpu size={16} /> Machine ID
              </label>
              <input type="text" value={machineId} onChange={(e) => setMachineId(e.target.value)} className="w-full border rounded-2xl px-4 py-3" />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Package size={16} /> Product Code
              </label>
              <input type="text" value={productCode} onChange={(e) => setProductCode(e.target.value)} className="w-full border rounded-2xl px-4 py-3" />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Building size={16} /> Floor
              </label>
              <select value={floor} onChange={(e) => setFloor(e.target.value)} className="w-full border rounded-2xl px-4 py-3">
                <option value="Production Floor">Production Floor</option>
                <option value="Assembly Floor">Assembly Floor</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <SunMoon size={16} /> Shift
              </label>
              <select value={shift} onChange={(e) => setShift(e.target.value)} className="w-full border rounded-2xl px-4 py-3">
                <option value="Day">Day Shift</option>
                <option value="Night">Night Shift</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Users size={16} /> Team Members
              </label>
              <input type="number" value={teamMembers} onChange={(e) => setTeamMembers(e.target.value)} className="w-full border rounded-2xl px-4 py-3" />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Target size={16} /> Daily Target
              </label>
              <input type="number" value={dailyTarget} onChange={(e) => setDailyTarget(e.target.value)} className="w-full border rounded-2xl px-4 py-3" />
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleUpdate}
              disabled={loading || !selectedLine}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-2xl transition flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {loading ? "Updating Details..." : "Update Line Details"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
