import React from "react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

// වර්ණ සහ Utility (ඔබේ utility ෆයිල් එකෙන් import කරගන්න)
const TEAL = "#14b8a6";
const GRAY = "#94a3b8";

type ChartTab = "line" | "bar" | "donut";

interface LineDataPoint {
  time: string;
  count: number;
}

interface BarDataPoint {
  name: string;
  value: number;
  fill: string;
}

interface DonutDataPoint {
  name: string;
  value: number;
  fill: string;
}

interface ChartSectionProps {
  activeTab: ChartTab;
  lineChartData: LineDataPoint[];
  barData: BarDataPoint[];
  donutData: DonutDataPoint[];
  hourly: number;
  liveCount: number;
  achieved: number;
  remaining: number;
  fmt: (value: number) => string;
}

interface ChartTooltipPayload {
  value: number | string;
  name?: string;
  dataKey?: string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string;
}

function ChartCard({ title, legend, children }: { title: string; legend?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-slate-500">{title}</h3>
        </div>
        {legend}
      </div>
      {children}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-xl p-3 text-sm text-slate-800">
      <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="font-bold">
        {item.name}: {item.value}
      </p>
    </div>
  );
}

export default function ChartSection({ activeTab, lineChartData, barData, donutData, hourly, liveCount, achieved, remaining, fmt }: ChartSectionProps) {
  return (
    <div className="w-full">
      {/* ── Line chart ── */}
      {activeTab === "line" && (
        <ChartCard
          title="Production Output Timeline"
          legend={
            <div className="flex gap-2">
              <LegendDot color={TEAL} label="Unit count" />
              <LegendDot color={GRAY} label="Hourly target" />
            </div>
          }
        >
          {lineChartData.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={lineChartData} margin={{ top: 20, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 12, fill: GRAY, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: GRAY, fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={60} dx={-10} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <ReferenceLine y={hourly} stroke={GRAY} strokeDasharray="3 3" strokeWidth={2} label={{ value: "Hourly Target", fill: GRAY, fontSize: 11, position: "insideTopRight" }} />
                <Line type="monotone" dataKey="count" stroke={TEAL} strokeWidth={3.5} dot={{ r: 4, fill: "white", stroke: TEAL, strokeWidth: 2.5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      )}

      {/* ── Bar chart ── */}
      {activeTab === "bar" && (
        <ChartCard
          title="Performance Targets Overview"
          legend={
            <div className="flex gap-2">
              <LegendDot color={TEAL} label="Actual" />
              <LegendDot color={GRAY} label="Targets" />
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barData} margin={{ top: 20, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600, fill: GRAY }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 12, fill: GRAY, fontWeight: 500 }} tickFormatter={fmt} axisLine={false} tickLine={false} width={60} dx={-10} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
                {barData.map((entry: BarDataPoint, i: number) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Donut chart ── */}
      {activeTab === "donut" && (
        <ChartCard title="Daily Target Completion">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-4">
            <div className="h-70">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} innerRadius={85} outerRadius={115} dataKey="value" startAngle={90} endAngle={-270} paddingAngle={3}>
                    {donutData.map((entry: DonutDataPoint, i: number) => (
                      <Cell key={i} fill={entry.fill} className="stroke-white stroke-2" />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative pl-6">
                <span className="absolute left-0 top-1.5 w-3 h-3 rounded-full" style={{ background: TEAL }} />
                <p className="text-xs font-bold uppercase text-slate-500">Completed</p>
                <p className="text-4xl font-black text-slate-800">
                  {fmt(liveCount)} <span className="text-sm text-emerald-600">{achieved}%</span>
                </p>
              </div>
              <div className="relative pl-6">
                <span className="absolute left-0 top-1.5 w-3 h-3 rounded-full" style={{ background: GRAY }} />
                <p className="text-xs font-bold uppercase text-slate-500">Remaining</p>
                <p className="text-3xl font-bold text-slate-600">{fmt(remaining)}</p>
              </div>
            </div>
          </div>
        </ChartCard>
      )}
    </div>
  );
}

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
    <p className="text-sm font-medium">Waiting for counter history...</p>
  </div>
);
