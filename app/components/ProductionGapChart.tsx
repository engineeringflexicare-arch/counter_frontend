"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";

interface ProductionGapChartProps {
  machineId: string;
  date?: string;
}

interface ChartMouseEvent {
  activeLabel?: string | number;
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

  return (
    <div className="bg-white border rounded-xl p-3 shadow-lg">
      <p className="text-xs text-slate-500 mb-1">{point.time}</p>

      <p className="font-bold text-rose-500">Gap: {point.gapSeconds}s</p>

      <p className="text-indigo-500">Avg: {point.avgGap}s</p>

      <p className={`font-bold ${point.gapSeconds > (point.avgGap || 0) * 2 ? "text-red-500" : "text-green-500"}`}>{point.gapSeconds > (point.avgGap || 0) * 2 ? "Abnormal" : "Normal"}</p>
    </div>
  );
};

export default function ProductionGapChart({ machineId, date }: ProductionGapChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [averageGap, setAverageGap] = useState(0);
  const [loading, setLoading] = useState(true);

  const [zoom, setZoom] = useState({
    left: "dataMin",
    right: "dataMax",
    refAreaLeft: "",
    refAreaRight: "",
  });

  const { left, right, refAreaLeft, refAreaRight } = zoom;

  const maxGap = useMemo(() => {
    return chartData.length ? Math.max(...chartData.map((d) => d.gapSeconds)) : 0;
  }, [chartData]);

  const downtimeCount = useMemo(() => {
    return chartData.filter((d) => d.gapSeconds > averageGap * 3).length;
  }, [chartData, averageGap]);

  const lineStatus = useMemo(() => {
    if (downtimeCount > 20) return "Critical";
    if (downtimeCount > 10) return "Warning";
    return "Healthy";
  }, [downtimeCount]);

  const downtimeAreas = useMemo(() => chartData.filter((item) => item.gapSeconds > averageGap * 3), [chartData, averageGap]);

  const handleMouseDown = (e: ChartMouseEvent | null | undefined) => {
    if (!e?.activeLabel) return;

    setZoom((prev) => ({
      ...prev,
      refAreaLeft: String(e.activeLabel),
    }));
  };

  const handleMouseMove = (e: ChartMouseEvent | null | undefined) => {
    if (!zoom.refAreaLeft || !e?.activeLabel) return;

    setZoom((prev) => ({
      ...prev,
      refAreaRight: String(e.activeLabel),
    }));
  };

  const handleMouseUp = () => {
    if (!refAreaLeft || !refAreaRight) return;

    let leftBound = refAreaLeft;
    let rightBound = refAreaRight;

    if (leftBound > rightBound) {
      [leftBound, rightBound] = [rightBound, leftBound];
    }

    setZoom((prev) => ({
      ...prev,
      left: leftBound,
      right: rightBound,
      refAreaLeft: "",
      refAreaRight: "",
    }));
  };

  const handleZoomOut = () => {
    setZoom({
      left: "dataMin",
      right: "dataMax",
      refAreaLeft: "",
      refAreaRight: "",
    });
  };

  useEffect(() => {
    const fetchGapData = async () => {
      try {
        setLoading(true);

        const url = `http://localhost:3000/api/esp32/production-gaps/${machineId}` + (date ? `?date=${date}` : "");

        const response = await axios.get<ApiResponse>(url);

        if (response.data.success) {
          const processed = response.data.data.map((item, index, arr) => {
            const slice = arr.slice(Math.max(0, index - 20), index + 1);

            const avg = slice.reduce((sum, current) => sum + Number(current.gapSeconds), 0) / slice.length;

            return {
              ...item,
              avgGap: Number(avg.toFixed(1)),
            };
          });

          setChartData(processed);
          setAverageGap(response.data.averageGap);
        }
      } catch (error) {
        console.error("Production Gap Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGapData();

    const interval = setInterval(fetchGapData, 10000);

    return () => clearInterval(interval);
  }, [machineId, date]);

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full bg-rose-500" />

          <h2 className="text-xs font-black tracking-widest uppercase text-slate-700">Production Gap Analysis</h2>
        </div>

        {(left !== "dataMin" || right !== "dataMax") && (
          <button onClick={handleZoomOut} className="text-xs px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200">
            Zoom Out
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-50 border rounded-xl p-3">
          <p className="text-[10px] uppercase text-slate-500">Average Gap</p>
          <p className="text-xl font-black text-indigo-600">{averageGap}s</p>
        </div>

        <div className="bg-slate-50 border rounded-xl p-3">
          <p className="text-[10px] uppercase text-slate-500">Max Gap</p>
          <p className="text-xl font-black text-rose-600">{maxGap}s</p>
        </div>

        <div className="bg-slate-50 border rounded-xl p-3">
          <p className="text-[10px] uppercase text-slate-500">Downtimes</p>
          <p className="text-xl font-black text-amber-600">{downtimeCount}</p>
        </div>

        <div className="bg-slate-50 border rounded-xl p-3">
          <p className="text-[10px] uppercase text-slate-500">Status</p>

          <p className={`text-xl font-black ${lineStatus === "Healthy" ? "text-green-600" : lineStatus === "Warning" ? "text-yellow-600" : "text-red-600"}`}>{lineStatus}</p>
        </div>
      </div>

      {loading ? (
        <div className="h-87.5 bg-slate-100 animate-pulse rounded-xl" />
      ) : (
        <div className="h-87.5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />

              <XAxis dataKey="time" domain={[left, right]} type="category" minTickGap={40} axisLine={false} tickLine={false} />

              <YAxis domain={[0, Math.max(maxGap + 10, Math.round(averageGap * 4))]} unit="s" axisLine={false} tickLine={false} />

              <Tooltip content={<CustomTooltip />} />

              <ReferenceLine
                y={averageGap}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="6 3"
                label={{
                  value: `AVG ${averageGap}s`,
                  fill: "#b45309",
                  position: "top",
                  fontSize: 10,
                }}
              />

              <ReferenceLine
                y={averageGap * 3}
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{
                  value: `Critical ${Math.round(averageGap * 3)}s`,
                  fill: "#dc2626",
                  position: "top",
                  fontSize: 10,
                }}
              />

              {downtimeAreas.map((item, index) => (
                <ReferenceArea key={index} x1={item.time} x2={item.time} fill="#ef4444" fillOpacity={0.12} />
              ))}

              <Line type="monotone" dataKey="gapSeconds" stroke="#f43f5e" strokeWidth={2} dot={false} />

              <Line type="monotone" dataKey="avgGap" stroke="#6366f1" strokeWidth={2} dot={false} />

              {refAreaLeft && refAreaRight && <ReferenceArea x1={refAreaLeft} x2={refAreaRight} fill="#6366f1" fillOpacity={0.1} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
