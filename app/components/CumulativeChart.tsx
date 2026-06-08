"use client";

import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

export interface CumulativeDataPoint {
  time: string;
  cumulative: number;
}

interface CumulativeChartProps {
  machineId?: string;
  cumulativeData: CumulativeDataPoint[];
  daily: number;
}

interface TooltipPayloadItem {
  value: number | string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  daily: number;
}

const CustomTooltip = ({ active, payload, label, daily }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const value = Number(payload[0].value || 0);
    const percentage = daily > 0 ? ((value / daily) * 100).toFixed(1) : "0";

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
        <p className="text-slate-500 text-xs font-bold mb-1">{label}</p>

        <p className="text-violet-600 font-black text-sm">Cumulative: {value}</p>

        <p className="text-emerald-600 text-xs font-bold mt-1">{percentage}% Complete</p>
      </div>
    );
  }

  return null;
};

export default function CumulativeChart({ machineId, cumulativeData, daily }: CumulativeChartProps) {
  const maxValue = cumulativeData.length > 0 ? cumulativeData[cumulativeData.length - 1].cumulative : 0;

  const yAxisMax = Math.max(maxValue, daily) * 1.1;

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full bg-violet-500" />

          <h2 className="text-xs font-black tracking-widest text-slate-700 uppercase">Cumulative Output</h2>
        </div>

        <div className="flex items-center gap-2">
          {machineId && <span className="text-[10px] font-bold text-slate-600 tracking-widest uppercase bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{machineId}</span>}

          {daily > 0 && (
            <span className="text-[10px] font-bold text-violet-600 tracking-widest flex items-center gap-1.5 border border-violet-200 bg-violet-50 px-2.5 py-1 rounded-lg">
              <span className="w-4 h-0.5 bg-violet-500 inline-block rounded-full" />
              Daily Target
            </span>
          )}
        </div>
      </div>

      {cumulativeData.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm font-medium">Awaiting data...</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={cumulativeData}
            margin={{
              top: 20,
              right: 20,
              left: 10,
              bottom: 10,
            }}
          >
            <defs>
              <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" vertical={false} />

            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#64748b",
                fontSize: 11,
                fontWeight: 600,
              }}
            />

            <YAxis
              domain={[0, yAxisMax]}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#64748b",
                fontSize: 11,
                fontWeight: 600,
              }}
            />

            {daily > 0 && (
              <ReferenceLine
                y={daily}
                stroke="#7c3aed"
                strokeDasharray="6 6"
                strokeWidth={2}
                label={{
                  value: `Target ${daily}`,
                  position: "right",
                  fill: "#7c3aed",
                  fontSize: 11,
                }}
              />
            )}

            <Tooltip content={<CustomTooltip daily={daily} />} />

            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#6366f1"
              strokeWidth={3}
              fill="url(#violetGrad)"
              dot={{
                fill: "#6366f1",
                r: 4,
                stroke: "#fff",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 7,
                fill: "#4f46e5",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
