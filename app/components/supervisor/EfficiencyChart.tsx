"use client";

import React from "react";

interface EfficiencyChartProps {
  title: string;
  data: {
    label: string;
    value: number;
    target?: number;
  }[];
  type?: "bar" | "line";
}

export default function EfficiencyChart({ title, data, type = "bar" }: EfficiencyChartProps) {
  const maxValue = Math.max(...data.map((d) => Math.max(d.value, d.target || 0)));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">{title}</h3>

      <div className="space-y-6">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700">{item.label}</p>
              <p className="text-sm font-semibold text-blue-600">{item.value}%</p>
            </div>

            <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
              {/* Target line if provided */}
              {item.target && <div className="absolute top-0 bottom-0 w-1 bg-gray-400 opacity-50" style={{ left: `${(item.target / maxValue) * 100}%` }} title={`Target: ${item.target}%`} />}

              {/* Actual value bar */}
              <div
                className={`h-full rounded-lg transition-all duration-300 flex items-center justify-end pr-3 text-white text-xs font-semibold ${
                  item.value >= (item.target || 80) ? "bg-green-500" : item.value >= (item.target || 80) * 0.9 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              >
                {item.value > 5 && `${item.value}%`}
              </div>
            </div>

            {item.target && (
              <p className="text-xs text-gray-500 mt-1">
                Target: {item.target}% ({item.value >= item.target ? "✓" : "✗"})
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
