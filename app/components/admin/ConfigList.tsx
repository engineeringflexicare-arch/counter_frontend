"use client";

import { useEffect, useState, useMemo } from "react";

interface Config {
  _id: string;
  device_id: string;
  firebase_api_key?: string;
  firebase_url?: string;
  ip_address?: string;
  gateway?: string;
  subnet?: string;
  sampling_interval?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://esp32server-xrnm.onrender.com";

// ✅ CSV Export Helper — escapes commas/quotes safely, no external library needed
function exportToCSV(rows: Config[], filename: string) {
  if (rows.length === 0) return;

  const headers = ["Device ID", "IP Address", "Gateway", "Subnet", "Firebase URL"];
  const keys: (keyof Config)[] = ["device_id", "ip_address", "gateway", "subnet", "firebase_url"];

  const escapeCell = (value: unknown) => {
    const str = value === undefined || value === null ? "" : String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [headers.join(","), ...rows.map((row) => keys.map((k) => escapeCell(row[k])).join(","))];

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

export default function ConfigList() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Filter state
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchConfigs = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/configs`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Server Error ${response.status}`);
        }

        const result = await response.json();

        if (!mounted) return;

        if (result.success) {
          setConfigs(result.data || []);
          setError("");
        } else {
          setError(result.message || "Failed to load configurations");
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError("Cannot connect to server");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchConfigs();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshConfigs = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/configs`, {
        cache: "no-store",
      });

      const result = await response.json();

      if (result.success) {
        setConfigs(result.data || []);
        setError("");
      } else {
        setError(result.message || "Failed to refresh data");
      }
    } catch (err) {
      console.error(err);
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  };

  const deleteConfig = async (deviceId: string) => {
    const confirmed = window.confirm(`Delete configuration for ${deviceId}?`);

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE}/api/config/${deviceId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setConfigs((prev) => prev.filter((item) => item.device_id !== deviceId));
      } else {
        alert(result.message || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server connection failed");
    }
  };

  // ✅ Filtered list — matches device_id, ip_address, gateway, subnet, or firebase_url
  const filteredConfigs = useMemo(() => {
    if (!search.trim()) return configs;
    const q = search.trim().toLowerCase();

    return configs.filter((c) => [c.device_id, c.ip_address, c.gateway, c.subnet, c.firebase_url].some((field) => field?.toLowerCase().includes(q)));
  }, [configs, search]);

  const handleExport = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    exportToCSV(filteredConfigs, `device_configs_${dateStr}.csv`);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg mt-6">
        <p className="text-black">Loading configurations...</p>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-100 text-red-700 p-4 rounded-lg mt-6">{error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <h2 className="text-xl font-bold text-black">Saved Configurations</h2>

        <div className="flex items-center gap-2">
          <button onClick={refreshConfigs} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm font-medium">
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={filteredConfigs.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* ✅ Search / Filter bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by Device ID, IP, Gateway, Subnet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 border border-gray-300 p-2 rounded text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <span className="ml-2 text-xs text-gray-500">
            {filteredConfigs.length} of {configs.length} configs
          </span>
        )}
      </div>

      {filteredConfigs.length === 0 ? (
        <div className="text-gray-500">{search ? "No configurations match your search" : "No configurations found"}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-sm">
                <th className="border p-3 text-left text-black whitespace-nowrap">Device ID</th>
                <th className="border p-3 text-left text-black whitespace-nowrap">IP Address</th>
                <th className="border p-3 text-left text-black whitespace-nowrap">Gateway</th>
                <th className="border p-3 text-left text-black whitespace-nowrap">Subnet</th>
                <th className="border p-3 text-left text-black whitespace-nowrap">Firebase URL</th>
                <th className="border p-3 text-center text-black whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredConfigs.map((config) => (
                <tr key={config._id} className="hover:bg-gray-50 text-sm">
                  <td className="border p-3 text-black font-semibold whitespace-nowrap">{config.device_id}</td>
                  <td className="border p-3 text-black font-mono">{config.ip_address || "-"}</td>
                  <td className="border p-3 text-black font-mono">{config.gateway || "-"}</td>
                  <td className="border p-3 text-black font-mono">{config.subnet || "-"}</td>
                  <td className="border p-3 text-black break-all">{config.firebase_url || "-"}</td>
                  <td className="border p-3 text-center">
                    <button onClick={() => deleteConfig(config.device_id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
