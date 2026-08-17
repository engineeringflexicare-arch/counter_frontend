"use client";

import { useState } from "react";
import SupervisorHeader from "@/app/components/supervisor/SupervisorHeader";
import { mockProductionLines } from "@/lib/mockData";
import { LineData, SupervisorUser } from "@/types/Supervisor";

const mockProductionUser: SupervisorUser = {
  id: "SUP001",
  name: "Lisa Chen",
  email: "lisa.chen@company.com",
  role: "production_supervisor",
  assignedLines: ["PROD-001", "PROD-002"],
  department: "production",
};

export default function LineUpdatePage() {
  const [lines, setLines] = useState<LineData[]>(mockProductionLines);
  const [selectedLine, setSelectedLine] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    status: "" as "active" | "idle" | "maintenance" | "error",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleLineSelect = (lineId: string) => {
    const line = lines.find((l) => l.id === lineId);
    if (line) {
      setSelectedLine(lineId);
      setFormData({
        name: line.name,
        status: line.status,
      });
    }
  };

  const handleUpdate = () => {
    if (!selectedLine) {
      setMessage({ type: "error", text: "Please select a line" });
      return;
    }

    setLines((prevLines) =>
      prevLines.map((line) =>
        line.id === selectedLine
          ? {
              ...line,
              name: formData.name,
              status: formData.status,
            }
          : line,
      ),
    );

    setMessage({ type: "success", text: "Production line updated successfully" });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleReset = () => {
    setSelectedLine("");
    setFormData({ name: "", status: "active" });
  };

  const selectedLineData = lines.find((l) => l.id === selectedLine);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <SupervisorHeader user={mockProductionUser} title="Production Line Updates" subtitle="Update line information, status, and configuration" />

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === "success" ? "bg-green-100 text-green-800 border border-green-300" : "bg-red-100 text-red-800 border border-red-300"}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Update Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Line</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Production Line</label>
                  <select
                    value={selectedLine}
                    onChange={(e) => handleLineSelect(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Choose a line...</option>
                    {lines.map((line) => (
                      <option key={line.id} value={line.id}>
                        {line.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedLine && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Line Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="Enter line name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value as "active" | "idle" | "maintenance" | "error",
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="idle">Idle</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="error">Error</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button onClick={handleUpdate} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                        Update
                      </button>
                      <button onClick={handleReset} className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition">
                        Clear
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Lines List and Details */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">All Production Lines</h3>

              <div className="space-y-3">
                {lines.map((line) => (
                  <div
                    key={line.id}
                    onClick={() => handleLineSelect(line.id)}
                    className={`p-4 rounded-lg cursor-pointer transition ${
                      selectedLine === line.id ? "bg-blue-50 border-2 border-blue-500" : "bg-gray-50 border border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">{line.name}</p>
                        <p className="text-sm text-gray-600">ID: {line.id}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          line.status === "active"
                            ? "bg-green-100 text-green-800"
                            : line.status === "idle"
                              ? "bg-yellow-100 text-yellow-800"
                              : line.status === "maintenance"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {line.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-600">Machines</p>
                        <p className="font-semibold">{line.machines.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Output</p>
                        <p className="font-semibold text-blue-600">
                          {line.production.actual}/{line.production.target}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Efficiency</p>
                        <p className="font-semibold text-purple-600">{line.production.efficiency}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Line Details */}
            {selectedLineData && (
              <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Line Details</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Line Name</p>
                      <p className="font-semibold text-gray-800">{selectedLineData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Line ID</p>
                      <p className="font-semibold text-gray-800">{selectedLineData.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Supervisor</p>
                      <p className="font-semibold text-gray-800">{selectedLineData.shift.supervisor}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Machines</p>
                      <p className="font-semibold text-gray-800">{selectedLineData.machines.length}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Production Overview</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Target</p>
                        <p className="text-xl font-bold text-blue-600">{selectedLineData.production.target}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Actual</p>
                        <p className="text-xl font-bold text-green-600">{selectedLineData.production.actual}</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Efficiency</p>
                        <p className="text-xl font-bold text-purple-600">{selectedLineData.production.efficiency}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
