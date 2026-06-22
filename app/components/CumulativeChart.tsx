"use client";

import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

export interface CumulativeDataPoint {
  time: string;
  cumulative: number | null;
}

interface CumulativeChartProps {
  machineId?: string;
  cumulativeData: CumulativeDataPoint[];
  daily: number;
  date?: string;
}

interface TooltipPayloadItem {
  value: number | string | null;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  daily: number;
}

const CustomTooltip = ({ active, payload, label, daily }: CustomTooltipProps) => {
  if (active && payload && payload.length && payload[0].value !== null) {
    const value = Number(payload[0].value || 0);
    const percentage = daily > 0 ? ((value / daily) * 100).toFixed(1) : "0";

    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200">
        <p className="text-slate-500 text-xs font-bold mb-1">{label}</p>
        <p className="text-violet-600 font-black text-sm">Cumulative: {value}</p>
        <p className="text-emerald-600 text-xs font-bold mt-1">{percentage}% Complete</p>
      </div>
    );
  }

  return null;
};

export default function CumulativeChart({ machineId, cumulativeData, daily, date }: CumulativeChartProps) {
  // 1. අද දිනයද යන්න පරීක්ෂා කිරීම
  const today = new Date();
  const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const isToday = !date || date === formattedToday;

  // වර්තමාන වේලාව විනාඩි වලින් ගණනය කිරීම
  const currentMins = today.getHours() * 60 + today.getMinutes();

  // 2. අනාගත කාල පරාසයන්හි අගයන් null බවට පත් කිරීම (100% Dynamic Logic)
  const displayData = cumulativeData.map((d) => {
    if (!isToday) return d; // අද දිනය නොවේ නම් සියලු දත්ත පෙන්වයි

    if (!d.time || !d.time.includes("-")) return d;

    const [startStr] = d.time.split("-");
    const [sh, sm] = startStr.split(":").map(Number);
    const startMins = sh * 60 + (sm || 0);

    const adjustedStart = startMins;
    let adjustedCurrent = currentMins;

    // Overnight Shifts සඳහා ගැලපීම (අද පාන්දර නම් ඊයේ රාත්‍රියට වඩා ඉදිරියට ගෙන යාම)
    if (adjustedCurrent < adjustedStart && adjustedStart - adjustedCurrent > 12 * 60) {
      adjustedCurrent += 24 * 60;
    }

    // පවතින වේලාවට වඩා Bucket එක ආරම්භ වන වේලාව අනාගතයේ නම්, එම දත්තය null කරන්න
    if (adjustedStart > adjustedCurrent) {
      return { ...d, cumulative: null };
    }

    return d;
  });

  // 3. Current Output එක ගණනය කිරීමේදී null නොවන අවසන් අගය ගැනීම
  const validData = displayData.filter((d) => d.cumulative !== null);
  const currentOutput = validData.length > 0 ? Number(validData[validData.length - 1].cumulative) : 0;

  const completionPercentage = daily > 0 ? ((currentOutput / daily) * 100).toFixed(1) : "0";
  const remaining = Math.max(daily - currentOutput, 0);

  const yAxisMax = Math.ceil(Math.max(currentOutput, daily) / 500) * 500;

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full bg-violet-500" />
          <h2 className="text-xs font-black tracking-widest text-slate-700 uppercase">Cumulative Output</h2>
        </div>

        <div className="flex items-center gap-2">
          {machineId && <span className="text-[8px] lg:text-[10px] font-bold text-slate-600 tracking-widest uppercase bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{machineId}</span>}

          {daily > 0 && (
            <span className="text-[8px] lg:text-[10px] font-bold text-violet-600 tracking-widest flex items-center gap-1.5 border border-violet-200 bg-violet-50 px-2.5 py-1 rounded-lg">
              <span className="w-4 h-0.5 bg-violet-500 inline-block rounded-full" />
              Daily Target
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <p className="text-[10px] uppercase text-slate-500 font-bold">Current Output</p>
          <p className="text-[10px] lg:text-2xl font-black text-indigo-600">{currentOutput}</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <p className="text-[10px] uppercase text-slate-500 font-bold">Daily Target</p>
          <p className="text-[10px] lg:text-2xl font-black text-violet-600">{daily}</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <p className="text-[10px] uppercase text-slate-500 font-bold">Remaining</p>
          <p className="text-[10px] lg:text-2xl font-black text-amber-600">{remaining}</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <p className="text-[10px] lg:text-[10px] uppercase text-slate-500 font-bold">Progress</p>
          <p className="text-[10px] lg:text-2xl font-black text-emerald-600">{completionPercentage}%</p>
        </div>
      </div>

      {/* Empty State */}
      {displayData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-slate-400 text-sm font-medium">Awaiting production data...</div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={displayData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" vertical={false} />

            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} />

            <YAxis domain={[0, yAxisMax]} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} />

            {daily > 0 && <ReferenceLine y={daily} stroke="#7c3aed" strokeDasharray="6 6" strokeWidth={2} label={{ value: `Target ${daily}`, position: "right", fill: "#7c3aed", fontSize: 11 }} />}

            <Tooltip content={<CustomTooltip daily={daily} />} />

            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#6366f1"
              strokeWidth={3}
              fill="url(#violetGrad)"
              connectNulls={false}
              dot={{ fill: "#6366f1", r: 4, stroke: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 7, fill: "#4f46e5", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
