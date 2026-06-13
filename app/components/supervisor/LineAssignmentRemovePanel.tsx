"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

// ===============================================
// TYPES
// ===============================================
interface LineData {
  machineId?: string;
  productCode?: string;
  dailyTarget?: number;
  plannedMembers?: number;
  totalProductCount?: number;
  floor?: string;
}

// ===============================================
// COMPONENT
// ===============================================
export default function LineAssignmentRemovePanel() {
  const [lines, setLines] = useState<Record<string, LineData>>({});
  const [selectedLine, setSelectedLine] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // --- FETCH DATA ---
  async function fetchLines() {
    try {
      setFetching(true);
      setMessage("");

      const token = localStorage.getItem("token");

      // .env එක හරහා API URL එක ලබා ගැනීම සහ Token යැවීම
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/esp32/lines`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.data) {
        setLines(response.data.data);
      } else {
        setLines({});
        setMessage("No lines available to remove.");
      }
    } catch (error) {
      console.error("Failed to load lines", error);
      setLines({});
      setMessage("Failed to load lines. Please try again.");
    } finally {
      setFetching(false);
    }
  }

  // --- LOAD ON MOUNT ---
  useEffect(() => {
    const loadLines = async () => {
      await fetchLines();
    };

    void loadLines();
  }, []);

  const lineKeys = Object.keys(lines);
  const hasLines = lineKeys.length > 0;

  // --- REMOVE ASSIGNMENT ---
  const removeAssignment = async () => {
    if (!selectedLine) {
      setMessage("Please select a line");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      // .env එක හරහා API URL එක ලබා ගැනීම සහ Token යැවීම
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/esp32/remove-assignment`,
        {
          lineId: selectedLine,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.data?.success) {
        setMessage("Remove failed. Please try again.");
        return;
      }

      setSelectedLine("");
      setMessage("✓ Assignment removed successfully");

      await fetchLines();

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error: unknown) {
      console.error(error);

      // Axios error එකක් නම් අදාළ දෝෂ පණිවිඩය පෙන්වීම
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Remove failed. Please try again.");
      } else {
        setMessage("Remove failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 max-w-3xl mx-auto mt-8 shadow-sm">
      {/* HEADER */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Remove Line Assignment</h2>

      {/* MESSAGE */}
      {message && (
        <div className={`mb-5 p-4 rounded-2xl font-semibold text-sm ${message.includes("✓") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message}
        </div>
      )}

      {fetching ? (
        <div className="text-gray-500 font-semibold animate-pulse mb-4">Loading lines from server...</div>
      ) : (
        <>
          {/* FORM */}
          <div className="flex flex-col gap-4">
            {/* LINE SELECTOR */}
            <label className="block text-sm font-semibold text-gray-700">Select Production Line</label>
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              disabled={!hasLines}
              className="border border-gray-300 rounded-2xl px-4 py-3 w-full md:w-1/2 outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">{hasLines ? "Select Line to Remove" : "No lines available"}</option>
              {lineKeys.map((lineKey) => (
                <option key={lineKey} value={lineKey}>
                  {lineKey} {lines[lineKey].machineId ? `(Assigned: ${lines[lineKey].machineId})` : "(Unassigned)"}
                </option>
              ))}
            </select>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={removeAssignment}
              disabled={loading || !selectedLine || !hasLines}
              className="w-full md:w-1/2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 rounded-2xl font-semibold transition"
            >
              {loading ? "Removing..." : "Remove Assignment"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
