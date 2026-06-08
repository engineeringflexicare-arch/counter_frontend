"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DataPoint {
  hour: string;
  cumulative: number;
}

interface Props {
  data: DataPoint[];
}

export default function ProductionProgressChart({ data }: Props) {
  const currentOutput = data.length > 0 ? data[data.length - 1].cumulative : 0;

  return (
    <div className="w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xs font-black tracking-widest uppercase text-slate-700">Production Progress</h2>

        <div className="bg-sky-50 border border-sky-200 px-3 py-1 rounded-lg">
          <span className="text-[10px] text-sky-600 font-bold uppercase">Current Output</span>

          <p className="text-lg font-black text-sky-700">{currentOutput}</p>
        </div>
      </div>

      <div className="h-75">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="hour"
              tick={{
                fill: "#64748b",
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{
                fill: "#64748b",
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              }}
            />

            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#0ea5e9"
              strokeWidth={3}
              fill="url(#progressGradient)"
              activeDot={{
                r: 6,
                fill: "#0284c7",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
