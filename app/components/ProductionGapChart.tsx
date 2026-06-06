import { useState, useEffect } from "react";
import axios from "axios";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";

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

const getGapLevel = (gap: number, average: number) => {
  if (gap > average * 3) return { color: "#dc2626", radius: 8 };
  if (gap > average * 2) return { color: "#f97316", radius: 6 };
  if (gap > average * 1.5) return { color: "#eab308", radius: 5 };
  return { color: "#22c55e", radius: 3 };
};

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="bg-white border rounded-lg p-3 shadow">
      <p className="text-xs text-slate-500">{point.time}</p>
      <p className="font-bold text-rose-500">Gap: {point.gapSeconds}s</p>
      <p className="text-indigo-500">Avg: {point.avgGap}s</p>
    </div>
  );
};

export default function ProductionGapChart({ machineId, date }: { machineId: string; date?: string }) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [averageGap, setAverageGap] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const [zoom, setZoom] = useState({
    left: "dataMin",
    right: "dataMax",
    refAreaLeft: "",
    refAreaRight: "",
  });
  const { left, right, refAreaLeft, refAreaRight } = zoom;

  const handleMouseDown = (e: ChartMouseEvent | null | undefined) => {
    if (!e?.activeLabel) return;
    setZoom((prev) => ({ ...prev, refAreaLeft: String(e.activeLabel) }));
  };

  const handleMouseMove = (e: ChartMouseEvent | null | undefined) => {
    if (!zoom.refAreaLeft || !e?.activeLabel) return;
    setZoom((prev) => ({ ...prev, refAreaRight: String(e.activeLabel) }));
  };

  const handleMouseUp = () => {
    if (!zoom.refAreaLeft || !zoom.refAreaRight) return;

    let { refAreaLeft: l, refAreaRight: r } = zoom;
    if (l > r) [l, r] = [r, l];

    setZoom((prev) => ({
      ...prev,
      left: l,
      right: r,
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
      setLoading(true);
      try {
        const url = `http://localhost:3000/api/esp32/${machineId}/production-gaps${date ? `?date=${date}` : ""}`;
        const response = await axios.get<ApiResponse>(url);

        if (response.data.success) {
          const rawData = response.data.data;
          const processed: ChartDataPoint[] = rawData.map((item, i, arr) => {
            const slice = arr.slice(Math.max(0, i - 5), i + 1);
            const avg = slice.reduce((sum, x) => sum + Number(x.gapSeconds), 0) / slice.length;
            return { ...item, avgGap: Number(avg.toFixed(1)) };
          });
          setChartData(processed);
          setAverageGap(response.data.averageGap);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchGapData();
  }, [machineId, date]);

  const downtimeAreas = chartData.filter((item) => item.gapSeconds > 60);

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xs font-black uppercase text-slate-700">Production Gap Analysis</h2>
        {(left !== "dataMin" || right !== "dataMax") && (
          <button onClick={handleZoomOut} className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition">
            Zoom Out
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center text-slate-400">Loading chart data...</div>
      ) : (
        <div className="w-full h-96 min-h-96">
          <ResponsiveContainer width="100%" height={320} minWidth={0} minHeight={0}>
            <LineChart data={chartData} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

              <XAxis
                dataKey="time"
                domain={[left, right]}
                type="category"
                tickFormatter={(value: string) => (value && value.length >= 16 ? value.substring(11, 16) : value)}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis unit="s" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />

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

              {downtimeAreas.map((item, index) => (
                <ReferenceArea key={`downtime-${index}`} x1={item.time} x2={item.time} fill="#ef4444" fillOpacity={0.15} />
              ))}

              <Line
                type="monotone"
                dataKey="gapSeconds"
                stroke="#f43f5e"
                strokeWidth={2}
                activeDot={{ r: 8, fill: "#f43f5e" }}
                // Use implicit parameter inline destructuring to map Recharts runtime arguments perfectly
                dot={(dotProps) => {
                  const { cx, cy, payload, key } = dotProps;
                  if (cx === undefined || cy === undefined || !payload) return <svg key={key || undefined} />;

                  const level = getGapLevel((payload as ChartDataPoint).gapSeconds, averageGap);
                  return <circle key={key || undefined} cx={cx} cy={cy} r={level.radius} fill={level.color} />;
                }}
              />

              <Line type="monotone" dataKey="avgGap" stroke="#6366f1" strokeWidth={2} dot={false} />

              {refAreaLeft && refAreaRight && <ReferenceArea x1={refAreaLeft} x2={refAreaRight} fill="#6366f1" fillOpacity={0.1} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
