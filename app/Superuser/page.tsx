"use client";

import { useEffect, useState, useCallback } from "react";
import api from "../../lib/api";
import { useRouter } from "next/navigation";
import { Factory, Layers, Activity, Package, Target, Gauge, BarChart3, PieChart as PieIcon, TrendingUp, LineChart as LineIcon } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line as RLine } from "recharts";
import LineCard from "../components/Linecard";
import { MachineHealth } from "../components/MachineHealthBadge"; // නිවැරදිව Interface එක import කර ඇත
import Loader from "../components/Loader";

interface Line {
  lineId: string;
  machineId?: string;
  productCode?: string;
  targetCount?: number;
  totalProductCount?: number;
  dailyTarget?: number;
  floor?: string;
  health?: MachineHealth;
  shiftStartTime?: string; // e.g. "08:30"  — ADDED
  shiftEndTime?: string; // e.g. "20:30"  — ADDED
}

// Helper: parse a bucket label like "08:00-09:00" into its start minute-of-day
const parseBucketStartMinutes = (label: string): number | null => {
  if (!label || !label.includes("-")) return null;
  const [startStr] = label.split("-");
  const [h, m] = startStr.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
};

export default function SuperuserDashboard() {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // අද දිනයට සියලුම Line වල පැය අනුව output එකතුව (hourly + cumulative)
  const [hourlyTrend, setHourlyTrend] = useState<{ hour: string; output: number; cumulative: number }[]>([]);

  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const fetchAllLines = useCallback(async () => {
    try {
      setError("");

      // "/api/esp32/lines" කියන endpoint එක backend එකේ නැහැ (404).
      // Lines endpoint එක තියෙන්නේ LineRouter එකේ "/api/lines" කියලා, array එකක් විදිහට.
      const res = await api.get(`/api/lines`);
      const data: Line[] = res.data?.data || [];

      // Fetch Machine Health + Live Count Status
      const healthRes = await api.get(`/api/esp32/machine-status`).catch(() => null);
      const healthData = healthRes?.data?.data || [];

      if (Array.isArray(data)) {
        const linesArray: Line[] = data.map((line) => {
          const mStatus = healthData.find((h: MachineHealth & { liveCount?: number }) => h.machineId === line.machineId);

          return {
            ...line,
            health: mStatus,
            // ✅ FIX: merge live Firebase count into totalProductCount.
            // Previously this was never populated from anywhere, so
            // "Total Products", the Output bars, and each LineCard's
            // current progress always showed 0.
            totalProductCount: mStatus?.liveCount ?? line.totalProductCount ?? 0,
          };
        });

        setLines(linesArray);
      } else {
        setLines([]);
      }
    } catch (err) {
      console.error("Error fetching lines:", err);
      setError("Failed to load production lines");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAllLines();

    const interval = setInterval(() => {
      fetchAllLines();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchAllLines]);

  // අද දිනයට සියලුම Line වල පැය අනුව output එකතු කර cumulative trend එක ගණනය කිරීම
  // FIX: now sends each line's own shiftStartTime/shiftEndTime to the API,
  // and merges multi-machine buckets by actual start-minute-of-day instead
  // of raw label string, so lines on different shifts still align correctly.
  useEffect(() => {
    const eligibleLines = lines.filter((l) => Boolean(l.machineId));

    let isMounted = true;
    const fetchHourlyTrend = async () => {
      if (eligibleLines.length === 0) {
        if (isMounted) setHourlyTrend([]);
        return;
      }

      try {
        const responses = await Promise.all(
          eligibleLines.map(async (line) => {
            try {
              const start = line.shiftStartTime || "08:30";
              const end = line.shiftEndTime || "20:30";

              const res = await api.get(`/api/esp32/hourly-production/${line.machineId}` + `?date=${today}&shiftStartTime=${encodeURIComponent(start)}&shiftEndTime=${encodeURIComponent(end)}`);
              return res.data?.success && Array.isArray(res.data.hourlyData) ? (res.data.hourlyData as { hour: string; output: number }[]) : [];
            } catch {
              return [];
            }
          }),
        );

        // පැය අනුව සියලුම machines වල output එකතු කිරීම
        // (merged by actual start-minute-of-day, not the raw label string)
        const byStartMin: Record<number, { label: string; output: number }> = {};

        responses.flat().forEach((item) => {
          const startMin = parseBucketStartMinutes(item.hour);
          if (startMin === null) return;

          if (!byStartMin[startMin]) {
            byStartMin[startMin] = { label: item.hour, output: 0 };
          }
          byStartMin[startMin].output += item.output || 0;
        });

        let cumulative = 0;
        const trend = Object.keys(byStartMin)
          .map(Number)
          .sort((a, b) => a - b)
          .map((startMin) => {
            const bucket = byStartMin[startMin];
            cumulative += bucket.output;
            return { hour: bucket.label, output: bucket.output, cumulative };
          });

        if (isMounted) setHourlyTrend(trend);
      } catch (err) {
        console.error("Error fetching hourly trend:", err);
      }
    };

    fetchHourlyTrend();
    const interval = setInterval(fetchHourlyTrend, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [lines, today]);

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

  // සමස්ත (aggregate) සංඛ්‍යාලේඛන
  const totalLines = lines.length;
  const activeMachines = lines.filter((l) => l.machineId).length;
  const totalProducts = lines.reduce((sum, l) => sum + (l.totalProductCount || 0), 0);
  const totalTarget = lines.reduce((sum, l) => sum + (l.dailyTarget || l.targetCount || 0), 0);
  const overallProgress = totalTarget > 0 ? ((totalProducts / totalTarget) * 100).toFixed(1) : "0.0";

  const stats = [
    { label: "Total Lines", value: totalLines, icon: Factory, accent: "bg-blue-50 text-blue-600" },
    { label: "Active Machines", value: activeMachines, icon: Activity, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Total Products", value: totalProducts.toLocaleString(), icon: Package, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Total Target", value: totalTarget.toLocaleString(), icon: Target, accent: "bg-amber-50 text-amber-600" },
    { label: "Overall Progress", value: `${overallProgress}%`, icon: Gauge, accent: "bg-purple-50 text-purple-600" },
  ];

  // Floor අනුව Lines කාණ්ඩ කිරීම
  const floorGroups = lines.reduce<Record<string, Line[]>>((acc, line) => {
    const floor = line.floor || "Unassigned";
    (acc[floor] ||= []).push(line);
    return acc;
  }, {});
  const floorNames = Object.keys(floorGroups).sort();

  // Bar Chart: එක් එක් Line එකේ Output එදිරිව Target
  const lineChartData = lines.map((l) => ({
    name: l.lineId.replaceAll("_", " "),
    output: l.totalProductCount || 0,
    target: l.dailyTarget || l.targetCount || 0,
  }));

  // Donut Chart: Floor අනුව Products බෙදීයාම
  const floorPalette = ["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6"];
  const floorPieData = floorNames
    .map((floor) => ({
      name: floor.replaceAll("_", " "),
      value: floorGroups[floor].reduce((sum, l) => sum + (l.totalProductCount || 0), 0),
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-linear-to-r from-slate-900 to-slate-700 p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3">
              <Factory className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white">Production Control Center</h1>
              <p className="text-slate-300 text-xs mt-0.5">Live overview across all floors and lines</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-white">Live · updates every 5s</span>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {stats.map((stat) => (
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

        {/* Charts */}
        {lines.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Output vs Target Bar Chart */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Output vs Target by Line</h2>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lineChartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} cursor={{ fill: "rgba(148,163,184,0.1)" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="target" name="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="output" name="Output" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Products by Floor Donut Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <PieIcon className="h-5 w-5 text-indigo-600" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Products by Floor</h2>
              </div>
              <div className="h-72 w-full">
                {floorPieData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">No production data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={floorPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                        {floorPieData.map((entry, i) => (
                          <Cell key={entry.name} fill={floorPalette[i % floorPalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => Number(value).toLocaleString()} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cumulative & Hourly Trend Charts (අද දිනය) */}
        {lines.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Cumulative Production Area Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Cumulative Production · Today</h2>
              </div>
              <div className="h-72 w-full">
                {hourlyTrend.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">No production data yet today</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyTrend} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                      <defs>
                        <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={20} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value) => Number(value).toLocaleString()} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="#10b981" strokeWidth={2.5} fill="url(#cumFill)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Hourly Output Line Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <LineIcon className="h-5 w-5 text-blue-600" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Hourly Output · Today</h2>
              </div>
              <div className="h-72 w-full">
                {hourlyTrend.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">No production data yet today</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourlyTrend} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={20} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value) => Number(value).toLocaleString()} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <RLine type="monotone" dataKey="output" name="Output / hour" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No Data */}
        {lines.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <p className="text-gray-500 text-lg">No Production Lines Available</p>
          </div>
        ) : (
          /* Floor අනුව කාණ්ඩ කළ Lines */
          <div className="flex flex-col gap-8">
            {floorNames.map((floor) => (
              <section key={floor}>
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="h-5 w-5 text-slate-500" />
                  <h2 className="text-lg font-bold text-slate-700">{floor.replaceAll("_", " ")}</h2>
                  <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{floorGroups[floor].length}</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  {floorGroups[floor].map((line) => (
                    <button key={line.lineId} onClick={() => router.push(`/Superuser/${line.lineId}`)} className="text-left cursor-pointer transition-transform hover:scale-105 focus:outline-none">
                      <LineCard
                        line={line.lineId}
                        product={line.productCode || "N/A"}
                        machine={line.machineId || "No Machine"}
                        target={line.targetCount || line.dailyTarget || 0}
                        current={line.totalProductCount || 0}
                        health={line.health}
                      />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
