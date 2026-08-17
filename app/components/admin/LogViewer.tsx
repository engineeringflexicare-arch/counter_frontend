"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";

interface LogEvent {
  _id?: string;
  deviceId: string;
  eventType: string;
  message: string;
  createdAt?: string;
  timestamp?: number | string;
}

const API_BASE = "https://esp32server-xrnm.onrender.com";
const FETCH_TIMEOUT_MS = 15000;
const POLL_INTERVAL_MS = 20000; // was 5000 — that's 720 req/hr on a free instance, way too hot
const PAGE_LIMIT = 100;

// ✅ CSV Export Helper
function exportToCSV(rows: LogEvent[], filename: string) {
  if (rows.length === 0) return;

  const headers = ["Date & Time", "Device ID", "Event Type", "Message"];

  const escapeCell = (value: unknown) => {
    const str = value === undefined || value === null ? "" : String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [
    headers.join(","),
    ...rows.map((row) => {
      const dateStr = row.createdAt || row.timestamp ? new Date(row.createdAt || row.timestamp!).toLocaleString() : "N/A";
      return [escapeCell(dateStr), escapeCell(row.deviceId), escapeCell(row.eventType), escapeCell(row.message)].join(",");
    }),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchDevice, setSearchDevice] = useState("");

  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ✅ Server now does device/date/limit filtering — only the query params change,
  // so those become the useCallback deps instead of re-fetching everything and
  // slicing it client-side.
  const loadLogsData = useCallback(async (deviceId: string, from: string, to: string) => {
    const params = new URLSearchParams();

    if (deviceId.trim()) params.append("device_id", deviceId.trim());
    if (from) params.append("from", new Date(from).toISOString());
    if (to) {
      // include the whole "to" day, not just midnight
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      params.append("to", endOfDay.toISOString());
    }
    params.append("limit", String(PAGE_LIMIT));

    const url = `${API_BASE}/api/logs?${params.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort(new DOMException("Request timed out", "AbortError"));
    }, FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const applyResult = useCallback((result: { success?: boolean; data?: LogEvent[]; message?: string }) => {
    if (result.success) {
      setLogs(result.data || []);
      setError(null);
    } else {
      setError(result.message || "Failed to load logs");
    }
  }, []);

  const applyFetchFailure = useCallback((err: unknown) => {
    console.error(err);

    if (err instanceof DOMException && err.name === "AbortError") {
      setError(`Backend didn't respond within ${FETCH_TIMEOUT_MS / 1000}s. If it's a Render free-tier service, it may be cold-starting.`);
      return;
    }

    setError("Unable to reach the backend — check that the Render service is running and that CORS allows this origin.");
  }, []);

  // ✅ Refetch when device search OR date range changes — not on every render.
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const result = await loadLogsData(searchDevice, dateFrom, dateTo);
        if (!mounted) return;
        applyResult(result);
      } catch (err) {
        if (mounted) applyFetchFailure(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [searchDevice, dateFrom, dateTo, loadLogsData, applyResult, applyFetchFailure]);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await loadLogsData(searchDevice, dateFrom, dateTo);
      applyResult(result);
    } catch (err) {
      applyFetchFailure(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Are you sure you want to delete logs? This action cannot be undone.")) return;

    setLoading(true);

    try {
      let url = `${API_BASE}/api/logs`;
      if (searchDevice.trim()) {
        url += `?device_id=${encodeURIComponent(searchDevice)}`;
      }

      const response = await fetch(url, {
        method: "DELETE",
        cache: "no-store",
      });

      const result = await response.json();

      if (result.success) {
        setLogs([]);
        setError(null);
        alert(`Successfully deleted ${result.deletedCount} logs.`);
      } else {
        setError(result.message || "Failed to clear logs");
      }
    } catch (err) {
      applyFetchFailure(err);
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
      case "COUNTER_CHANGE":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "SENSOR_PULSE":
        return "bg-indigo-100 text-indigo-700 border border-indigo-200";
      case "NVS_SAVE":
        return "bg-purple-100 text-purple-700 border border-purple-200";
      default:
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    }
  };

  // ✅ Event type isn't a backend filter (yet), so this stays client-side —
  // but it only filters the current page (up to PAGE_LIMIT), not the whole table.
  const availableEventTypes = useMemo(() => {
    const set = new Set(logs.map((log) => log.eventType).filter(Boolean));
    return Array.from(set).sort();
  }, [logs]);

  useEffect(() => {
    if (eventTypeFilter && !availableEventTypes.includes(eventTypeFilter)) {
      setEventTypeFilter("");
    }
  }, [availableEventTypes, eventTypeFilter]);

  const filteredLogs = useMemo(() => {
    if (!eventTypeFilter) return logs;
    return logs.filter((log) => log.eventType === eventTypeFilter);
  }, [logs, eventTypeFilter]);

  const handleExport = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    const deviceSuffix = searchDevice.trim() ? `_${searchDevice.trim()}` : "";
    exportToCSV(filteredLogs, `device_logs${deviceSuffix}_${dateStr}.csv`);
  };

  const handleResetFilters = () => {
    setEventTypeFilter("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="p-5 font-sans text-gray-900 bg-white rounded-lg shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <h2 className="text-2xl font-bold text-gray-900">Device Activity Logs</h2>
        <button
          onClick={handleExport}
          disabled={filteredLogs.length === 0}
          className="px-4 py-2.5 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export CSV
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-2.5 mb-4">
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

      <div className="flex flex-wrap items-end gap-3 mb-5 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Event Type</label>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            disabled={availableEventTypes.length === 0}
            className="p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">All Types ({availableEventTypes.length})</option>
            {availableEventTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {(eventTypeFilter || dateFrom || dateTo) && (
          <button onClick={handleResetFilters} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 underline">
            Reset filters
          </button>
        )}

        <span className="ml-auto text-xs text-gray-500 self-center">
          Showing {filteredLogs.length} of {logs.length} loaded (max {PAGE_LIMIT})
        </span>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 rounded mb-4 font-semibold border border-red-200">⚠️ {error}</div>}

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
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => (
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
                    {logs.length > 0 ? "No logs match your filters" : "No Logs Found"}
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
