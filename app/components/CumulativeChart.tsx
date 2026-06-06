import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

export interface CumulativeDataPoint {
  time: string;
  cumulative: number;
}

// 1. අනිවාර්යයෙන්ම machineId එක interface එකට එකතු කරන්න
interface CumulativeChartProps {
  machineId: string;
  cumulativeData: CumulativeDataPoint[];
  daily: number;
}

interface TooltipPayloadItem {
  value: number | string;
  name?: string;
  dataKey?: string;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
        <p className="text-slate-500 text-xs font-bold mb-1">{label}</p>
        <p className="text-violet-600 font-black text-sm">Cumulative: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

// 2. Component එකට machineId එක ලබා ගන්න
export default function CumulativeChart({ machineId, cumulativeData, daily }: CumulativeChartProps) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full bg-violet-500" />
          {/* machineId එක අවශ්‍ය නම් මෙතන පෙන්විය හැක */}
          <h2 className="text-xs font-black tracking-widest text-slate-700 uppercase">Cumulative Output ({machineId})</h2>
        </div>
        {daily > 0 && (
          <span className="text-[10px] font-bold text-violet-600 tracking-widest flex items-center gap-1.5 border border-violet-200 bg-violet-50 px-2.5 py-1 rounded-lg">
            <span className="w-4 h-0.5 bg-violet-500 inline-block rounded-full" /> Daily Target
          </span>
        )}
      </div>

      {cumulativeData.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm font-medium">Awaiting data...</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={cumulativeData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
            {daily > 0 && <ReferenceLine y={daily} stroke="#6366f1" strokeDasharray="4 4" strokeWidth={2} />}
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#6366f1"
              strokeWidth={3}
              fill="url(#violetGrad)"
              dot={{ fill: "#6366f1", r: 4, strokeWidth: 2, stroke: "#ffffff" }}
              activeDot={{ r: 6, fill: "#4f46e5", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
