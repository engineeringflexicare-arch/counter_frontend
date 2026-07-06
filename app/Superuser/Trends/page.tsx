"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../../lib/api";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  Trophy,
  AlertTriangle,
  Factory,
  Target,
  Package,
  Gauge,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CalendarDays,
  CalendarRange,
} from "lucide-react";
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line as RLine } from "recharts";
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

interface DayEntry {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Mon" or "7"
  output: number;
  target: number;
}

interface LinePeriodStats {
  lineId: string;
  productCode?: string;
  floor?: string;
  currentOutput: number;
  previousOutput: number;
  growthPct: number | null; // null when there's no previous-period data to compare against
}

type ViewMode = "weekly" | "monthly";

// ============================================================================
// Date helpers
// ============================================================================
const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const startOfWeek = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day; // roll back to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (d: Date, n: number) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
};

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

const getDatesInRange = (start: Date, end: Date): Date[] => {
  const dates: Date[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const boundary = new Date(end);
  boundary.setHours(0, 0, 0, 0);
  while (cursor <= boundary) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

// ============================================================================
// Small presentational piece (kept outside the page component so it isn't
// re-created as a new function identity on every render)
// ============================================================================
const GrowthBadge = ({ value }: { value: number | null }) => {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
        <Minus size={12} /> N/A
      </span>
    );
  }
  const isPositive = value > 0.05;
  const isNegative = value < -0.05;
  const colorClass = isPositive ? "text-emerald-600 bg-emerald-50" : isNegative ? "text-red-600 bg-red-50" : "text-slate-500 bg-slate-100";
  const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${colorClass}`}>
      <Icon size={12} />
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
};

export default function TrendsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());

  const [dailyData, setDailyData] = useState<DayEntry[]>([]);
  const [prevPeriodTotal, setPrevPeriodTotal] = useState<number>(0);
  const [lineStats, setLineStats] = useState<LinePeriodStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Memoized once so it never changes reference across re-renders and never
  // causes fetchTrends / its effect to be recreated on every render.
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // ==========================================================================
  // Period range calculation
  // ==========================================================================
  const { periodStart, periodEnd, prevStart, prevEnd, periodLabel } = useMemo(() => {
    if (viewMode === "weekly") {
      const start = startOfWeek(anchorDate);
      const end = addDays(start, 6);
      const pStart = addDays(start, -7);
      const pEnd = addDays(start, -1);
      return {
        periodStart: start,
        periodEnd: end,
        prevStart: pStart,
        prevEnd: pEnd,
        periodLabel: `${start.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} – ${end.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}`,
      };
    } else {
      const start = startOfMonth(anchorDate);
      const end = endOfMonth(anchorDate);
      const prevMonthAnchor = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - 1, 1);
      const pStart = startOfMonth(prevMonthAnchor);
      const pEnd = endOfMonth(prevMonthAnchor);
      return {
        periodStart: start,
        periodEnd: end,
        prevStart: pStart,
        prevEnd: pEnd,
        periodLabel: start.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      };
    }
  }, [viewMode, anchorDate]);

  const isCurrentPeriod = periodEnd >= today && periodStart <= today;
  const canGoNext = periodEnd < today;

  // ==========================================================================
  // Fetch
  // ==========================================================================
  const fetchTrends = useCallback(
    async (isBackgroundRefresh = false) => {
      if (isBackgroundRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const linesRes = await api.get(`/api/lines`);
        const baseLines: LineBase[] = (linesRes.data?.data || []).filter((l: LineBase) => Boolean(l.machineId));

        const currentDates = getDatesInRange(periodStart, periodEnd > today ? today : periodEnd);
        const prevDates = getDatesInRange(prevStart, prevEnd);

        const defaultShiftStart = "08:30";
        const defaultShiftEnd = "20:30";

        // Fetch totalOutput for every (line, date) combination for a period.
        const fetchPeriodTotals = async (dates: Date[]) => {
          const perDate: Record<string, { output: number; target: number }> = {};
          const perLine: Record<string, number> = {};
          const dayTarget = baseLines.reduce((s, l) => s + (l.dailyTarget || l.targetCount || 0), 0);

          await Promise.all(
            dates.map(async (d) => {
              const dateStr = fmt(d);

              const results = await Promise.all(
                baseLines.map(async (line) => {
                  try {
                    const shiftStart = line.shiftStartTime || defaultShiftStart;
                    const shiftEnd = line.shiftEndTime || defaultShiftEnd;
                    const res = await api.get(
                      `/api/esp32/hourly-table/${line.machineId}?date=${dateStr}&shiftStartTime=${encodeURIComponent(shiftStart)}&shiftEndTime=${encodeURIComponent(shiftEnd)}`,
                    );
                    return { lineId: line.lineId, output: res.data?.totalOutput || 0 };
                  } catch {
                    return { lineId: line.lineId, output: 0 };
                  }
                }),
              );

              const dayOutput = results.reduce((s, r) => s + r.output, 0);
              perDate[dateStr] = { output: dayOutput, target: dayTarget };

              results.forEach((r) => {
                perLine[r.lineId] = (perLine[r.lineId] || 0) + r.output;
              });
            }),
          );

          return { perDate, perLine };
        };

        const [currentResult, prevResult] = await Promise.all([fetchPeriodTotals(currentDates), fetchPeriodTotals(prevDates)]);

        // Build the full daily series for the chart (including future days in
        // the current week/month as 0, so the week/month shape is visible).
        const allCurrentDates = getDatesInRange(periodStart, periodEnd);
        const series: DayEntry[] = allCurrentDates.map((d) => {
          const dateStr = fmt(d);
          const entry = currentResult.perDate[dateStr];
          return {
            date: dateStr,
            label: viewMode === "weekly" ? d.toLocaleDateString("en-GB", { weekday: "short" }) : String(d.getDate()),
            output: entry?.output || 0,
            target: entry?.target || 0,
          };
        });

        setDailyData(series);

        const prevTotalOutput = Object.values(prevResult.perDate).reduce((s, v) => s + v.output, 0);
        setPrevPeriodTotal(prevTotalOutput);

        const stats: LinePeriodStats[] = baseLines.map((line) => {
          const curr = currentResult.perLine[line.lineId] || 0;
          const prev = prevResult.perLine[line.lineId] || 0;
          const growth = prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : null;
          return {
            lineId: line.lineId,
            productCode: line.productCode,
            floor: line.floor,
            currentOutput: curr,
            previousOutput: prev,
            growthPct: growth,
          };
        });
        stats.sort((a, b) => b.currentOutput - a.currentOutput);
        setLineStats(stats);
      } catch (err) {
        console.error("Trends fetch error:", err);
        setError("Failed to load trend analytics");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [periodStart, periodEnd, prevStart, prevEnd, viewMode, today],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTrends();
  }, [fetchTrends]);

  useEffect(() => {
    if (!isCurrentPeriod) return;
    const interval = setInterval(() => fetchTrends(true), 60000);
    return () => clearInterval(interval);
  }, [isCurrentPeriod, fetchTrends]);

  // ==========================================================================
  // Derived
  // ==========================================================================
  const currentTotalOutput = useMemo(() => dailyData.reduce((s, d) => s + d.output, 0), [dailyData]);
  const currentTotalTarget = useMemo(() => dailyData.reduce((s, d) => s + d.target, 0), [dailyData]);
  const currentCompletion = currentTotalTarget > 0 ? (currentTotalOutput / currentTotalTarget) * 100 : 0;

  const periodGrowthPct = prevPeriodTotal > 0 ? ((currentTotalOutput - prevPeriodTotal) / prevPeriodTotal) * 100 : currentTotalOutput > 0 ? 100 : 0;

  const todayStr = fmt(today);

  const avgDailyOutput = useMemo(() => {
    const daysWithData = dailyData.filter((d) => d.date <= todayStr);
    return daysWithData.length > 0 ? currentTotalOutput / daysWithData.length : 0;
  }, [dailyData, currentTotalOutput, todayStr]);

  const bestDay = useMemo(() => [...dailyData].filter((d) => d.output > 0).sort((a, b) => b.output - a.output)[0], [dailyData]);
  const worstDay = useMemo(() => {
    const past = dailyData.filter((d) => d.date <= todayStr);
    return [...past].sort((a, b) => a.output - b.output)[0];
  }, [dailyData, todayStr]);

  const chartData = dailyData.map((d) => ({
    ...d,
    completion: d.target > 0 ? Number(((d.output / d.target) * 100).toFixed(1)) : 0,
  }));

  // ==========================================================================
  // Navigation
  // ==========================================================================
  const goPrev = () => {
    if (viewMode === "weekly") setAnchorDate((prev) => addDays(prev, -7));
    else setAnchorDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNext = () => {
    if (!canGoNext) return;
    if (viewMode === "weekly") setAnchorDate((prev) => addDays(prev, 7));
    else setAnchorDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToday = () => setAnchorDate(new Date());

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
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white">Production Trends</h1>
              <p className="text-slate-300 text-xs mt-0.5">Weekly & monthly output growth analysis</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center rounded-lg bg-white/10 p-1">
              <button
                onClick={() => setViewMode("weekly")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  viewMode === "weekly" ? "bg-white text-slate-900" : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <CalendarDays size={14} /> Weekly
              </button>
              <button
                onClick={() => setViewMode("monthly")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  viewMode === "monthly" ? "bg-white text-slate-900" : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <CalendarRange size={14} /> Monthly
              </button>
            </div>

            {/* Period navigator */}
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
              <button onClick={goPrev} className="p-1 rounded-md hover:bg-white/10 text-white transition-colors" aria-label="Previous period">
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-2 text-white min-w-37.5 justify-center">
                <Calendar size={14} />
                <span className="text-xs font-semibold whitespace-nowrap">{periodLabel}</span>
              </div>
              <button
                onClick={goNext}
                disabled={!canGoNext}
                className="p-1 rounded-md hover:bg-white/10 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next period"
              >
                <ChevronRight size={16} />
              </button>
              {!isCurrentPeriod && (
                <button onClick={goToday} className="text-[10px] font-semibold text-blue-300 hover:text-blue-200 underline ml-1">
                  Today
                </button>
              )}
              <div className="w-px h-5 bg-white/20 mx-1" />
              <button onClick={() => fetchTrends(true)} className="p-1 rounded-md hover:bg-white/10 text-white transition-colors" aria-label="Refresh">
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="rounded-xl p-3 bg-blue-50 text-blue-600">
              <Package className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] lg:text-xs font-medium text-slate-500 truncate">Total Output</p>
              <p className="text-[12px] lg:text-xl font-bold text-slate-800">{currentTotalOutput.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="rounded-xl p-3 bg-amber-50 text-amber-600">
              <Target className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] lg:text-xs font-medium text-slate-500 truncate">Target</p>
              <p className="text-[12px] lg:text-xl font-bold text-slate-800">{currentTotalTarget.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="rounded-xl p-3 bg-purple-50 text-purple-600">
              <Gauge className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] lg:text-xs font-medium text-slate-500 truncate">Completion</p>
              <p className="text-[12px] lg:text-xl font-bold text-slate-800">{currentCompletion.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="rounded-xl p-3 bg-indigo-50 text-indigo-600">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] lg:text-xs font-medium text-slate-500 truncate">Avg / Day</p>
              <p className="text-[12px] lg:text-xl font-bold text-slate-800">{Math.round(avgDailyOutput).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`rounded-xl p-3 ${periodGrowthPct >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
              {periodGrowthPct >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] lg:text-xs font-medium text-slate-500 truncate">vs Previous {viewMode === "weekly" ? "Week" : "Month"}</p>
              <p className={`text-[12px] lg:text-xl font-bold ${periodGrowthPct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {periodGrowthPct > 0 ? "+" : ""}
                {periodGrowthPct.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Best / Worst day highlight */}
        {(bestDay || worstDay) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {bestDay && (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Best Day</p>
                    <p className="text-sm font-bold text-slate-800">{new Date(bestDay.date).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })}</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-600">{bestDay.output.toLocaleString()}</p>
              </div>
            )}
            {worstDay && worstDay.date !== bestDay?.date && (
              <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-red-100 p-2.5 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Lowest Day</p>
                    <p className="text-sm font-bold text-slate-800">{new Date(worstDay.date).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })}</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-red-600">{worstDay.output.toLocaleString()}</p>
              </div>
            )}
          </div>
        )}

        {/* Daily output chart (output vs target + completion line) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-8">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Daily Output {viewMode === "weekly" ? "This Week" : "This Month"}</h2>
          </div>
          <div className="h-80 w-full">
            {chartData.every((d) => d.output === 0) ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">No production data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} cursor={{ fill: "rgba(148,163,184,0.1)" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="target" name="Target" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="output" name="Output" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <RLine yAxisId="right" type="monotone" dataKey="completion" name="Completion %" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Per-line growth table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Factory className="h-5 w-5 text-slate-500" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Line Performance · This {viewMode === "weekly" ? "Week" : "Month"} vs Previous</h2>
          </div>
          {lineStats.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-slate-400">No lines with assigned machines</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2 pr-4 font-semibold">Line</th>
                    <th className="py-2 pr-4 font-semibold">Product</th>
                    <th className="py-2 pr-4 font-semibold">This {viewMode === "weekly" ? "Week" : "Month"}</th>
                    <th className="py-2 pr-4 font-semibold">Previous</th>
                    <th className="py-2 pr-4 font-semibold">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {lineStats.map((s) => (
                    <tr key={s.lineId} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 pr-4 font-medium text-slate-700">{s.lineId.replaceAll("_", " ")}</td>
                      <td className="py-2.5 pr-4 text-slate-600">{s.productCode || "—"}</td>
                      <td className="py-2.5 pr-4 font-semibold text-slate-800">{s.currentOutput.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{s.previousOutput.toLocaleString()}</td>
                      <td className="py-2.5 pr-4">
                        <GrowthBadge value={s.growthPct} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
