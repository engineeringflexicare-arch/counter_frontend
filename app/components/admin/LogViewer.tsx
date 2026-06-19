"use client";

import React, { useState, useEffect, useCallback } from "react";

interface LogEvent {
  _id?: string;
  deviceId: string;
  eventType: string;
  message: string;
  createdAt?: string;
  timestamp?: number;
}

const API_BASE = "https://esp32server-xrnm.onrender.com";

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchDevice, setSearchDevice] = useState("");

  const loadLogsData = useCallback(async (deviceId = "") => {
    let url = `${API_BASE}/api/logs`;

    if (deviceId.trim()) {
      url += `?device_id=${encodeURIComponent(deviceId)}`;
    }

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const result = await loadLogsData(searchDevice);

        if (!mounted) return;

        if (result.success) {
          setLogs(result.data || []);
          setError(null);
        } else {
          setError(result.message || "Failed to load logs");
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError("Unable to connect to backend");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [searchDevice, loadLogsData]);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await loadLogsData(searchDevice);
      if (result.success) {
        setLogs(result.data || []);
        setError(null);
      } else {
        setError(result.message || "Failed to load logs");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    // Confirm Alert එකක් දීම වඩා ආරක්ෂිතයි
    if (!window.confirm("Are you sure you want to delete logs? This action cannot be undone.")) return;

    setLoading(true);

    try {
      let url = `${API_BASE}/api/logs`;

      // searchDevice එකක් තියෙනවා නම් ඒකෙ විතරක් logs delete කරන්න
      if (searchDevice.trim()) {
        url += `?device_id=${encodeURIComponent(searchDevice)}`;
      }

      // අලුත් DELETE Endpoint එකට Request එක යැවීම
      const response = await fetch(url, {
        method: "DELETE",
        cache: "no-store",
      });

      const result = await response.json();

      if (result.success) {
        setLogs([]); // UI එකේ logs ටික අයින් කිරීම
        setError(null);
        alert(`Successfully deleted ${result.deletedCount} logs.`);
      } else {
        setError(result.message || "Failed to clear logs");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date?: string | number) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getEventStyle = (eventType: string) => {
    switch (eventType) {
      case "CRITICAL_CRASH":
        return "bg-red-100 text-red-700 border border-red-200";
      case "ERROR":
        return "bg-orange-100 text-orange-700 border border-orange-200";
      case "TIME_SYNC_FAILED":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "MANUAL_RESET":
        return "bg-green-100 text-green-700 border border-green-200";
      case "BOOT":
        return "bg-cyan-100 text-cyan-700 border border-cyan-200";
      default:
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    }
  };

  return (
    <div className="p-5 font-sans text-gray-900 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-5 text-gray-900">Device Activity Logs</h2>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2.5 mb-5">
        <input
          type="text"
          placeholder="Machine_01"
          value={searchDevice}
          onChange={(e) => setSearchDevice(e.target.value)}
          className="p-2.5 border border-gray-300 rounded w-64 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors">
          Search
        </button>

        <button type="button" onClick={handleClear} className="px-4 py-2.5 bg-gray-200 text-gray-900 font-medium rounded hover:bg-gray-300 transition-colors">
          Clear
        </button>
      </form>

      {/* Error Alert */}
      {error && <div className="p-3 bg-red-50 text-red-600 rounded mb-4 font-semibold border border-red-200">⚠️ {error}</div>}

      {/* Logs Table */}
      {loading ? (
        <p className="text-gray-900 font-medium">Loading logs...</p>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="p-3 text-left text-gray-900 font-semibold text-sm">Date & Time</th>
                <th className="p-3 text-left text-gray-900 font-semibold text-sm">Device ID</th>
                <th className="p-3 text-left text-gray-900 font-semibold text-sm">Event Type</th>
                <th className="p-3 text-left text-gray-900 font-semibold text-sm">Message</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <tr key={log._id || `${log.deviceId}-${index}`} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-gray-900 text-sm whitespace-nowrap">{formatDate(log.createdAt || log.timestamp)}</td>

                    <td className="p-3 text-gray-900 text-sm font-bold">{log.deviceId}</td>

                    <td className="p-3 text-sm">
                      <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${getEventStyle(log.eventType)}`}>{log.eventType}</span>
                    </td>

                    <td className="p-3 text-gray-900 text-sm">{log.message}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-5 text-center text-gray-500 text-sm italic">
                    No Logs Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
