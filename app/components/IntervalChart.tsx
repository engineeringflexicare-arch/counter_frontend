import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

export interface IntervalDataPoint {
  time: string;
  count: number;
}

// 1. මෙතැනට machineId එකතු කරන්න
interface IntervalChartProps {
  machineId: string;
  data: IntervalDataPoint[];
  hourlyTarget: number;
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
        <p className="text-sky-600 font-black text-sm">Output: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

// 2. Component එකට machineId එක ලබා ගන්න
export default function IntervalChart({ machineId, data, hourlyTarget }: IntervalChartProps) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full bg-sky-500" />
          <h2 className="text-xs font-black tracking-widest text-slate-700 uppercase">Output Per Interval ({machineId})</h2>
        </div>
        {hourlyTarget > 0 && (
          <span className="text-[10px] font-bold text-amber-600 tracking-widest flex items-center gap-1.5 border border-amber-200 bg-amber-50 px-2.5 py-1 rounded-lg">
            <span className="w-4 h-0.5 bg-amber-500 inline-block rounded-full" /> Hourly Target
          </span>
        )}
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm font-medium">Awaiting data...</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
            {hourlyTarget > 0 && <ReferenceLine y={hourlyTarget} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={2} />}
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#0ea5e9"
              strokeWidth={3}
              fill="url(#skyGrad)"
              dot={{ fill: "#0ea5e9", r: 4, strokeWidth: 2, stroke: "#ffffff" }}
              activeDot={{ r: 6, fill: "#0284c7", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
