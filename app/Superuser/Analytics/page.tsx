"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../../lib/api";
import { BarChart3, PieChart as PieIcon, TrendingUp, Calendar, RefreshCw, Trophy, AlertTriangle, Factory, Target, Package, Gauge, ChevronLeft, ChevronRight, Clock, Layers } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";
import Loader from "../../components/Loader";

// ============================================================================
// Types
// ============================================================================
interface LineBase {
  lineId: string;
  machineId?: string;
  productCode?: string;
  floor?: string;
  dailyTarget?: number;
  targetCount?: number;
  shiftStartTime?: string;
  shiftEndTime?: string;
}

interface RunData {
  runNo: number;
  startTime: string;
  endTime: string;
  totalOutput: number;
  hourlyData: { hour: string; output: number }[];
}

interface LineAnalytics extends LineBase {
  totalOutput: number;
  target: number;
  completion: number;
  firstTime: string | null;
  hourlyData: { hour: string; output: number }[];
  runs: RunData[];
}

interface ProductGroup {
  productCode: string;
  output: number;
  target: number;
  completion: number;
  lineCount: number;
  lines: LineAnalytics[];
}

// ============================================================================
// Helpers
// ============================================================================
const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const parseBucketStartMinutes = (label: string): number | null => {
  if (!label || !label.includes("-")) return null;
  const [startStr] = label.split("-");
  const [h, m] = startStr.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
};

const completionColor = (pct: number) => {
  if (pct >= 100) return { bar: "#10b981", text: "text-emerald-600", bg: "bg-emerald-50" };
  if (pct >= 85) return { bar: "#3b82f6", text: "text-blue-600", bg: "bg-blue-50" };
  if (pct >= 60) return { bar: "#f59e0b", text: "text-amber-600", bg: "bg-amber-50" };
  return { bar: "#ef4444", text: "text-red-600", bg: "bg-red-50" };
};

const PRODUCT_PALETTE = ["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#f43f5e", "#84cc16", "#06b6d4"];

export default function AnalyticsPage() {
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [lines, setLines] = useState<LineAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedLineId, setSelectedLineId] = useState<string>("");

  const isToday = selectedDate === formatDate(new Date());

  // ==========================================================================
  // Fetch: all lines -> per-line hourly-table data for selectedDate
  // ==========================================================================
  const fetchAnalytics = useCallback(async (date: string, isBackgroundRefresh = false) => {
    if (isBackgroundRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const linesRes = await api.get(`/api/lines`);
      const baseLines: LineBase[] = linesRes.data?.data || [];

      const results = await Promise.all(
        baseLines.map(async (line) => {
          const target = line.dailyTarget || line.targetCount || 0;

          if (!line.machineId) {
            return {
              ...line,
              target,
              totalOutput: 0,
              completion: 0,
              firstTime: null,
              hourlyData: [],
              runs: [],
            } as LineAnalytics;
          }

          try {
            const start = line.shiftStartTime || "08:30";
            const end = line.shiftEndTime || "20:30";
            const res = await api.get(`/api/esp32/hourly-table/${line.machineId}?date=${date}&shiftStartTime=${encodeURIComponent(start)}&shiftEndTime=${encodeURIComponent(end)}`);

            const totalOutput = res.data?.totalOutput || 0;

            return {
              ...line,
              target,
              totalOutput,
              completion: target > 0 ? (totalOutput / target) * 100 : 0,
              firstTime: res.data?.firstTime || null,
              hourlyData: res.data?.hourlyData || [],
              runs: res.data?.runs || [],
            } as LineAnalytics;
          } catch {
            return {
              ...line,
              target,
              totalOutput: 0,
              completion: 0,
              firstTime: null,
              hourlyData: [],
              runs: [],
            } as LineAnalytics;
          }
        }),
      );

      setLines(results);
      setSelectedLineId((prev) => (prev && results.some((r) => r.lineId === prev) ? prev : results[0]?.lineId || ""));
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAnalytics(selectedDate);
  }, [selectedDate, fetchAnalytics]);

  // Auto-refresh only for "today" (live-ish), every 30s
  useEffect(() => {
    if (!isToday) return;
    const interval = setInterval(() => fetchAnalytics(selectedDate, true), 30000);
    return () => clearInterval(interval);
  }, [isToday, selectedDate, fetchAnalytics]);

  // ==========================================================================
  // Derived data
  // ==========================================================================
  const totalOutput = useMemo(() => lines.reduce((s, l) => s + l.totalOutput, 0), [lines]);
  const totalTarget = useMemo(() => lines.reduce((s, l) => s + l.target, 0), [lines]);
  const overallCompletion = totalTarget > 0 ? (totalOutput / totalTarget) * 100 : 0;
  const totalRuns = useMemo(() => lines.reduce((s, l) => s + l.runs.length, 0), [lines]);

  const rankedLines = useMemo(() => [...lines].filter((l) => l.target > 0).sort((a, b) => b.completion - a.completion), [lines]);
  const bestLine = rankedLines[0];
  const worstLine = rankedLines[rankedLines.length - 1];

  const productGroups: ProductGroup[] = useMemo(() => {
    const map = new Map<string, ProductGroup>();
    lines.forEach((l) => {
      const code = l.productCode?.trim() || "Unassigned";
      const existing = map.get(code);
      if (existing) {
        existing.output += l.totalOutput;
        existing.target += l.target;
        existing.lineCount += 1;
        existing.lines.push(l);
      } else {
        map.set(code, {
          productCode: code,
          output: l.totalOutput,
          target: l.target,
          completion: 0,
          lineCount: 1,
          lines: [l],
        });
      }
    });
    return Array.from(map.values())
      .map((p) => ({ ...p, completion: p.target > 0 ? (p.output / p.target) * 100 : 0 }))
      .sort((a, b) => b.output - a.output);
  }, [lines]);

  const pieData = productGroups.filter((p) => p.output > 0).map((p) => ({ name: p.productCode, value: p.output, completion: p.completion, target: p.target }));

  const barData = useMemo(
    () =>
      [...lines]
        .filter((l) => l.target > 0)
        .sort((a, b) => b.completion - a.completion)
        .map((l) => ({
          name: l.lineId.replaceAll("_", " "),
          completion: Number(l.completion.toFixed(1)),
          output: l.totalOutput,
          target: l.target,
          fill: completionColor(l.completion).bar,
        })),
    [lines],
  );

  // ✅ FIX (react-hooks/immutability): replaced the `let cumulative` +
  // reassignment-inside-.map pattern with a pure `reduce`. Each step derives
  // the running total from the accumulator array instead of mutating a
  // variable captured from the outer scope, so there's nothing left for
  // React to flag as an unsafe reassignment after render.
  const combinedTrend = useMemo(() => {
    const byStartMin: Record<number, { label: string; output: number }> = {};
    lines.forEach((l) => {
      l.hourlyData.forEach((item) => {
        const startMin = parseBucketStartMinutes(item.hour);
        if (startMin === null) return;
        if (!byStartMin[startMin]) byStartMin[startMin] = { label: item.hour, output: 0 };
        byStartMin[startMin].output += item.output || 0;
      });
    });

    const sortedKeys = Object.keys(byStartMin)
      .map(Number)
      .sort((a, b) => a - b);

    return sortedKeys.reduce<{ hour: string; output: number; cumulative: number }[]>((acc, min) => {
      const bucket = byStartMin[min];
      const prevCumulative = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
      acc.push({ hour: bucket.label, output: bucket.output, cumulative: prevCumulative + bucket.output });
      return acc;
    }, []);
  }, [lines]);

  const selectedLine = lines.find((l) => l.lineId === selectedLineId);

  // ==========================================================================
  // Date navigation
  // ==========================================================================
  const shiftDate = (deltaDays: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + deltaDays);
    const next = formatDate(d);
    if (next > formatDate(new Date())) return; // never allow future dates
    setSelectedDate(next);
  };

  // ==========================================================================
  // Render
  // ==========================================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-red-500 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl bg-linear-to-r from-slate-900 to-slate-700 p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white">Production Analytics</h1>
              <p className="text-slate-300 text-xs mt-0.5">Product completion & historical performance</p>
            </div>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
            <button onClick={() => shiftDate(-1)} className="p-1.5 rounded-md hover:bg-white/10 text-white transition-colors" aria-label="Previous day">
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2 text-white">
              <Calendar size={16} />
              <input
                type="date"
                value={selectedDate}
                max={formatDate(new Date())}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm font-medium outline-none scheme-dark"
              />
            </div>
            <button
              onClick={() => shiftDate(1)}
              disabled={isToday}
              className="p-1.5 rounded-md hover:bg-white/10 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next day"
            >
              <ChevronRight size={16} />
            </button>
            <div className="w-px h-5 bg-white/20 mx-1" />
            <button onClick={() => fetchAnalytics(selectedDate, true)} className="p-1.5 rounded-md hover:bg-white/10 text-white transition-colors" aria-label="Refresh">
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
            {isToday && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-300 font-medium ml-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Output", value: totalOutput.toLocaleString(), icon: Package, accent: "bg-blue-50 text-blue-600" },
            { label: "Total Target", value: totalTarget.toLocaleString(), icon: Target, accent: "bg-amber-50 text-amber-600" },
            { label: "Overall Completion", value: `${overallCompletion.toFixed(1)}%`, icon: Gauge, accent: "bg-purple-50 text-purple-600" },
            { label: "Production Runs", value: totalRuns, icon: Layers, accent: "bg-indigo-50 text-indigo-600" },
            { label: "Product Codes", value: productGroups.length, icon: Factory, accent: "bg-emerald-50 text-emerald-600" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className={`rounded-xl p-3 ${stat.accent}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] lg:text-xs font-medium text-slate-500 truncate">{stat.label}</p>
                <p className="text-[12px] lg:text-xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Best / Worst performer highlight strip */}
        {(bestLine || worstLine) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {bestLine && (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Top Performer</p>
                    <p className="text-sm font-bold text-slate-800">{bestLine.lineId.replaceAll("_", " ")}</p>
                    <p className="text-xs text-slate-500">{bestLine.productCode || "No product"}</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-600">{bestLine.completion.toFixed(1)}%</p>
              </div>
            )}
            {worstLine && worstLine.lineId !== bestLine?.lineId && (
              <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-red-100 p-2.5 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Needs Attention</p>
                    <p className="text-sm font-bold text-slate-800">{worstLine.lineId.replaceAll("_", " ")}</p>
                    <p className="text-xs text-slate-500">{worstLine.productCode || "No product"}</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-red-600">{worstLine.completion.toFixed(1)}%</p>
              </div>
            )}
          </div>
        )}

        {/* Pie chart (Product Code share) + Completion breakdown list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <PieIcon className="h-5 w-5 text-indigo-600" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Output Share by Product</h2>
            </div>
            <div className="h-72 w-full">
              {pieData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">No production data for this date</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                      {pieData.map((entry, i) => (
                        <Cell key={entry.name} fill={PRODUCT_PALETTE[i % PRODUCT_PALETTE.length]} />
                      ))}
                    </Pie>
                    {/* ✅ FIX: recharts' Formatter type allows `value` to be
                        undefined internally, which clashed with a strict
                        `number` param type. Params are left untyped (any)
                        here and coerced manually, matching recharts' own
                        loosely-typed formatter signature. */}
                    <Tooltip
                      formatter={(value, _name, props) => {
                        const numeric = Number(value) || 0;
                        const completionPct = Number(props?.payload?.completion) || 0;
                        return [`${numeric.toLocaleString()} units (${completionPct.toFixed(1)}% of target)`, props?.payload?.name];
                      }}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Completion by product list */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Target className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Completion by Product</h2>
            </div>
            {productGroups.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-slate-400">No production data for this date</div>
            ) : (
              <div className="space-y-4">
                {productGroups.map((p, i) => {
                  const colors = completionColor(p.completion);
                  return (
                    <div key={p.productCode}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: PRODUCT_PALETTE[i % PRODUCT_PALETTE.length] }} />
                          <span className="text-sm font-semibold text-slate-700 truncate">{p.productCode}</span>
                          <span className="text-xs text-slate-400 shrink-0">
                            ({p.lineCount} line{p.lineCount > 1 ? "s" : ""})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-500">
                            {p.output.toLocaleString()} / {p.target.toLocaleString()}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{p.completion.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(p.completion, 100)}%`, backgroundColor: colors.bar }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Completion by Line (bar chart) + Cumulative trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Completion % by Line</h2>
            </div>
            <div className="h-80 w-full">
              {barData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">No lines with a target set</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip
                      formatter={(value, _name, props) => {
                        const pct = Number(value) || 0;
                        const output = Number(props?.payload?.output) || 0;
                        const target = Number(props?.payload?.target) || 0;
                        return [`${pct}% (${output.toLocaleString()} / ${target.toLocaleString()})`, "Completion"];
                      }}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                      cursor={{ fill: "rgba(148,163,184,0.1)" }}
                    />
                    <Bar dataKey="completion" name="Completion" radius={[0, 4, 4, 0]}>
                      {barData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Cumulative Output · {selectedDate}</h2>
            </div>
            <div className="h-80 w-full">
              {combinedTrend.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">No production data for this date</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={combinedTrend} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <defs>
                      <linearGradient id="cumFillAnalytics" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={20} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => Number(value).toLocaleString()} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="#10b981" strokeWidth={2.5} fill="url(#cumFillAnalytics)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Run history drill-down */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-500" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Production Run History</h2>
            </div>
            <select
              value={selectedLineId}
              onChange={(e) => setSelectedLineId(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-500"
            >
              {lines.map((l) => (
                <option key={l.lineId} value={l.lineId}>
                  {l.lineId.replaceAll("_", " ")} {l.productCode ? `· ${l.productCode}` : ""}
                </option>
              ))}
            </select>
          </div>

          {!selectedLine || selectedLine.runs.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-slate-400">No production runs recorded for this line on {selectedDate}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2 pr-4 font-semibold">Run #</th>
                    <th className="py-2 pr-4 font-semibold">Start</th>
                    <th className="py-2 pr-4 font-semibold">End</th>
                    <th className="py-2 pr-4 font-semibold">Output</th>
                    <th className="py-2 pr-4 font-semibold">Share of Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLine.runs.map((run) => {
                    const share = selectedLine.totalOutput > 0 ? (run.totalOutput / selectedLine.totalOutput) * 100 : 0;
                    return (
                      <tr key={run.runNo} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 pr-4 font-medium text-slate-700">#{run.runNo}</td>
                        <td className="py-2.5 pr-4 text-slate-600">{run.startTime}</td>
                        <td className="py-2.5 pr-4 text-slate-600">{run.endTime}</td>
                        <td className="py-2.5 pr-4 font-semibold text-slate-800">{run.totalOutput.toLocaleString()}</td>
                        <td className="py-2.5 pr-4 w-48">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full bg-blue-500" style={{ width: `${share}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 w-10 text-right">{share.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detailed line breakdown table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mt-8">
          <div className="flex items-center gap-2 mb-6">
            <Factory className="h-5 w-5 text-slate-500" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">All Lines · {selectedDate}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-4 font-semibold">Line</th>
                  <th className="py-2 pr-4 font-semibold">Product Code</th>
                  <th className="py-2 pr-4 font-semibold">Floor</th>
                  <th className="py-2 pr-4 font-semibold">Output</th>
                  <th className="py-2 pr-4 font-semibold">Target</th>
                  <th className="py-2 pr-4 font-semibold">Completion</th>
                  <th className="py-2 pr-4 font-semibold">Runs</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => {
                  const colors = completionColor(l.completion);
                  return (
                    <tr key={l.lineId} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 pr-4 font-medium text-slate-700">{l.lineId.replaceAll("_", " ")}</td>
                      <td className="py-2.5 pr-4 text-slate-600">{l.productCode || "—"}</td>
                      <td className="py-2.5 pr-4 text-slate-600">{l.floor?.replaceAll("_", " ") || "—"}</td>
                      <td className="py-2.5 pr-4 font-semibold text-slate-800">{l.totalOutput.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-slate-600">{l.target.toLocaleString()}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{l.completion.toFixed(1)}%</span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">{l.runs.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
