"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceArea } from "recharts";

interface ProductionGapChartProps {
  machineId: string;
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

export default function ProductionGapChart({ machineId, date }: ProductionGapChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const [averageGap, setAverageGap] = useState(0);

  const [loading, setLoading] = useState(true);

  const maxGap = useMemo(() => {
    return chartData.length ? Math.max(...chartData.map((d) => d.gapSeconds)) : 0;
  }, [chartData]);

  const downtimeCount = useMemo(() => {
    return chartData.filter((d) => d.gapSeconds > averageGap * 2).length;
  }, [chartData, averageGap]);

  const lineStatus = useMemo(() => {
    if (downtimeCount > 50) return "Critical";

    if (downtimeCount > 20) return "Warning";

    return "Healthy";
  }, [downtimeCount]);

  const downtimeAreas = useMemo(() => {
    return chartData.filter((d) => d.gapSeconds > averageGap * 2);
  }, [chartData, averageGap]);

  const chartMax = useMemo(() => {
    return Math.min(maxGap, averageGap * 10);
  }, [maxGap, averageGap]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const url = `http://localhost:3000/api/esp32/production-gaps/${machineId}` + (date ? `?date=${date}` : "");

        const response = await axios.get<ApiResponse>(url);

        if (response.data.success) {
          const plannedGap = response.data.averageGap;

          const processed = response.data.data.map((item) => ({
            ...item,
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
  }, [machineId, date]);

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <span className="w-1.5 h-6 rounded-full bg-rose-500" />

        <h2 className="text-xs font-black tracking-widest uppercase text-slate-700">Production Gap Analysis</h2>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-50 border rounded-xl p-4">
          <p className="text-[10px] uppercase text-slate-500">Planned Gap</p>

          <p className="text-2xl font-black text-indigo-600">{averageGap}s</p>
        </div>

        <div className="bg-slate-50 border rounded-xl p-4">
          <p className="text-[10px] uppercase text-slate-500">Max Gap</p>

          <p className="text-2xl font-black text-rose-600">{maxGap}s</p>
        </div>

        <div className="bg-slate-50 border rounded-xl p-4">
          <p className="text-[10px] uppercase text-slate-500">Downtimes</p>

          <p className="text-2xl font-black text-amber-600">{downtimeCount}</p>
        </div>

        <div className="bg-slate-50 border rounded-xl p-4">
          <p className="text-[10px] uppercase text-slate-500">Status</p>

          <p className={`text-2xl font-black ${lineStatus === "Healthy" ? "text-green-600" : lineStatus === "Warning" ? "text-yellow-600" : "text-red-600"}`}>{lineStatus}</p>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-87.5 bg-slate-100 animate-pulse rounded-xl" />
      ) : (
        <div className="h-87.5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />

              <XAxis dataKey="time" minTickGap={40} axisLine={false} tickLine={false} />

              <YAxis domain={[0, Math.max(chartMax, averageGap * 4)]} unit="s" axisLine={false} tickLine={false} />

              <Tooltip content={<CustomTooltip />} />

              {/* Planned Gap */}
              <ReferenceLine y={averageGap} stroke="#2563eb" strokeWidth={2} strokeDasharray="5 5" />

              {/* Critical Line */}
              <ReferenceLine y={averageGap * 2} stroke="#dc2626" strokeWidth={2} strokeDasharray="6 6" />

              {/* Downtime Highlight */}
              {downtimeAreas.map((item, index) => (
                <ReferenceArea key={index} x1={item.time} x2={item.time} fill="#ef4444" fillOpacity={0.1} />
              ))}

              {/* Actual Gap */}
              <Line type="monotone" dataKey="gapSeconds" stroke="#f43f5e" strokeWidth={1.5} dot={false} />

              {/* Planned Gap Trend */}
              <Line type="monotone" dataKey="avgGap" stroke="#2563eb" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
