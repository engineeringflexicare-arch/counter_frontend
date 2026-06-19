"use client";

import { useEffect, useState } from "react";

// අලුත් fields ටික Interface එකට එකතු කළා
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

export default function ConfigList() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-black">Saved Configurations</h2>

        <button onClick={refreshConfigs} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          Refresh
        </button>
      </div>

      {configs.length === 0 ? (
        <div className="text-gray-500">No configurations found</div>
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
              {configs.map((config) => (
                <tr key={config._id} className="hover:bg-gray-50 text-sm">
                  <td className="border p-3 text-black font-semibold whitespace-nowrap">{config.device_id}</td>

                  {/* අලුතින් එකතු කළ Columns */}
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
