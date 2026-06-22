"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";

interface ProductionGapChartProps {
  lineId: string;
  date?: string;
}

interface ChartDataPoint {
  count: number;
  time: string;
  gapSeconds: number;
  avgGap?: number;
}

interface ApiResponse {
  success: boolean;
  averageGap: number;
  startTime?: string;
  endTime?: string;
  dailyTarget?: number;
  data: Omit<ChartDataPoint, "avgGap">[];
}

interface TooltipPayloadItem {
  payload: ChartDataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;
  const isDowntime = point.gapSeconds > (point.avgGap || 0) * 2;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg">
      <p className="text-xs text-slate-500 mb-2">{point.time}</p>
      <p className="font-bold text-rose-500">Actual Gap : {point.gapSeconds}s</p>
      <p className="font-bold text-indigo-500">Planned Gap : {point.avgGap}s</p>
      <p className={`font-bold ${isDowntime ? "text-red-600" : "text-green-600"}`}>{isDowntime ? "Downtime" : "Normal"}</p>
    </div>
  );
};

export default function ProductionGapChart({ lineId, date }: ProductionGapChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [averageGap, setAverageGap] = useState(0);
  const [loading, setLoading] = useState(!!lineId && lineId !== "undefined");

  const maxGap = useMemo(() => {
    if (!Array.isArray(chartData) || chartData.length === 0) return 0;
    return Math.max(...chartData.map((d) => Number(d.gapSeconds) || 0));
  }, [chartData]);

  const downtimeCount = useMemo(() => {
    if (!Array.isArray(chartData)) return 0;
    return chartData.filter((d) => (Number(d.gapSeconds) || 0) > averageGap * 2).length;
  }, [chartData, averageGap]);

  const lineStatus = useMemo(() => {
    if (downtimeCount > 50) return "Critical";
    if (downtimeCount > 20) return "Warning";
    return "Healthy";
  }, [downtimeCount]);

  const chartMax = useMemo(() => {
    const safeMaxGap = Number(maxGap) || 0;
    const safeAvgGap = Number(averageGap) || 0;
    return Math.min(safeMaxGap, safeAvgGap * 10);
  }, [maxGap, averageGap]);

  useEffect(() => {
    if (!lineId || lineId === "undefined") {
      return;
    }

    const fetchData = async () => {
      try {
        let url = `/api/esp32/production-gaps?lineId=${lineId}`;

        if (date) {
          url += `&date=${date}`;
        }

        const response = await api.get<ApiResponse>(url);

        if (response.data?.success) {
          const plannedGap = Number(response.data.averageGap) || 0;
          const rawData = Array.isArray(response.data.data) ? response.data.data : [];

          const processed = rawData.map((item) => ({
            ...item,
            gapSeconds: Number(item.gapSeconds) || 0,
            avgGap: plannedGap,
          }));

          setChartData(processed);
          setAverageGap(plannedGap);
        }
      } catch (error) {
        console.error("Production Gap Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [lineId, date]);

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 w-full min-w-0">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-1.5 h-6 rounded-full bg-rose-500" />
        <h2 className="text-xs font-black tracking-widest uppercase text-slate-700">Production Gap Analysis</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] uppercase text-slate-500 font-bold">Planned Gap</p>
          <p className="text-2xl font-black text-indigo-600">{averageGap}s</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] uppercase text-slate-500 font-bold">Max Gap</p>
          <p className="text-2xl font-black text-rose-600">{maxGap}s</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] uppercase text-slate-500 font-bold">Status</p>
          <p className={`text-2xl font-black ${lineStatus === "Healthy" ? "text-green-600" : lineStatus === "Warning" ? "text-yellow-600" : "text-red-600"}`}>{lineStatus}</p>
        </div>
      </div>

      {loading && chartData.length === 0 ? (
        // ⚠️ h-75 ඉවත් කර h-64 යොදා ඇත
        <div className="h-64 w-full bg-slate-100 animate-pulse rounded-xl" />
      ) : chartData.length === 0 ? (
        // ⚠️ h-75 ඉවත් කර h-64 යොදා ඇත
        <div className="h-64 w-full flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          <p className="text-slate-500 font-medium">No Production Gap Data Available for this Line</p>
        </div>
      ) : (
        <div className="w-full min-w-0 h-64">
          {/* ⚠️ height="100%" වෙනුවට height={256} භාවිතා කර ඇත (-1 error එක වැළැක්වීමට) */}
          <ResponsiveContainer width="100%" height={256}>
            <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" dy={10} minTickGap={40} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis domain={[0, Math.max(chartMax, averageGap * 4, 10)]} unit="s" dx={-10} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={averageGap} stroke="#2563eb" strokeDasharray="5 5" strokeWidth={2} label={{ value: "Planned Gap", position: "right", fill: "#2563eb", fontSize: 12 }} />
              <ReferenceLine y={averageGap * 2} stroke="#dc2626" strokeDasharray="6 6" strokeWidth={2} label={{ value: "Downtime", position: "right", fill: "#dc2626", fontSize: 12 }} />

              <Line
                type="monotone"
                dataKey="gapSeconds"
                stroke="#f43f5e"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, fill: "#f43f5e", stroke: "#fff", strokeWidth: 2 }}
                isAnimationActive={false}
              />
              <Line type="monotone" dataKey="avgGap" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
